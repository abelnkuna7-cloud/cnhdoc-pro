import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { CNH_LOGO } from "@/lib/companies";
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
      { property: "og:url", content: "https://nexdoc-pro-v2.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NexDocs AI — South Africa's AI Business Platform" },
      {
        name: "twitter:description",
        content: "Run your business smarter with AI. Built for South Africa.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nexdoc-pro-v2.lovable.app/" }],
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
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "127",
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
  { icon: "📄", label: "PDF & Word Export" },
  { icon: "⚖️", label: "POPIA Ready" },
  { icon: "🏢", label: "Business Ready" },
];

const FEATURES = [
  { icon: "📄", title: "AI Document Generator", desc: "Draft any business document in minutes with AI trained on SA law." },
  { icon: "🤖", title: "AI Business Assistant", desc: "A ChatGPT-style assistant for SA business, HR, tax and compliance." },
  { icon: "📑", title: "Quotations", desc: "Branded, VAT-ready quotes with line items and terms." },
  { icon: "🧾", title: "Invoices", desc: "Professional invoices with ZAR, VAT (15%) and banking details." },
  { icon: "👥", title: "HR Documents", desc: "BCEA-aligned contracts, warnings, leave and disciplinary letters." },
  { icon: "⚖️", title: "Compliance", desc: "POPIA, PAIA, BBBEE, OHSA and Companies Act ready templates." },
  { icon: "📂", title: "Project Documents", desc: "SLAs, scopes, method statements, snag lists and handovers." },
  { icon: "📈", title: "Business Analytics", desc: "Track quotes, invoices, revenue and pipeline in one place." },
  { icon: "🏗️", title: "Construction Templates", desc: "Safety files, risk assessments, CIDB-ready tender packs." },
  { icon: "🧹", title: "Cleaning Templates", desc: "Cleaning SLAs, schedules, inspections and incident reports." },
  { icon: "🚚", title: "Logistics Templates", desc: "Delivery notes, transport agreements and POD forms." },
  { icon: "☁️", title: "Cloud Storage", desc: "Everything saved securely, accessible on any device." },
];

