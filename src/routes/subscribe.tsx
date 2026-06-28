import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, daysLeft } from "@/lib/auth-context";
import { createPayFastCheckout } from "@/lib/payfast.functions";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Subscribe — NexDocs" },
      { name: "description", content: "Subscribe to NexDocs for R99/month via PayFast. Unlimited AI-generated South African business documents, PDF exports, and cancel anytime." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Subscribe to NexDocs — R99/month" },
      { property: "og:description", content: "Unlimited AI business documents for SA businesses. Cancel anytime." },
      { property: "og:url", content: "https://nexdoc-cossanexusholdings.lovable.app/subscribe" },
    ],
    links: [{ rel: "canonical", href: "https://nexdoc-cossanexusholdings.lovable.app/subscribe" }],
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const checkout = useServerFn(createPayFastCheckout);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [form, setForm] = useState<{ actionUrl: string; fields: Record<string, string> } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (form && formRef.current) formRef.current.submit();
  }, [form]);

  const start = async () => {
    if (!user || !profile) return;
    setBusy(true);
    setError(null);
    try {
      const res = await checkout({
        data: {
          uid: user.uid,
          email: profile.email,
          firstName: profile.displayName?.split(" ")[0] || "Customer",
          origin: window.location.origin,
        },
      });
      if (!res.ok) setError(res.error);
      else setForm({ actionUrl: res.actionUrl, fields: res.fields });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !profile) return <div className="px-4 py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-2xl shadow-black/40">
        <h1 className="font-display text-3xl text-gold-gradient">Subscribe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue creating unlimited business documents after your trial.
        </p>

        <section className="mt-6 rounded-xl border border-gold/40 p-4">
          <h2 className="sr-only">Plan details</h2>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-foreground">NexDocs Monthly</span>
            <span className="font-display text-2xl text-gold-gradient">R99<span className="text-sm text-muted-foreground">/mo</span></span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-foreground/80">
            <li>• Unlimited document generation</li>
            <li>• All 6 companies, 48+ document types</li>
            <li>• PDF downloads</li>
            <li>• Cancel anytime via PayFast</li>
          </ul>
        </section>

        <section className="mt-4">
          <h2 className="sr-only">Trial status</h2>
          <div className="text-xs text-muted-foreground">
            Trial: {daysLeft(profile)} day{daysLeft(profile) === 1 ? "" : "s"} remaining
          </div>
        </section>

        {error && <div className="mt-4 text-sm text-destructive">{error}</div>}

        <button
          onClick={start}
          disabled={busy}
          className="mt-5 w-full rounded-md bg-gold-gradient py-3 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Redirecting to PayFast…" : "Pay with PayFast"}
        </button>

        <p className="mt-3 text-[11px] text-muted-foreground text-center">
          You'll be redirected to PayFast secure checkout to authorise a R99/month recurring debit order.
        </p>

        {form && (
          <form ref={formRef} action={form.actionUrl} method="POST" className="hidden">
            {Object.entries(form.fields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          </form>
        )}
      </div>
    </div>
  );
}
