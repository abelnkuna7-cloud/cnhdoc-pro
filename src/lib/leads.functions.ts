const overpassQuery = `
  [out:json][timeout:25];
  (
    node\( {tagFilter} \){nameClause}\( {requireName}( \){GAUTENG_BBOX});
    way\( {tagFilter} \){nameClause}\( {requireName}( \){GAUTENG_BBOX});
  );
  out tags center 30;
`.trim();

// Free public Overpass mirrors...
const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

type OverpassJson = {
  elements?: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;
};

let json: OverpassJson | null = null;
let lastError = "";

for (const mirror of MIRRORS) {
  try {
    const url = `\( {mirror}?data= \){encodeURIComponent(overpassQuery)}`;
    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      const text = await res.text();
      lastError = `Overpass \( {res.status} ( \){mirror}): ${text.slice(0, 150)}`;
      continue;
    }

    json = (await res.json()) as OverpassJson;
    break;
  } catch (e) {
    lastError = e instanceof Error ? e.message : `Request to ${mirror} failed`;
    continue;
  }
}

if (!json) {
  return { ok: false, error: lastError || "All Overpass mirrors failed" };
}

const leads: Lead[] = (json.elements ?? [])
  .map((el) => {
    const t = el.tags ?? {};
    const name = t.name;
    if (!name) return null;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;

    const addressParts = [
      t["addr:housenumber"],
      t["addr:street"],
      t["addr:suburb"],
      t["addr:city"],
      t["addr:postcode"],
    ].filter(Boolean);
    const address = addressParts.length ? addressParts.join(", ") : undefined;

    const typeLabel =
      t.amenity || t.shop || t.craft || t.office || t.tourism || t.leisure || undefined;

    return {
      id: `\( {el.type}/ \){el.id}`,
      name,
      address,
      phone: t.phone || t["contact:phone"],
      website: t.website || t["contact:website"],
      type: typeLabel ? typeLabel.replace(/_/g, " ") : undefined,
      mapsUrl:
        lat != null && lon != null
          ? `https://www.openstreetmap.org/?mlat=\( {lat}&mlon= \){lon}#map=18/\( {lat}/ \){lon}`
          : undefined,
    } as Lead;
  })
  .filter((l): l is Lead => l !== null);

// De-duplicate...
const seen = new Set<string>();
const dedupedLeads = leads.filter((l) => {
  const key = `\( {l.name.toLowerCase()}| \){l.address ?? ""}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}).slice(0, 50);

return { ok: true, leads: dedupedLeads };
} catch (e) {
  return { ok: false, error: e instanceof Error ? e.message : "Search failed" };
}
