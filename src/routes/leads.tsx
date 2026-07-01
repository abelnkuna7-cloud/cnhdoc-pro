import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, hasActiveAccess } from "@/lib/auth-context";
import { searchLeads, type Lead } from "@/lib/leads.functions";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Gauteng Lead Finder — NexDocs" },
      {
        name: "description",
        content:
          "Find business leads across Gauteng — Johannesburg, Pretoria, Sandton, Centurion — powered by OpenStreetMap.",
      },
    ],
  }),
  component: LeadsPage,
});

const SUGGESTIONS = [
  "Construction companies in Sandton",
  "Restaurants in Pretoria",
  "Plumbers in Centurion",
  "Estate agents in Midrand",
  "Cleaning services in Johannesburg",
  "IT companies in Rosebank",
];

function LeadsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const run = useServerFn(searchLeads);

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const active = hasActiveAccess(profile);

  const doSearch = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    if (!active) { navigate({ to: "/subscribe" }); return; }
    setBusy(true);
    setError(null);
    setLeads([]);
    setSearched(true);
    try {
      const res = await run({ data: { query: text } });
      if (!res.ok) setError(res.error);
      else setLeads(res.leads);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    if (!leads.length) return;
    const rows = [
      ["Name", "Type", "Address", "Phone", "Website", "Maps"],
      ...leads.map((l) => [
        l.name,
        l.type ?? "",
        l.address ?? "",
        l.phone ?? "",
        l.website ?? "",
        l.mapsUrl ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gauteng-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">Gauteng Lead Finder</h1>
          <p className="text-sm text-muted-foreground">
            Search live business listings across Gauteng — powered by OpenStreetMap.
          </p>
        </div>
        <Link to="/dashboard" className="text-sm text-gold hover:underline whitespace-nowrap">
          ← Dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5">
        <form
          onSubmit={(e) => { e.preventDefault(); doSearch(); }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. construction companies in Sandton"
            className="flex-1 rounded-md bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="rounded-md bg-gold-gradient px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Searching…" : "Find leads"}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); doSearch(s); }}
              className="rounded-full border border-border/60 px-3 py-1 text-xs text-foreground/80 hover:border-gold/60"
            >
              {s}
            </button>
          ))}
        </div>

        {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
      </div>

      {searched && !busy && !error && leads.length === 0 && (
        <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-6 text-center text-muted-foreground">
          No leads found. Try a different search — e.g. "electricians in Pretoria".
        </div>
      )}

      {leads.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-foreground">{leads.length} result{leads.length === 1 ? "" : "s"}</h2>
            <button
              onClick={exportCsv}
              className="rounded-md border border-gold/60 px-3 py-1.5 text-sm font-semibold text-foreground"
            >
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-xl border border-border/60 bg-card/70 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-foreground">{l.name}</div>
                  {l.type && (
                    <div className="text-xs text-gold whitespace-nowrap capitalize">
                      {l.type}
                    </div>
                  )}
                </div>
                {l.address && <div className="text-xs text-muted-foreground">{l.address}</div>}
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {l.phone && (
                    <a
                      href={`tel:${l.phone.replace(/\s+/g, "")}`}
                      className="rounded-full bg-gold-gradient px-3 py-1 font-semibold text-primary-foreground"
                    >
                      📞 {l.phone}
                    </a>
                  )}
                  {l.phone && (
                    <a
                      href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-gold/60 px-3 py-1 text-foreground"
                    >
                      WhatsApp
                    </a>
                  )}
                  {l.website && (
                    <a
                      href={l.website}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border/60 px-3 py-1 text-foreground/80"
                    >
                      Website
                    </a>
                  )}
                  {l.mapsUrl && (
                    <a
                      href={l.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border/60 px-3 py-1 text-foreground/80"
                    >
                      Map
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
