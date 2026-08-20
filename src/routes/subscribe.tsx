import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { useAuth, daysLeft } from "@/lib/auth-context";
import {
  listNexDocsEftPayments,
  startNexDocsEftPayment,
  submitNexDocsEftProof,
  type EftPaymentDetail,
} from "@/lib/eft-payments";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Subscribe — NexDocs" },
      { name: "description", content: "Subscribe to NexDocs for R99/month by EFT and submit proof of payment for review." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Subscribe to NexDocs — R99/month" },
      { property: "og:description", content: "NexDocs monthly access for South African business document workflows." },
      { property: "og:url", content: "https://nexdocs.cossanexusholdings.co.za/subscribe" },
    ],
    links: [{ rel: "canonical", href: "https://nexdocs.cossanexusholdings.co.za/subscribe" }],
  }),
  component: SubscribePage,
});

function newRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-nexdocs-eft`;
}

function SubscribePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<EftPaymentDetail | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [payerNote, setPayerNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId] = useState(newRequestId);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void listNexDocsEftPayments()
      .then((payments) => {
        const pending = payments.find((entry) => ["awaiting_payment", "rejected", "proof_submitted"].includes(entry.payment.status));
        if (pending) setPayment(pending);
      })
      .catch(() => undefined);
  }, [user]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      setPayment(await startNexDocsEftPayment(requestId));
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not create your EFT payment request.");
    } finally {
      setBusy(false);
    }
  }

  async function submitProof(event: React.FormEvent) {
    event.preventDefault();
    if (!payment || !proof) return;
    setBusy(true);
    setError(null);
    try {
      const result = await submitNexDocsEftProof({ paymentId: payment.payment.id, proof, payerNote });
      setPayment((current) => current ? { ...current, payment: { ...current.payment, ...result.payment } } : current);
      setProof(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Proof of payment could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !profile) return <div className="px-4 py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-2xl shadow-black/40">
        <h1 className="font-display text-3xl text-gold-gradient">NexDocs subscription</h1>
        <p className="mt-2 text-sm text-muted-foreground">Continue your private document workspace with a verified monthly EFT payment.</p>

        <section className="mt-6 rounded-xl border border-gold/40 p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-foreground">NexDocs Monthly</span>
            <span className="font-display text-2xl text-gold-gradient">R99<span className="text-sm text-muted-foreground">/mo</span></span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-foreground/80">
            <li>• Unlimited document generation</li>
            <li>• Editable business-document workflows</li>
            <li>• Private workspace and PDF exports</li>
            <li>• Monthly EFT payment with proof review</li>
          </ul>
        </section>

        <div className="mt-4 text-xs text-muted-foreground">
          {profile.subscriptionStatus === "active" ? "Subscription active" : `Trial: ${daysLeft(profile)} day${daysLeft(profile) === 1 ? "" : "s"} remaining`}
        </div>

        {error ? <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        {!payment ? (
          <>
            <button onClick={() => void start()} disabled={busy} className="mt-5 flex w-full items-center justify-center rounded-md bg-gold-gradient py-3 font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {busy ? "Preparing secure payment…" : "Pay R99 by EFT"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">We will show the exact transfer details and unique payment reference before you pay. Access activates only after Cossa approves your proof of payment.</p>
          </>
        ) : (
          <div className="mt-5 space-y-4">
            <section className="rounded-xl border border-gold/35 bg-black/20 p-4 text-sm">
              <p className="font-semibold text-gold">Transfer R{payment.instructions.exactAmount.toFixed(2)} exactly</p>
              <dl className="mt-3 space-y-2 text-foreground/85">
                <div><dt className="text-xs text-muted-foreground">Bank</dt><dd>{payment.instructions.bankName}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Account holder</dt><dd>{payment.instructions.accountHolder}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Account type</dt><dd>{payment.instructions.accountType}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Account number</dt><dd className="break-all font-semibold">{payment.instructions.accountNumber}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Branch code</dt><dd>{payment.instructions.branchCode}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Unique reference</dt><dd className="break-all font-semibold text-gold">{payment.instructions.reference}</dd></div>
              </dl>
            </section>

            {payment.payment.status === "proof_submitted" ? <div className="flex gap-2 rounded-md border border-gold/35 bg-gold/10 p-3 text-sm"><LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-gold" />Your proof is awaiting Cossa review. NexDocs access activates only after approval.</div> : null}
            {payment.payment.status === "approved" ? <div className="flex gap-2 rounded-md border border-gold/35 bg-gold/10 p-3 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />Payment approved. Your NexDocs subscription is active.</div> : null}

            {["awaiting_payment", "rejected"].includes(payment.payment.status) ? (
              <form onSubmit={submitProof} className="space-y-3 rounded-xl border border-border/60 p-4">
                <label className="block text-sm">Proof of payment<input type="file" required accept="application/pdf,image/jpeg,image/png" onChange={(event) => setProof(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-xs text-muted-foreground" /></label>
                <label className="block text-sm">Optional reviewer note<input value={payerNote} maxLength={1000} onChange={(event) => setPayerNote(event.target.value)} placeholder="Payment account name, if different" className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm" /></label>
                {payment.payment.reviewerNote ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{payment.payment.reviewerNote}</p> : null}
                <button disabled={busy || !proof} className="flex w-full items-center justify-center rounded-md bg-gold-gradient py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}{busy ? "Submitting proof…" : "Submit proof of payment"}</button>
              </form>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
