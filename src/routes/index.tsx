import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { NEXDOCS_LOGO } from "@/lib/companies";
import { useAuth } from "@/lib/auth-context";
import {
  DOCUMENT_TEMPLATES,
  DOCUMENT_CATEGORIES,
  type DocumentTemplate,
  type DocumentCategory,
} from "@/lib/document-templates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexDocs AI — South Africa's AI Business Platform" },
      {
        name: "description",
        content:
          "NexDocs AI helps South African businesses run smarter. Generate contracts, quotations, invoices, HR & compliance documents and get AI business advice — POPIA ready, built for SA. Start a free 10-day trial.",
      },
      {
        name: "keywords",
        content:
          "AI business platform South Africa, NexDocs AI, POPIA documents, SA contracts, quotations invoices, HR compliance, tender documents, small business AI, Cossa Nexus Holdings",
      },
      { property: "og:title", content: "NexDocs AI — South Africa's AI Business Platform" },
      {
        property: "og:description",
        content:
          "Run your business smarter with AI. Contracts, quotes, invoices, HR & compliance docs — built for South Africa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nexdocs.cossanexusholdings.co.za/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NexDocs AI — South Africa's AI Business Platform" },
      {
        name: "twitter:description",
        content: "Run your business smarter with AI. Built for South Africa.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nexdocs.cossanexusholdings.co.za/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "NexDocs AI",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "South Africa's AI Business Platform. Generate contracts, quotations, invoices, HR and compliance documents with an AI assistant built for SA businesses.",
          offers: {
            "@type": "Offer",
            price: "99",
            priceCurrency: "ZAR",
            availability: "https://schema.org/InStock",
          },
          publisher: {
            "@type": "Organization",
            name: "Cossa Nexus Holdings (Pty) Ltd",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Landing,
});

/* -------------------- Data -------------------- */

const TRUST = [
  { icon: "🇿🇦", label: "Built for South Africa" },
  { icon: "🤖", label: "AI Powered" },
  { icon: "🔒", label: "Secure Cloud Platform" },
  { icon: "📄", label: "Editable PDF export" },
  { icon: "⚖️", label: "POPIA Ready" },
  { icon: "🏢", label: "Business Ready" },
];

const FEATURES = [
  {
    icon: "01",
    eyebrow: "Guided brief",
    title: "Start with the facts, not a blank page.",
    desc: "A professional form collects company, client, dates, scope, line items and terms before NexDocs drafts anything.",
    href: "/dashboard",
    action: "Create a document",
  },
  {
    icon: "02",
    eyebrow: "Editable draft",
    title: "Review every detail before it leaves your desk.",
    desc: "Receive a clean, concise draft that you can amend, copy or download as a branded PDF.",
    href: "/dashboard",
    action: "Open workspace",
  },
  {
    icon: "03",
    eyebrow: "South African context",
    title: "Practical documents for real business work.",
    desc: "Quotes, invoices, employment documents, policies, project records and compliance support built around how South African businesses operate.",
    href: "/#templates",
    action: "Browse templates",
  },
  {
    icon: "04",
    eyebrow: "Private by design",
    title: "Your business information stays in your workspace.",
    desc: "Signed-in users keep their saved details and documents separate. Organisation information is available only to authorised administrators.",
    href: "/auth",
    action: "Sign in securely",
  },
  {
    icon: "05",
    eyebrow: "AI guidance",
    title: "Ask a question. Get a focused next step.",
    desc: "Use NexDocs AI for concise business, HR and compliance guidance, then move into a guided form whenever a document needs details.",
    href: "/assistant",
    action: "Ask NexDocs AI",
  },
  {
    icon: "06",
    eyebrow: "Connected operations",
    title: "Keep document work connected to the right system.",
    desc: "NexDocs keeps document creation focused and private, while businesses can connect their own approved operations workspace when they need wider reporting.",
    href: "/dashboard",
    action: "Open workspace",
  },
];

