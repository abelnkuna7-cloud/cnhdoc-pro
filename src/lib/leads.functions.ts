const overpassQuery = `
[out:json][timeout:25];
(
  node${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
  way${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
);
out tags center 30;
`.trim();

const MIRRORS = [
  "[overpass-api.de](https://overpass-api.de/api/interpreter)",
  "[overpass.kumi.systems](https://overpass.kumi.systems/api/interpreter)",
  "[maps.mail.ru](https://maps.mail.ru/osm/tools/overpass/api/interpreter)",
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
    const res = await fetch(mirror, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: "data=" + encodeURIComponent(overpassQuery),
    });

    if (!res.ok) {
      const text = await res.text();
      lastError = `Overpass ${res.status} (${mirror}): ${text.slice(0, 150)}`;
      continue;
    }

    json = (await res.json()) as OverpassJson;
    break;
  } catch (e) {
    lastError = e instanceof Error ? `Request to ${mirror} failed: ${e.message}` : `Request to ${mirror} failed`;
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
      t.amenity ||
      t.shop ||
      t.craft ||
      t.office ||
      t.tourism ||
      t.leisure ||
      undefined;

    return {
      id: `${el.type}/${el.id}`,
      name,
      address,
      phone: t.phone || t["contact:phone"],
      website: t.website || t["contact:website"],
      type: typeLabel ? typeLabel.replace(/_/g, " ") : undefined,
      mapsUrl:
        lat != null && lon != null
          ? `[openstreetmap.org](https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon})`
          : undefined,
    } satisfies Lead;
  })
  .filter((l): l is Lead => l !== null);

const seen = new Set<string>();
const dedupedLeads = leads
  .filter((l) => {
    const key = `${l.name.toLowerCase()}|${l.address ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .slice(0, 50);

return { ok: true, leads: dedupedLeads };
