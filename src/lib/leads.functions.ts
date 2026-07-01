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

// Bounding boxes: south,west,north,east. Smaller city boxes keep Overpass fast
// and avoid filtering out businesses that do not have addr:city tags.
const GAUTENG_BBOX = "-26.85,27.65,-25.55,28.90";

const PLACE_BBOX: Record<string, string> = {
  gauteng: GAUTENG_BBOX,
  johannesburg: "-26.35,27.85,-26.05,28.20",
  joburg: "-26.35,27.85,-26.05,28.20",
  jhb: "-26.35,27.85,-26.05,28.20",
  pretoria: "-25.90,28.05,-25.60,28.40",
  tshwane: "-25.95,27.90,-25.45,28.55",
  sandton: "-26.16,28.00,-26.02,28.13",
  centurion: "-25.95,28.05,-25.78,28.25",
  midrand: "-26.08,27.98,-25.88,28.18",
  rosebank: "-26.17,28.02,-26.12,28.06",
  randburg: "-26.16,27.90,-26.02,28.04",
  roodepoort: "-26.24,27.78,-26.05,27.98",
  boksburg: "-26.28,28.18,-26.10,28.35",
  benoni: "-26.24,28.24,-26.05,28.43",
  kempton: "-26.16,28.18,-26.00,28.32",
  germiston: "-26.30,28.08,-26.10,28.25",
  soweto: "-26.36,27.78,-26.16,27.96",
  alberton: "-26.36,28.03,-26.20,28.18",
  vereeniging: "-26.75,27.82,-26.55,28.05",
  vanderbijlpark: "-26.78,27.75,-26.62,27.92",
  springs: "-26.34,28.35,-26.16,28.55",
  krugersdorp: "-26.16,27.68,-26.02,27.88",
};

// Map common keywords → one or more OSM filters. OSM data is inconsistent,
// so each business type includes practical alternatives that appear in SA.
const TYPE_MAP: Record<string, string[]> = {
  restaurant: ['["amenity"="restaurant"]', '["amenity"="fast_food"]'],
  restaurants: ['["amenity"="restaurant"]', '["amenity"="fast_food"]'],
  cafe: ['["amenity"="cafe"]'],
  cafes: ['["amenity"="cafe"]'],
  bar: ['["amenity"="bar"]', '["amenity"="pub"]'],
  bars: ['["amenity"="bar"]', '["amenity"="pub"]'],
  hotel: ['["tourism"="hotel"]', '["tourism"="guest_house"]'],
  hotels: ['["tourism"="hotel"]', '["tourism"="guest_house"]'],
  plumber: ['["craft"="plumber"]', '["name"~"plumb|plumber|plumbing",i]'],
  plumbers: ['["craft"="plumber"]', '["name"~"plumb|plumber|plumbing",i]'],
  electrician: ['["craft"="electrician"]', '["name"~"electric|electrical",i]'],
  electricians: ['["craft"="electrician"]', '["name"~"electric|electrical",i]'],
  builder: ['["craft"="builder"]', '["shop"="hardware"]', '["name"~"builder|building|construction|contractor",i]'],
  builders: ['["craft"="builder"]', '["shop"="hardware"]', '["name"~"builder|building|construction|contractor",i]'],
  construction: ['["office"="construction_company"]', '["craft"="builder"]', '["shop"="hardware"]', '["name"~"construction|builder|building|contractor|cashbuild",i]'],
  contractor: ['["office"="construction_company"]', '["craft"="builder"]', '["name"~"contractor|construction|builder",i]'],
  contractors: ['["office"="construction_company"]', '["craft"="builder"]', '["name"~"contractor|construction|builder",i]'],
  cleaning: ['["office"="cleaning"]', '["name"~"clean|cleaning|hygiene",i]'],
  cleaner: ['["office"="cleaning"]', '["name"~"clean|cleaning|hygiene",i]'],
  cleaners: ['["office"="cleaning"]', '["name"~"clean|cleaning|hygiene",i]'],
  estate: ['["office"="estate_agent"]', '["name"~"estate|property|properties|realty",i]'],
  agent: ['["office"="estate_agent"]', '["name"~"estate|property|properties|realty",i]'],
  agents: ['["office"="estate_agent"]', '["name"~"estate|property|properties|realty",i]'],
  it: ['["office"="it"]', '["shop"="computer"]', '["name"~"information technology|tech|technology|computer|digital",i]'],
  tech: ['["office"="it"]', '["shop"="computer"]', '["name"~"tech|technology|computer|digital",i]'],
  lawyer: ['["office"="lawyer"]', '["name"~"law|attorney|attorneys|legal",i]'],
  lawyers: ['["office"="lawyer"]', '["name"~"law|attorney|attorneys|legal",i]'],
  accountant: ['["office"="accountant"]', '["name"~"account|accounting|tax",i]'],
  accountants: ['["office"="accountant"]', '["name"~"account|accounting|tax",i]'],
  shop: ['["shop"]'],
  shops: ['["shop"]'],
  store: ['["shop"]'],
  stores: ['["shop"]'],
};

function escapeOverpassRegex(value: string) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/\s+/g, ".*");
}

function buildFilters(query: string): { tagFilters: string[]; bbox: string } {
  const lower = query.toLowerCase().trim();
  const inMatch = lower.match(/\bin\s+([a-z\s]+)$/);
  const place = inMatch?.[1]?.trim();
  const bbox = place ? (PLACE_BBOX[place] ?? GAUTENG_BBOX) : GAUTENG_BBOX;

  for (const key of Object.keys(TYPE_MAP)) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) {
      return { tagFilters: TYPE_MAP[key], bbox };
    }
  }

  const q = query.replace(/\s+in\s+.+$/i, "").trim();
  return { tagFilters: [`["name"~"${escapeOverpassRegex(q)}",i]`], bbox };
}

export const searchLeads = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ query: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { tagFilters, bbox } = buildFilters(data.query);
    const requireName = '["name"]';

    const selectors = tagFilters
      .flatMap((tagFilter) => ["node", "way", "relation"].map((kind) => `  ${kind}${tagFilter}${requireName}(${bbox});`))
      .join("\n");

    const overpassQuery = `
[out:json][timeout:25];
(
${selectors}
);
out tags center 80;
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
      .map((el): Lead | null => {
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
        };
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