const INDUSTRIES = [
  { icon: "🏗️", name: "Construction", desc: "Tenders, quotations, safety and project records.", category: "Construction" as DocumentCategory },
  { icon: "🏢", name: "Facility Management", desc: "Service agreements, inspections and incident records.", category: "Cleaning" as DocumentCategory },
  { icon: "🧹", name: "Cleaning Services", desc: "Service agreements, schedules and handover records.", category: "Cleaning" as DocumentCategory },
  { icon: "🛍️", name: "Retail", desc: "Quotations, invoices and supplier paperwork.", category: "Retail" as DocumentCategory },
  { icon: "🍽️", name: "Hospitality", desc: "Catering quotations, event briefs and bookings.", category: "Hospitality" as DocumentCategory },
  { icon: "🚚", name: "Logistics", desc: "Delivery records, transport forms and invoices.", category: "Logistics" as DocumentCategory },
  { icon: "💻", name: "Technology", desc: "Scopes of work, NDAs and service agreements.", category: "Technology" as DocumentCategory },
  { icon: "💼", name: "Professional Services", desc: "Proposals, scopes and commercial agreements.", category: "Legal" as DocumentCategory },
  { icon: "⚖️", name: "Legal & HR", desc: "Employment, privacy and workplace documents.", category: "HR" as DocumentCategory },
];


const COMPARE = {
  traditional: [
    "Hours of work per document",
    "Manual typing & copy-paste",
    "Expensive consultants",
    "Formatting problems",
    "Compliance risk",
  ],
  nexdocs: [
    "Ready in minutes",
    "AI generated & branded",
    "Fraction of the cost",
    "Professional layout every time",
    "POPIA, BCEA & CIDB ready",
  ],
};

const USE_CASES = [
  { industry: "Construction", icon: "🏗️", title: "Tender-ready documents", body: "Create construction quotations, method statements, risk assessments and safety-file documents from one guided workspace." },
  { industry: "Cleaning & Facilities", icon: "🧽", title: "Service delivery records", body: "Prepare service agreements, inspection reports, schedules and incident forms for cleaning and facility work." },
  { industry: "HR & Compliance", icon: "📋", title: "Workplace documentation", body: "Start HR letters, employment contracts and privacy notices with South African business context built in." },
  { industry: "Hospitality", icon: "🍽️", title: "Event and catering workflow", body: "Create polished catering quotations, booking confirmations and event brief documents ready for review." },
  { industry: "Technology", icon: "💻", title: "Commercial agreements", body: "Draft NDAs, scopes of work and service agreements for technology and professional-service projects." },
  { industry: "Retail & Logistics", icon: "🚚", title: "Sales and delivery records", body: "Prepare VAT-aware invoices, supplier forms, returns documents and transport paperwork in ZAR." },
];

const PLANS = [
  {
    name: "Private workspace",
    price: "Start here",
    period: "",
    features: ["Guided document briefs", "Editable drafts", "PDF download after review", "Private workspace"],
    cta: "Create workspace",
    highlight: true,
    contact: false,
  },
  {
    name: "Business workspace",
    price: "Talk to us",
    period: "",
    features: ["Business onboarding", "Workflow guidance", "Document standards", "Priority support"],
    cta: "Contact Cossa",
    highlight: false,
    contact: true,
  },
];

const FAQS = [
  { q: "How do I create a document?", a: "Choose a template or open the guided document workspace. Enter the business, client, date and pricing details you want included, then review and edit the draft before downloading it." },
  { q: "Can I edit a generated document?", a: "Yes. NexDocs shows an editable draft first. You remain responsible for reviewing the wording and facts before using it." },
  { q: "Can I download a PDF?", a: "Yes. A PDF can be downloaded after you create and review a document in your private workspace." },
  { q: "Is it for South African businesses?", a: "NexDocs is designed around everyday South African business documents, including ZAR-based quotations, invoices, employment and privacy documents. It does not replace professional legal, tax or financial advice." },
  { q: "Does NexDocs invent details?", a: "No. The guided brief asks for the details needed for the document and clearly shows missing information for you to complete." },
  { q: "Who can see my business details?", a: "Signed-in users can access only their own private workspace. Cossa Nexus workspace information is restricted to its authorised members." },
];

