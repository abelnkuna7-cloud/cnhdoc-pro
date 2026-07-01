## Fix Overpass 406 error in Lead Finder

**Cause:** Overpass API mirrors (especially `overpass-api.de`) reject requests that don't advertise an acceptable response type and a proper `User-Agent`. Our current `fetch` sends only `Content-Type`, so the server responds `406 Not Acceptable`.

**Fix:** In `src/lib/leads.functions.ts`, add two request headers to each mirror call:

- `Accept: application/json`
- `User-Agent: NexDocs-LeadFinder/1.0 (+https://nexdoc-pro.lovable.app)`

No other logic changes — same mirrors, same query, same parsing. This is a one-line-per-header addition inside the existing `for (const mirror of MIRRORS)` loop.

**Verify:** after the edit, invoke the `searchLeads` server function with `"Construction companies in Sandton"` and confirm `ok: true` with a non-empty `leads` array.