const INDUSTRIES = [
  { icon: "🏗️", name: "Construction", desc: "Safety files, tenders, snag lists.", count: 24 },
  { icon: "🏢", name: "Facility Management", desc: "SLAs, inspections, incident logs.", count: 18 },
  { icon: "🧹", name: "Cleaning Services", desc: "Service agreements & schedules.", count: 16 },
  { icon: "🛍️", name: "Retail", desc: "Invoices, refunds, supplier contracts.", count: 14 },
  { icon: "🍽️", name: "Hospitality", desc: "Catering, event and menu docs.", count: 15 },
  { icon: "🚚", name: "Logistics", desc: "Transport agreements & POD forms.", count: 12 },
  { icon: "💻", name: "Technology", desc: "SaaS agreements, NDAs, scopes.", count: 20 },
  { icon: "💼", name: "Professional Services", desc: "Consulting, SOWs and proposals.", count: 22 },
  { icon: "⚖️", name: "Legal & HR", desc: "POPIA, BCEA, LRA, contracts.", count: 26 },
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

const TESTIMONIALS = [
  { name: "Sipho M.", role: "Construction Company, Gauteng", quote: "We produce full safety files and tender packs in a morning instead of a week." },
  { name: "Nadia K.", role: "Cleaning Company, Cape Town", quote: "The SLA and inspection templates alone paid for a year of subscription." },
  { name: "Johan v.d.M.", role: "Business Consultant", quote: "The AI assistant knows SA context — POPIA, BCEA, VAT — it just gets it." },
  { name: "Thandi N.", role: "Restaurant Owner, Durban", quote: "Quotes and invoices look premium. Clients pay faster." },
  { name: "Ravi P.", role: "Tech Startup CEO", quote: "Contracts, NDAs and SOWs in minutes. Runs on any device." },
];

const PLANS = [
  { name: "Free Trial", price: "R0", period: "10 days", features: ["Unlimited documents", "AI Assistant", "PDF export", "No credit card"], cta: "Start free trial", highlight: false },
  { name: "Starter", price: "R99", period: "/ month", features: ["50 documents / month", "AI Assistant", "PDF & Word export", "Email support"], cta: "Choose Starter", highlight: false },
  { name: "Professional", price: "R299", period: "/ month", features: ["Unlimited documents", "AI Assistant Pro", "Branded templates", "Priority support"], cta: "Choose Professional", highlight: true },
  { name: "Business", price: "R699", period: "/ month", features: ["Team seats (5)", "Client portal", "Digital signatures", "Analytics"], cta: "Choose Business", highlight: false },
  { name: "Enterprise", price: "Custom", period: "", features: ["White-label", "SSO & audit logs", "Dedicated success mgr", "SLA & onboarding"], cta: "Talk to sales", highlight: false },
];

const FAQS = [
  { q: "How does the free trial work?", a: "You get full access to NexDocs AI for 10 days with no credit card. After the trial you can pick a plan or cancel — no charges." },
  { q: "Can I cancel anytime?", a: "Yes. All plans are month-to-month and you can cancel from your dashboard at any time." },
  { q: "Can I export to Word?", a: "Yes — every document can be exported to PDF or Word, and edited before sending." },
  { q: "Can I export to PDF?", a: "Yes. Every generated document has a one-click PDF export with your branding." },
  { q: "Is it built for South Africa?", a: "Every template and the AI itself are trained on SA context — ZAR, VAT (15%), POPIA, BCEA, LRA, CIDB, BBBEE." },
  { q: "Does it support POPIA?", a: "Yes. We ship POPIA-ready privacy notices, consent forms and data processing agreements." },
  { q: "Can I customise templates?", a: "Yes. Save your own branded templates and let the AI reuse them across all future documents." },
  { q: "Is my data secure?", a: "Your data is stored in a secure cloud platform with encryption in transit and at rest, and strict access controls." },
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
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
        <img src={CNH_LOGO} alt="NexDocs AI logo" className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-2xl shadow-black/40" />
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-navy-deep/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
          <span>🇿🇦</span> South Africa's AI Business Platform
        </div>
        <h1 className="mt-5 font-display text-4xl sm:text-6xl leading-tight">
          <span className="text-foreground">Run Your Business</span>{" "}
          <span className="text-gold-gradient">Smarter with AI</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground">
          Generate contracts, quotations, invoices, HR documents, company policies, compliance
          documents, tender documents and business advice in minutes — using one intelligent AI
          assistant built specifically for South African businesses.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/auth"
            className="rounded-lg bg-gold-gradient px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-gold/20 hover:opacity-95 transition"
          >
            Start Free 10-Day Trial
          </Link>
          <Link
            to="/assistant"
            className="rounded-lg border border-gold/40 px-6 py-3 font-semibold text-foreground hover:bg-navy/40 transition"
          >
            Try AI Assistant
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <li>✓ No Credit Card Required</li>
          <li>✓ Cancel Anytime</li>
          <li>✓ Secure Cloud Platform</li>
          <li>✓ Built for South Africa</li>
        </ul>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section aria-label="Trust indicators" className="border-y border-border/60 bg-navy-deep/40">
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
        eyebrow="Platform"
        title="Everything Your Business Needs"
        subtitle="One AI-powered platform for documents, compliance and day-to-day business operations."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur hover:border-gold/40 transition">
            <div className="text-2xl" aria-hidden>{f.icon}</div>
            <div className="mt-3 font-display text-lg">{f.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Industries() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="Industries"
        title="Made for every South African business"
        subtitle="Templates, workflows and AI advice tuned to your industry."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRIES.map((i) => (
          <div key={i.name} className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur hover:border-gold/40 transition">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-md bg-gold-gradient flex items-center justify-center text-lg" aria-hidden>{i.icon}</div>
              <div>
                <div className="font-display text-lg">{i.name}</div>
                <div className="text-xs text-muted-foreground">{i.desc}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-gold">{i.count} templates</span>
              <span className="text-muted-foreground">🤖 AI Assistant supported</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AssistantShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="AI Assistant"
        title="Ask. Generate. Send."
        subtitle="See how NexDocs AI turns a single sentence into a professional, ready-to-send document."
      />
      <div className="rounded-2xl border border-gold/30 bg-navy-deep/70 p-4 sm:p-6 backdrop-blur shadow-2xl shadow-black/40">
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-navy/70 px-4 py-3 text-sm border border-border/60">
              Create a quotation for painting a warehouse in Johannesburg.
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-card/80 px-4 py-4 text-sm border border-gold/20">
              <div className="text-xs uppercase tracking-widest text-gold mb-2">NexDocs AI</div>
              <div className="font-display text-base mb-2">Quotation — Warehouse Painting, Johannesburg</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Surface prep & priming — R 24,500</li>
                <li>• 2× coats premium acrylic (1,800 m²) — R 78,900</li>
                <li>• Line marking & safety signage — R 12,400</li>
                <li>• Subtotal: R 115,800 · VAT (15%): R 17,370</li>
                <li className="text-foreground">• Total: R 133,170 (valid 30 days)</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Download PDF", "Download Word", "Email Client", "Save Template", "Generate Invoice"].map((a) => (
                  <span key={a} className="rounded-md border border-gold/40 px-3 py-1 text-xs text-gold">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/assistant" className="inline-block rounded-lg bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Try the AI Assistant
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, icon: "🎯", title: "Choose a task", desc: "Pick a document type or just ask the AI assistant." },
    { n: 2, icon: "📝", title: "Answer a few questions", desc: "We only ask what's needed — the rest is auto-filled from your business profile." },
    { n: 3, icon: "📤", title: "Download or send", desc: "Export to PDF or Word, email a client, or save as a reusable template." },
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
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="Templates"
        title="Professional documents, ready to send"
        subtitle="A glimpse of what NexDocs AI can generate for your business."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {DOC_GALLERY.map((d) => (
          <div key={d} className="group rounded-xl border border-border/60 bg-card/50 p-3 backdrop-blur hover:border-gold/40 transition">
            <div className="aspect-[3/4] rounded-md bg-gradient-to-br from-navy to-navy-deep p-3 flex flex-col border border-border/60">
              <div className="h-2 w-16 rounded bg-gold/70" />
              <div className="mt-2 h-1.5 w-full rounded bg-border/80" />
              <div className="mt-1 h-1.5 w-11/12 rounded bg-border/70" />
              <div className="mt-1 h-1.5 w-10/12 rounded bg-border/60" />
              <div className="mt-3 h-1.5 w-full rounded bg-border/50" />
              <div className="mt-1 h-1.5 w-9/12 rounded bg-border/50" />
              <div className="mt-1 h-1.5 w-11/12 rounded bg-border/40" />
              <div className="mt-auto flex justify-between">
                <div className="h-2 w-10 rounded bg-gold/40" />
                <div className="h-2 w-6 rounded bg-border/60" />
              </div>
            </div>
            <div className="mt-2 text-xs text-center text-muted-foreground group-hover:text-foreground transition">{d}</div>
          </div>
        ))}
      </div>
    </section>
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
        <div className="rounded-xl border border-gold/40 bg-gradient-to-b from-navy to-navy-deep p-6 shadow-lg shadow-gold/10">
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
        eyebrow="Loved by SA businesses"
        title="What early customers say"
        subtitle="Sample testimonials shown until verified customer reviews are collected."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur">
            <blockquote className="text-sm text-foreground">"{t.quote}"</blockquote>
            <figcaption className="mt-4 text-xs text-muted-foreground">
              <span className="text-gold">{t.name}</span> — {t.role}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        Sample content
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        subtitle="Start free for 10 days. Upgrade when you're ready."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={
              "rounded-xl border p-5 backdrop-blur flex flex-col " +
              (p.highlight
                ? "border-gold/60 bg-gradient-to-b from-navy to-navy-deep shadow-xl shadow-gold/10 relative"
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
            <Link
              to="/auth"
              className={
                "mt-5 block text-center rounded-md px-4 py-2 text-sm font-semibold transition " +
                (p.highlight
                  ? "bg-gold-gradient text-primary-foreground"
                  : "border border-gold/40 text-foreground hover:bg-navy/40")
              }
            >
              {p.cta}
            </Link>
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
      <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-navy to-navy-deep p-8 sm:p-12 text-center shadow-2xl shadow-black/40">
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