/* -------------------- Components -------------------- */

function Landing() {
  return (
    <div className="text-foreground">
      <Hero />
      <TrustBar />
      <Features />
      <Industries />
      <AssistantShowcase />
      <HowItWorks />
      <DocumentGallery />
      <WhyChoose />
      <Security />
      <DocumentDelivery />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(214,164,46,0.15),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(20,55,100,0.26),transparent_35%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.75fr] lg:text-left">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
            <span>🇿🇦</span> South Africa's AI document workspace
          </div>
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">
            <span className="text-foreground">Documents that begin with</span>{" "}
            <span className="text-gold-gradient">the right details.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Create polished quotations, invoices, contracts, HR records and business documents through a guided, editable workflow — made for practical South African business work.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="rounded-xl bg-gold-gradient px-6 py-3 text-center font-semibold text-primary-foreground shadow-lg shadow-gold/20 transition hover:brightness-105"
            >
              Create a guided document
            </Link>
            <Link
              to="/assistant"
              className="rounded-xl border border-gold/40 px-6 py-3 text-center font-semibold text-foreground transition hover:bg-charcoal/50"
            >
              Ask NexDocs AI
            </Link>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li>✓ Clear editable briefs</li>
            <li>✓ No invented business details</li>
            <li>✓ Private workspaces</li>
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-5 rounded-[2rem] bg-gold/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-gold/40 bg-charcoal p-2 shadow-2xl shadow-black/50">
            <img
              src="/images/cossa-eagle-hero.jpg"
              alt="Cossa Nexus eagle artwork"
              className="h-[28rem] w-full rounded-[1.5rem] object-cover object-center"
            />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-gold/30 bg-black/75 p-4 backdrop-blur">
              <img src={NEXDOCS_LOGO} alt="NexDocs AI" className="h-10 w-10 rounded-lg object-cover" />
              <div className="mt-3 font-display text-xl text-foreground">NexDocs AI</div>
              <p className="mt-1 text-sm text-muted-foreground">Clear documents. Confident next steps.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section aria-label="Trust indicators" className="border-y border-border/60 bg-black/40">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-2">
            <span aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10">
      <div className="text-xs uppercase tracking-[0.2em] text-gold">{eyebrow}</div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="The NexDocs way"
        title="A more convincing way to create business documents."
        subtitle="Clear information first. A short editable draft second. A professional PDF only when you are satisfied."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-4">
                <span className="font-display text-3xl text-gold">{feature.icon}</span>
                <span className="rounded-full border border-gold/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                  {feature.eyebrow}
                </span>
              </div>
              <h3 className="mt-8 font-display text-2xl leading-tight text-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
                {feature.desc}
              </p>
              <span className="mt-7 inline-flex items-center text-sm font-bold text-gold">
                {feature.action} <span className="ml-2">→</span>
              </span>
            </>
          );

          const className =
            "group rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-charcoal/50 p-6 shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-gold/5";

          const isExternal = feature.href.startsWith("http");
          return (
            <a
              key={feature.title}
              href={feature.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              className={className}
            >
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function Industries() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader eyebrow="Industries" title="Made for practical South African business work" subtitle="Open a real document category, choose a template and create an editable draft." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRIES.map((industry) => (
          <a key={industry.name} href={`#templates`}
            className="group rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-gold/60 hover:bg-charcoal"
            aria-label={`Open ${industry.name} document templates`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gold-gradient text-lg" aria-hidden>{industry.icon}</div>
              <div><h3 className="font-display text-lg">{industry.name}</h3><p className="text-xs text-muted-foreground">{industry.desc}</p></div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs"><span className="text-gold">Open templates</span><span className="text-muted-foreground group-hover:text-foreground">Browse library →</span></div>
          </a>
        ))}
      </div>
    </section>
  );
}
function AssistantShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader eyebrow="Guided document brief" title="Clear inputs. Professional editable drafts." subtitle="NexDocs asks for the business, client, date, service and pricing details before preparing the document." />
      <div className="rounded-2xl border border-gold/30 bg-black/70 p-5 sm:p-7 backdrop-blur shadow-2xl shadow-black/40">
        <div className="grid gap-5 md:grid-cols-[1fr_0.9fr] md:items-center">
          <div><div className="text-xs uppercase tracking-widest text-gold">Built for review</div><h3 className="mt-2 font-display text-2xl">You control every important fact.</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground"><li>✓ Select the issuing company and document type</li><li>✓ Add client, service, dates, amounts and payment terms</li><li>✓ Edit the draft before you download the branded PDF</li></ul></div>
          <div className="rounded-xl border border-border/60 bg-card/80 p-4 text-sm"><div className="font-display text-base">Quotation brief</div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span className="rounded bg-black/30 p-2">Client details</span><span className="rounded bg-black/30 p-2">Scope of work</span><span className="rounded bg-black/30 p-2">Dates and times</span><span className="rounded bg-black/30 p-2">Amount and VAT choice</span></div></div>
        </div>
        <div className="mt-6 text-center"><Link to="/dashboard" className="inline-block rounded-lg bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">Create a guided document</Link></div>
      </div>
    </section>
  );
}
function HowItWorks() {
  const steps = [
    { n: 1, icon: "🎯", title: "Choose a task", desc: "Pick a document type or just ask the AI assistant." },
    { n: 2, icon: "📝", title: "Answer a few questions", desc: "We only ask what's needed — the rest is auto-filled from your business profile." },
    { n: 3, icon: "📤", title: "Review and download", desc: "Edit the result, then download a branded PDF when the wording and details are right." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader eyebrow="How it works" title="From idea to signed document in minutes" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur">
            <div className="mx-auto h-12 w-12 rounded-full bg-gold-gradient flex items-center justify-center font-display text-lg text-primary-foreground">
              {s.n}
            </div>
            <div className="mt-4 text-3xl" aria-hidden>{s.icon}</div>
            <div className="mt-2 font-display text-lg">{s.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DocumentGallery() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<DocumentCategory | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOCUMENT_TEMPLATES.filter((t) => {
      if (cat !== "All" && t.category !== cat) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  const open = openId ? DOCUMENT_TEMPLATES.find((t) => t.id === openId) ?? null : null;

  const openTemplate = (id: string) => {
    setOpenId(id);
    setPageIdx(0);
    setDetails(false);
  };
  const close = () => setOpenId(null);

  const generateHref = (t: DocumentTemplate) =>
    user ? `/dashboard?document=${encodeURIComponent(t.title)}` : `/auth?redirect=/dashboard?document=${encodeURIComponent(t.title)}`;

  const downloadSamplePdf = (t: DocumentTemplate) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    t.pages.forEach((page, i) => {
      if (i > 0) doc.addPage();
      // watermark
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(64);
      doc.text("NEXDOCS PREVIEW", width / 2, height / 2, { align: "center", angle: -30 });
      // body
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(page, width - margin * 2);
      doc.text(lines, margin, margin + 12);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`NexDocs AI · ${t.title} · Page ${i + 1} of ${t.pages.length}`, margin, height - 20);
    });
    doc.save(`nexdocs-sample-${t.id}.pdf`);
  };

  return (
    <section id="templates" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="Template library"
        title="Professional documents, ready to send"
        subtitle="Browse real South African business templates. Preview, download a sample or generate your own with AI."
      />

      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates (e.g. quotation, POPIA, safety file)…"
            className="w-full rounded-lg border border-border/60 bg-card/60 px-4 py-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/60 focus:outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔎</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...DOCUMENT_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c as DocumentCategory | "All")}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                cat === c
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No templates match "{query}". Try a different search or category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => openTemplate(t.id)}
              className="group relative text-left rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_20px_60px_-20px] hover:shadow-gold/30"
            >
              {t.popular && (
                <span className="absolute right-3 top-3 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                  Popular
                </span>
              )}
              <div className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-md border border-border/60 bg-gradient-to-b from-charcoal to-black p-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_34%)]" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <img src={NEXDOCS_LOGO} alt="" aria-hidden="true" className="h-7 w-7 rounded object-cover" />
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">NexDocs</div>
                      <div className="text-[8px] uppercase tracking-wide text-muted-foreground">Business document</div>
                    </div>
                  </div>
                  <div className="rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gold">
                    {t.category}
                  </div>
                </div>
                <div className="relative mt-6 border-t border-gold/30 pt-3">
                  <div className="font-display text-base leading-tight text-gold-gradient">{t.title}</div>
                  <div className="mt-1 text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Ready to personalise</div>
                </div>
                <div className="relative mt-4 space-y-1.5 text-[8px] leading-relaxed text-foreground/70">
                  {t.pages[0]
                    .split("\n")
                    .filter((line) => line.trim())
                    .slice(0, 4)
                    .map((line, lineIndex) => (
                      <div key={lineIndex} className="truncate border-b border-border/40 pb-1">
                        {line.replace(/\[[^\]]+\]/g, "________")}
                      </div>
                    ))}
                </div>
                <div className="relative mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-[9px] font-medium">
                  <span className="text-muted-foreground">Preview document</span>
                  <span className="text-gold">Open →</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="text-sm font-semibold text-foreground group-hover:text-gold transition">{t.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded bg-charcoal px-2 py-0.5 text-[10px] text-muted-foreground border border-border/60">⚡ {t.generationTime}</span>
                  {t.aiSupported && (
                    <span className="rounded bg-gold/10 px-2 py-0.5 text-[10px] text-gold border border-gold/30">🤖 AI supported</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <TemplateModal
          t={open}
          pageIdx={pageIdx}
          setPageIdx={setPageIdx}
          details={details}
          setDetails={setDetails}
          onClose={close}
          onDownload={() => downloadSamplePdf(open)}
          generateHref={generateHref(open)}
        />
      )}
    </section>
  );
}

