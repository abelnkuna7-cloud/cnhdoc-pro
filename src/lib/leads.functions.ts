import { createServerFn } from "@tanstack/react-start";

export type Lead = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  type?: string;
  mapsUrl?: string;
  rating?: number;
  reviews?: number;
};

export type SearchLeadsResult =
  | { ok: true; leads: Lead[] }
  | { ok: false; error: string };

// Gauteng province bounding box (south, west, north, east)
const GAUTENG_BBOX = "-26.85,27.4,-25.3,28.9";

// Map common business keywords to OSM tag filters
const TYPE_MAP: Record<string, string> = {
  restaurant: "amenity=restaurant",
  restaurants: "amenity=restaurant",
  cafe: "amenity=cafe",
  cafes: "amenity=cafe",
  coffee: "amenity=cafe",
  bar: "amenity=bar",
  bars: "amenity=bar",
  pub: "amenity=pub",
  hotel: "tourism=hotel",
  hotels: "tourism=hotel",
  school: "amenity=school",
  schools: "amenity=school",
  hospital: "amenity=hospital",
  hospitals: "amenity=hospital",
  clinic: "amenity=clinic",
  pharmacy: "amenity=pharmacy",
  pharmacies: "amenity=pharmacy",
  bank: "amenity=bank",
  banks: "amenity=bank",
  atm: "amenity=atm",
  gym: "leisure=fitness_centre",
  gyms: "leisure=fitness_centre",
  fitness: "leisure=fitness_centre",
  supermarket: "shop=supermarket",
  supermarkets: "shop=supermarket",
  store: "shop=convenience",
  stores: "shop=convenience",
  shop: "shop",
  shops: "shop",
  plumber: "craft=plumber",
  plumbers: "craft=plumber",
  electrician: "craft=electrician",
  electricians: "craft=electrician",
  builder: "craft=builder",
  builders: "craft=builder",
  construction: "craft=builder",
  carpenter: "craft=carpenter",
  carpenters: "craft=carpenter",
  painter: "craft=painter",
  painters: "craft=painter",
  mechanic: "shop=car_repair",
  mechanics: "shop=car_repair",
  car: "shop=car",
  cars: "shop=car",
  bakery: "shop=bakery",
  bakeries: "shop=bakery",
  butcher: "shop=butcher",
  hairdresser: "shop=hairdresser",
  salon: "shop=hairdresser",
  beauty: "shop=beauty",
  estate: "office=estate_agent",
  agent: "office=estate_agent",
  agents: "office=estate_agent",
  lawyer: "office=lawyer",
  lawyers: "office=lawyer",
  accountant: "office=accountant",
  accountants: "office=accountant",
  it: "office=it",
  tech: "office=it",
  cleaning: "shop=dry_cleaning",
  cleaners: "shop=dry_cleaning",
  laundry: "shop=laundry",
  petrol: "amenity=fuel",
  fuel: "amenity=fuel",
  garage: "amenity=fuel",
};

const STOPWORDS = new Set([
  "in", "at", "near", "around", "the", "a", "an", "and", "for", "with",
  "gauteng", "south", "africa", "sa",
]);

function buildOverpassQuery(query: string): { tag: string; nameFilter?: string } {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let tag: string | null = null;
  const remaining: string[] = [];

  for (const w of words) {
    if (!tag && TYPE_MAP[w]) {
      tag = TYPE_MAP[w];
    } else if (!STOPWORDS.has(w)) {
      remaining.push(w);
    }
  }

  // Fallback: no recognized business type — search by name across all shops/offices/amenities
  if (!tag) tag = "shop";

  const nameFilter = remaining.length ? remaining.join(" ") : undefined;
  return { tag, nameFilter };
}

export const searchLeads = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => {
    const q = (input?.query ?? "").trim();
    if (!q) throw new Error("Query is required");
    if (q.length > 200) throw new Error("Query too long");
    return { query: q };
  })
  .handler(async ({ data }): Promise<SearchLeadsResult> => {
    try {
      const { tag, nameFilter } = buildOverpassQuery(data.query);

      // Build tag filter — supports "key=value" or bare "key"
      const tagFilter = tag.includes("=")
        ? `["${tag.split("=")[0]}"="${tag.split("=")[1]}"]`
        : `["${tag}"]`;

      const nameClause = nameFilter
        ? `["name"~"${nameFilter.replace(/"/g, "")}",i]`
        : "";

      // Require a name so we filter out unnamed POIs
      const requireName = nameFilter ? "" : `["name"]`;

      const overpassQuery = `
        [out:json][timeout:25];
        (
          node${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
          way${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
        );
        out tags center 30;
      `.trim();

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(overpassQuery),
      });

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Overpass ${res.status}: ${text.slice(0, 200)}` };
      }

      const json = (await res.json()) as {
        elements?: Array<{
          type: string;
          id: number;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: Record<string, string>;
        }>;
      };

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

          // Friendly type label
          const typeLabel =
            t.amenity || t.shop || t.craft || t.office || t.tourism || t.leisure || undefined;

          return {
            id: `${el.type}/${el.id}`,
            name,
            address,
            phone: t.phone || t["contact:phone"],
            website: t.website || t["contact:website"],
            type: typeLabel ? typeLabel.replace(/_/g, " ") : undefined,
            mapsUrl:
              lat != null && lon != null
                ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
                : undefined,
          } as Lead;
        })
        .filter((l): l is Lead => l !== null)
        .slice(0, 50);

      return { ok: true, leads };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Search failed" };
    }
  });
