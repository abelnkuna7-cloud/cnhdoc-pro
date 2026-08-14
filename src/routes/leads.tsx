import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Document workspace — NexDocs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DocumentWorkspace,
});

function DocumentWorkspace() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="rounded-3xl border border-gold/30 bg-card/70 p-8 shadow-2xl shadow-black/20">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          NexDocs workspace
        </div>
        <h1 className="mt-3 font-display text-3xl text-foreground">
          Document work belongs here — not lead hunting.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          NexDocs is focused on creating, reviewing and storing professional business documents. Lead discovery and CRM activity live in Cossa Growth.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Create a document
          </Link>
          <a
            href="https://growth.cossanexusholdings.co.za/"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-gold/50 px-5 py-3 text-sm font-bold text-gold hover:bg-gold/10"
          >
            Open Cossa Growth
          </a>
        </div>
      </div>
    </div>
  );
}
