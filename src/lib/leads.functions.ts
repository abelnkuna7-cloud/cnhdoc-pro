const overpassQuery = `
        [out:json][timeout:25];
        (
          node${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
          way${tagFilter}${nameClause}${requireName}(${GAUTENG_BBOX});
        );
        out tags center 30;
      `.trim();

      // Free public Overpass mirrors, tried in order. If one is down, rate-limited,
      // or rejects the request (e.g. 406), we fall through to the next one —
      // so the feature never depends on a single point of failure.
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
          // Overpass's documented method is GET with the query as a URL param.
          // Sending POST with a form content-type is what triggered the 406 —
          // some mirrors are strict about the request shape they'll accept.
          const url = `${mirror}?data=${encodeURIComponent(overpassQuery)}`;
          const res = await fetch(url, { method: "GET" });

          if (!res.ok) {
            const text = await res.text();
            lastError = `Overpass ${res.status} (${mirror}): ${text.slice(0, 150)}`;
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
        .filter((l): l is Lead => l !== null);

      // De-duplicate: OSM sometimes tags the same business as both a node and a
      // way, which would otherwise show the same place twice in results.
      const seen = new Set<string>();
      const dedupedLeads = leads.filter((l) => {
        const key = `${l.name.toLowerCase()}|${l.address ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 50);

      return { ok: true, leads: dedupedLeads };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Search failed" };
    }
  });