function TemplateModal({
  t,
  pageIdx,
  setPageIdx,
  details,
  setDetails,
  onClose,
  onDownload,
  generateHref,
}: {
  t: DocumentTemplate;
  pageIdx: number;
  setPageIdx: (n: number) => void;
  details: boolean;
  setDetails: (v: boolean) => void;
  onClose: () => void;
  onDownload: () => void;
  generateHref: string;
}) {
  const total = t.pages.length;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-4xl max-h-[95vh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">{t.icon}</span>
              <h3 className="font-display text-xl text-gold-gradient truncate">{t.title}</h3>
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                {t.category}
              </span>
              {t.popular && (
                <span className="rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground border border-border/60">
                  Popular
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md border border-border/60 px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-black to-charcoal p-4 sm:p-6">
          {details ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-card/70 p-5 text-sm text-foreground/90 space-y-3">
              <div className="font-display text-lg text-gold">Template details</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Detail label="Category" value={t.category} />
                <Detail label="Generation time" value={t.generationTime} />
                <Detail label="AI supported" value={t.aiSupported ? "Yes" : "No"} />
                <Detail label="Pages (sample)" value={String(t.pages.length)} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">What you can generate</div>
                <p>{t.description} The guided workspace uses only the business and client details you supply. Review every result before use.</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">How it works</div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Click "Generate with AI" and answer a few short questions.</li>
                  <li>NexDocs creates a concise editable draft from the details you provide.</li>
                  <li>Review the wording, then download a branded PDF when you are ready.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl relative">
              {/* Watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
                <div className="font-display text-6xl sm:text-7xl text-gold rotate-[-24deg] whitespace-nowrap">
                  SAMPLE DOCUMENT
                </div>
              </div>
              <div className="relative rounded-lg bg-white text-neutral-900 shadow-xl">
                <div className="border-b border-neutral-200 px-6 py-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>NexDocs AI · Sample</span>
                  <span>Page {pageIdx + 1} of {total}</span>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed px-6 py-6 min-h-[420px]">
{t.pages[pageIdx]}
                </pre>
              </div>
              {total > 1 && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setPageIdx(Math.max(0, pageIdx - 1))}
                    disabled={pageIdx === 0}
                    className="rounded-md border border-border/60 px-3 py-1.5 text-foreground disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <div className="flex gap-1">
                    {t.pages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPageIdx(i)}
                        className={`h-2 w-6 rounded-full transition ${i === pageIdx ? "bg-gold" : "bg-border/60"}`}
                        aria-label={`Go to page ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setPageIdx(Math.min(total - 1, pageIdx + 1))}
                    disabled={pageIdx === total - 1}
                    className="rounded-md border border-border/60 px-3 py-1.5 text-foreground disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border/60 p-3 sm:p-4 flex flex-wrap gap-2 justify-end bg-card">
          <button
            onClick={() => setDetails(!details)}
            className="rounded-md border border-border/60 px-3 py-2 text-xs sm:text-sm text-foreground hover:border-gold/40"
          >
            {details ? "← Back to preview" : "View template details"}
          </button>
          <button
            onClick={onDownload}
            className="rounded-md border border-border/60 px-3 py-2 text-xs sm:text-sm text-foreground hover:border-gold/40"
          >
            ⬇ Download sample PDF
          </button>
          <Link
            to="/auth"
            className="rounded-md border border-gold/40 px-3 py-2 text-xs sm:text-sm text-gold hover:bg-gold/10"
          >
            Create a workspace
          </Link>
          <a
            href={generateHref}
            className="rounded-md bg-gold-gradient px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-lg shadow-gold/20"
          >
            🤖 Generate with AI
          </a>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-black/50 p-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function WhyChoose() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader eyebrow="Comparison" title="Why choose NexDocs AI" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/40 p-6">
          <div className="font-display text-lg mb-3 text-muted-foreground">Traditional Way</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {COMPARE.traditional.map((x) => (
              <li key={x} className="flex gap-2"><span className="text-destructive">✕</span>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-gold/40 bg-gradient-to-b from-charcoal to-black p-6 shadow-lg shadow-gold/10">
          <div className="font-display text-lg mb-3 text-gold-gradient">NexDocs AI</div>
          <ul className="space-y-2 text-sm text-foreground">
            {COMPARE.nexdocs.map((x) => (
              <li key={x} className="flex gap-2"><span className="text-gold">✓</span>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="Everyday workflows"
        title="Built for practical business work"
        subtitle="Explore the document workflows NexDocs is designed to support across South African businesses."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {USE_CASES.map((u) => (
          <div key={u.title} className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur hover:border-gold/60 transition">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
              <span className="text-lg">{u.icon}</span> {u.industry}
            </div>
            <div className="mt-2 font-display text-lg text-foreground">{u.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{u.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="Pricing"
        title="Choose how to start"
        subtitle="Create a private workspace, or contact us about a business document workflow."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={
              "rounded-xl border p-5 backdrop-blur flex flex-col " +
              (p.highlight
                ? "border-gold/60 bg-gradient-to-b from-charcoal to-black shadow-xl shadow-gold/10 relative"
                : "border-border/60 bg-card/60")
            }
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                Most Popular
              </div>
            )}
            <div className="font-display text-lg">{p.name}</div>
            <div className="mt-2 flex items-end gap-1">
              <span className="font-display text-3xl text-gold-gradient">{p.price}</span>
              <span className="text-xs text-muted-foreground pb-1">{p.period}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-gold">✓</span>{f}</li>
              ))}
            </ul>
            {p.contact ? (
              <a
                href="mailto:cossa@cossanexusholdings.co.za?subject=NexDocs%20business%20workspace"
                className="mt-5 block rounded-md border border-gold/40 px-4 py-2 text-center text-sm font-semibold text-foreground transition hover:bg-charcoal/40"
              >
                {p.cta}
              </a>
            ) : (
              <Link
                to="/auth"
                className={
                  "mt-5 block text-center rounded-md px-4 py-2 text-sm font-semibold transition " +
                  (p.highlight
                    ? "bg-gold-gradient text-primary-foreground"
                    : "border border-gold/40 text-foreground hover:bg-charcoal/40")
                }
              >
                {p.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
      <div className="space-y-2">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-medium">{f.q}</span>
                <span className="text-gold text-lg" aria-hidden>{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <div className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-charcoal to-black p-8 sm:p-12 text-center shadow-2xl shadow-black/40">
        <h2 className="font-display text-3xl sm:text-4xl">
          <span className="text-foreground">Ready to run your business</span>{" "}
          <span className="text-gold-gradient">smarter?</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Start your free 10-day trial today. No credit card required.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth" className="rounded-lg bg-gold-gradient px-6 py-3 font-semibold text-primary-foreground">
            Start Free 10-Day Trial
          </Link>
          <Link to="/assistant" className="rounded-lg border border-gold/40 px-6 py-3 font-semibold text-foreground">
            Try AI Assistant
          </Link>
        </div>
      </div>
    </section>
  );
}

const SECURITY_ITEMS = [
  { title: "HTTPS protection", body: "NexDocs is served over HTTPS so data is protected in transit between your browser and the service." },
  { title: "Account sign-in", body: "Email and password sign-in is managed through the connected authentication service." },
  { title: "Private workspace", body: "Your account workspace is separated from other signed-in users." },
  { title: "Privacy-first approach", body: "NexDocs is designed to minimise personal information and does not sell customer data." },
  { title: "POPIA-ready templates", body: "Use privacy notices, consent forms and related templates as a starting point for review." },
  { title: "Security roadmap", body: "Team roles, detailed audit records, 2FA and recovery controls are planned before enterprise rollout." },
];

function Security() {
  const items = [
    ["🔒", "Private workspaces", "Signed-in users access only the information linked to their own account."],
    ["🧾", "Editable before download", "Review and correct the document before you create a PDF."],
    ["🧠", "Business memory", "Your saved details can speed up future briefs in your private workspace."],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader eyebrow="Built for careful work" title="Private by default. Clear about what is generated." subtitle="NexDocs helps you prepare and review business documents. It does not replace legal, tax or financial advice." />
      <div className="grid gap-4 md:grid-cols-3">{items.map(([icon, title, body]) => <div key={title} className="rounded-xl border border-border/60 bg-card/60 p-5"><div className="text-2xl">{icon}</div><h3 className="mt-3 font-display text-lg">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{body}</p></div>)}</div>
    </section>
  );
}

function DocumentDelivery() {
  return (
    <section id="support" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-charcoal p-6 sm:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div><div className="text-xs uppercase tracking-[0.2em] text-gold">Direct support</div><h2 className="mt-2 font-display text-3xl">Need help choosing the right document?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Use the guided workspace for a private editable draft, or contact the Cossa Nexus team on WhatsApp for general platform support.</p></div>
          <div className="flex flex-wrap gap-3"><Link to="/dashboard" className="rounded-lg bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground">Open workspace</Link><a href="https://wa.me/27678011907?text=Hello%20Cossa%20Nexus%2C%20I%20need%20help%20with%20NexDocs." target="_blank" rel="noreferrer" className="rounded-lg border border-gold/40 px-5 py-3 text-sm font-semibold text-foreground hover:bg-gold/10">WhatsApp support</a></div>
        </div>
      </div>
    </section>
  );
}
