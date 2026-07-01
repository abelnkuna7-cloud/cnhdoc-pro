import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Lead = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  type?: string;
  mapsUrl?: string;
};

// Gauteng bounding box: south,west,north,east
const GAUTENG_BBOX = "-26.85,27.65,-25.55,28.90";

// Map common keywords → OSM tag filters
const TYPE_MAP: Record<string, string> = {
  restaurant: '["amenity"="restaurant"]',
  restaurants: '["amenity"="restaurant"]',
  cafe: '["amenity"="cafe"]',
  cafes: '["amenity"="cafe"]',
  bar: '["amenity"="bar"]',
  bars: '["amenity"="bar"]',
  hotel: '["tourism"="hotel"]',
  hotels: '["tourism"="hotel"]',
  plumber: '["craft"="plumber"]',
  plumbers: '["craft"="plumber"]',
  electrician: '["craft"="electrician"]',
  electricians: '["craft"="electrician"]',
  builder: '["craft"="builder"]',
  builders: '["craft"="builder"]',
  construction: '["office"="construction_company"]',
  contractor: '["office"="construction_company"]',
  contractors: '["office"="construction_company"]',
  cleaning: '["office"="cleaning"]',
  cleaner: '["office"="cleaning"]',
  cleaners: '["office"="cleaning"]',
  estate: '["office"="estate_agent"]',
  agent: '["office"="estate_agent"]',
  agents: '["office"="estate_agent"]',
  it: '["office"="it"]',
  tech: '["office"="it"]',
  lawyer: '["office"="lawyer"]',
  lawyers: '["office"="lawyer"]',
  accountant: '["office"="accountant"]',
  accountants: '["office"="accountant"]',
  shop: '["shop"]',
  shops: '["shop"]',
  store: '["shop"]',
  stores: '["shop"]',
};

function buildFilters(query: string): { tagFilter: string; nameClause: string } {
  const lower = query.toLowerCase();
  let tagFilter = "";
  for (const key of Object.keys(TYPE_MAP)) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) {
      tagFilter = TYPE_MAP[key];
      break;
    }
  }
  // Extract "in <place>" as a name hint
  const inMatch = lower.match(/\bin\s+([a-z\s]+)$/);
  const place = inMatch?.[1]?.trim();
  const nameClause = place
    ? `["addr:city"~"${place}",i]`
    : "";
  // If no tag matched, fall back to name search
  if (!tagFilter) {
    const q = query.replace(/\s+in\s+.+$/i, "").trim();
    tagFilter = `["name"~"${q}",i]`;
  }
  return { tagFilter, nameClause };
}

export const searchLeads = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ query: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { tagFilter, nameClause } = buildFilters(data.query);
    const requireName = '["name"]';

    const overpassQuery = `
[out:json][timeout:25];
(
  node${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
  way${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
);
out tags center 30;
`.trim();

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
        const res = await fetch(mirror, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "application/json",
            "User-Agent": "NexDocs-LeadFinder/1.0 (+https://nexdoc-pro.lovable.app)",
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
      return { ok: false as const, error: lastError || "All Overpass mirrors failed" };
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
              ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
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

    return { ok: true as const, leads: dedupedLeads };
  });
