import { createServerFn } from "@tanstack/react-start";

export type Lead = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  mapsUrl?: string;
};

export type SearchLeadsResult =
  | { ok: true; leads: Lead[] }
  | { ok: false; error: string };

// Gauteng province bounding rectangle (approx).
const GAUTENG_BIAS = {
  rectangle: {
    low: { latitude: -26.85, longitude: 27.4 },
    high: { latitude: -25.3, longitude: 28.9 },
  },
};

export const searchLeads = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => {
    const q = (input?.query ?? "").trim();
    if (!q) throw new Error("Query is required");
    if (q.length > 200) throw new Error("Query too long");
    return { query: q };
  })
  .handler(async ({ data }): Promise<SearchLeadsResult> => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return { ok: false, error: "Server missing GOOGLE_PLACES_API_KEY" };

    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.nationalPhoneNumber",
            "places.internationalPhoneNumber",
            "places.websiteUri",
            "places.rating",
            "places.userRatingCount",
            "places.googleMapsUri",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: `${data.query} in Gauteng, South Africa`,
          regionCode: "ZA",
          locationBias: GAUTENG_BIAS,
          maxResultCount: 20,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Places API ${res.status}: ${text.slice(0, 200)}` };
      }

      const json = (await res.json()) as {
        places?: Array<{
          id: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          nationalPhoneNumber?: string;
          internationalPhoneNumber?: string;
          websiteUri?: string;
          rating?: number;
          userRatingCount?: number;
          googleMapsUri?: string;
        }>;
      };

      const leads: Lead[] = (json.places ?? []).map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "Unnamed business",
        address: p.formattedAddress,
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
        website: p.websiteUri,
        rating: p.rating,
        reviews: p.userRatingCount,
        mapsUrl: p.googleMapsUri,
      }));

      return { ok: true, leads };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Search failed" };
    }
  });
