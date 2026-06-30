import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type UserRow = {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: number;
  trialEndsAt?: number;
  subscriptionStatus?: string;
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "CEO Dashboard — Cossa Nexus Holdings" },
      { name: "description", content: "Cossa Nexus Holdings CEO dashboard — manage NexDocs users, trials, and active R99/month subscriptions." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "CEO Dashboard — Cossa Nexus Holdings" },
      { property: "og:description", content: "Internal CEO dashboard for Cossa Nexus Holdings." },
      { property: "og:url", content: "https://nexdoc-cossanexusholdings.lovable.app/admin" },
    ],
    links: [{ rel: "canonical", href: "https://nexdoc-cossanexusholdings.lovable.app/admin" }],
  }),
  component: Admin,
});

function Admin() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth" });
      else if (profile && !profile.isAdmin) navigate({ to: "/dashboard" });
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (!profile?.isAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(collection(getDb(), "users"));
        const rows: UserRow[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const created = data.createdAt as { toMillis?: () => number } | number | undefined;
          return {
            id: d.id,
            email: (data.email as string) ?? "",
            displayName: data.displayName as string,
            createdAt:
              typeof created === "number"
                ? created
                : created && typeof created.toMillis === "function"
                ? created.toMillis()
                : undefined,
            trialEndsAt: data.trialEndsAt as number,
            subscriptionStatus: data.subscriptionStatus as string,
          };
        });
        rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setUsers(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load users");
      } finally {
        setBusy(false);
      }
    })();
  }, [profile?.isAdmin]);

  if (loading || !profile) return <div className="px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  if (!profile.isAdmin) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl text-gold-gradient mb-6">Admin · Users</h1>
      {busy && <div className="text-muted-foreground">Loading users…</div>}
      {error && <div className="text-destructive">{error}</div>}
      {!busy && !error && (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/70">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Trial ends</th>
                <th className="px-3 py-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-foreground">{u.email}</td>
                  <td className="px-3 py-2 text-foreground/80">{u.displayName || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${u.subscriptionStatus === "active" ? "bg-gold-gradient text-primary-foreground" : "border border-gold/50 text-gold"}`}>
                      {u.subscriptionStatus ?? "trial"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground/70">
                    {u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground/70">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
