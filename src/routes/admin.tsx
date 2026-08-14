import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  listWorkspaceBusinessUnits,
  type BusinessUnit,
} from "@/lib/nexdocs-data";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Cossa Nexus workspace — NexDocs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminWorkspace,
});

function AdminWorkspace() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [documentCount, setDocumentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && user && profile && !profile.isCossaWorkspace) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (!profile?.isCossaWorkspace) return;

    const load = async () => {
      const [workspaceUnits, countResult] = await Promise.all([
        listWorkspaceBusinessUnits(profile),
        supabase
          .from("nexdocs_document_drafts")
          .select("id", { count: "exact", head: true }),
      ]);
      setUnits(workspaceUnits);
      setDocumentCount(countResult.count ?? 0);
    };

    void load().catch((error) => console.error("Could not load Cossa workspace", error));
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="px-4 py-20 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!profile.isCossaWorkspace) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-card to-charcoal/80 p-6 shadow-2xl shadow-black/25 sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Private administrator workspace
        </div>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          Cossa Nexus document operations
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          This view is available because your verified account has organisation administrator access. Visitor accounts do not receive these company details or business-unit access.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Active business units</div>
            <div className="mt-1 font-display text-3xl text-gold">{units.length}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">NexDocs drafts</div>
            <div className="mt-1 font-display text-3xl text-gold">
              {documentCount === null ? "…" : documentCount}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Growth connection</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Ready</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-foreground">Business units</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose one when issuing a document in the guided brief.
              </p>
            </div>
            <Link to="/dashboard" className="text-sm font-bold text-gold hover:text-gold-soft">
              Create document →
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {units.map((unit) => (
              <div key={unit.id} className="rounded-xl border border-border/60 bg-background/25 p-4">
                <div className="flex items-center gap-3">
                  {unit.slug === "cossa-nexus-construction" ? (
                    <img
                      src="/logos/cossa-nexus-construction-logo.jpg"
                      alt=""
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15 font-display text-lg text-gold">
                      {unit.name.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{unit.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Private business unit</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-gold/30 bg-card/70 p-5 sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Shared operational view</div>
          <h2 className="mt-2 font-display text-2xl text-foreground">NexDocs in Growth</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Every document generated from this administrator workspace is added to the Cossa Growth document activity register. Customer and visitor documents remain private and are not copied into Cossa operations.
          </p>
          <a
            href="https://growth.cossanexusholdings.co.za/operations/nexdocs"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-xl bg-gold-gradient px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            Open NexDocs activity in Growth
          </a>
        </aside>
      </div>
    </div>
  );
}
