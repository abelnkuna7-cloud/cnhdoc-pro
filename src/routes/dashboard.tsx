import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  useAuth,
  hasActiveAccess,
  daysLeft,
} from "@/lib/auth-context";
import { COMPANIES } from "@/lib/companies";
import {
  cleanGeneratedDocument,
  generateDocument,
  parseDocumentFields,
} from "@/lib/generate-doc.functions";
import {
  loadConversations,
  loadBusinessMemory,
  type Conversation,
  type BusinessMemory,
} from "@/lib/assistant-storage";
import { DOCUMENT_TEMPLATES } from "@/lib/document-templates";
import { downloadBrandedPdf } from "@/lib/branded-pdf";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      {
        title: "Dashboard — NexDocs",
      },
      {
        name: "description",
        content:
          "Generate professional South African business documents with AI. Choose a company, pick a document type, and download your PDF in seconds.",
      },
      {
        name: "robots",
        content: "noindex",
      },
      {
        property: "og:title",
        content: "NexDocs Dashboard — Generate Your Documents",
      },
      {
        property: "og:description",
        content:
          "Your NexDocs workspace for AI-powered South African business document generation.",
      },
      {
        property: "og:url",
        content:
          "https://nexdocs.cossanexusholdings.co.za/dashboard",
      },
    ],
    links: [
      {
        rel: "canonical",
        href:
          "https://nexdocs.cossanexusholdings.co.za/dashboard",
      },
    ],
  }),
  component: Dashboard,
});

const FIELD_ALIASES: Record<string, string> = {
  client: "Client name",
  "client name": "Client name",
  customer: "Client name",
  "customer name": "Client name",
  recipient: "Client name",

  service: "Service",
  services: "Service",
  work: "Service",
  job: "Service",

  project: "Project",
  "project name": "Project",

  description: "Scope of work",
  scope: "Scope of work",
  "scope of work": "Scope of work",
  "work description": "Scope of work",
  "project description": "Scope of work",

  amount: "Amount",
  price: "Amount",
  total: "Amount",
  cost: "Amount",
  fee: "Amount",
  budget: "Amount",

  date: "Document date",
  "document date": "Document date",
  "quotation date": "Document date",
  "invoice date": "Document date",
  "proposal date": "Document date",

  address: "Client address",
  "client address": "Client address",
  "customer address": "Client address",

  "site address": "Site address",
  location: "Site address",
  "project location": "Site address",

  payment: "Payment terms",
  "payment term": "Payment terms",
  "payment terms": "Payment terms",

  validity: "Quotation validity",
  "valid for": "Quotation validity",
  "quotation validity": "Quotation validity",
  "validity period": "Quotation validity",

  deadline: "Acceptance deadline",
  "acceptance deadline": "Acceptance deadline",

  quantity: "Quantity",
  qty: "Quantity",

  "unit price": "Unit price",
  rate: "Unit price",

  vat: "VAT status",
  "vat status": "VAT status",

  email: "Client email",
  "client email": "Client email",
  "customer email": "Client email",

  phone: "Client phone",
  telephone: "Client phone",
  mobile: "Client phone",
  "client phone": "Client phone",
  "customer phone": "Client phone",

  representative: "Client representative",
  "client representative": "Client representative",

  "quotation number": "Document number",
  "invoice number": "Document number",
  "document number": "Document number",

  notes: "Additional notes",
  note: "Additional notes",
  "additional notes": "Additional notes",
};

function normaliseCompanyName(name: string): string {
  const trimmedName = name.trim();

  if (
    trimmedName.toLowerCase() ===
    "cossa construction & diy"
  ) {
    return "Cossa Nexus Constructions";
  }

  return trimmedName;
}


function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const generate = useServerFn(generateDocument);

  const [companyId, setCompanyId] = useState<
    string | null
  >(null);

  const [docType, setDocType] = useState<
    string | null
  >(null);

  const [fieldsText, setFieldsText] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const cleanedOutput = useMemo(
    () => cleanGeneratedDocument(output),
    [output],
  );

  const [convs, setConvs] = useState<
    Conversation[]
  >([]);

  const [mem, setMem] = useState<BusinessMemory>(
    {},
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/auth",
      });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setConvs(loadConversations());
    setMem(loadBusinessMemory());
  }, []);

  const company = useMemo(
    () =>
      COMPANIES.find(
        (companyItem) =>
          companyItem.id === companyId,
      ) ?? null,
    [companyId],
  );

  const companyName = company
    ? normaliseCompanyName(company.name)
    : "";

  const active = hasActiveAccess(profile);
  const dl = daysLeft(profile);

  const recent = useMemo(
    () =>
      [...convs]
        .sort(
          (firstConversation, secondConversation) =>
            secondConversation.updatedAt -
            firstConversation.updatedAt,
        )
        .slice(0, 4),
    [convs],
  );

  const popularTemplates = useMemo(
    () =>
      DOCUMENT_TEMPLATES.filter(
        (template) => template.popular,
      ).slice(0, 6),
    [],
  );

  const memoryFilled =
    Object.values(mem).filter(Boolean).length;

  const memoryTotal = 11;

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const onGenerate = async () => {
    if (!company || !docType) {
      setError(
        "Please choose an industry and document type.",
      );
      return;
    }

    if (!active) {
      navigate({
        to: "/subscribe",
      });
      return;
    }

    const { fields, errors } =
      parseDocumentFields(fieldsText);

    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }

    if (Object.keys(fields).length === 0) {
      setError(
        "Please enter at least one document detail using the format “Field: Value”.",
      );
      return;
    }

    setBusy(true);
    setError(null);
    setOutput("");

    try {
      const result = await generate({
        data: {
          company: companyName,
          documentType: docType,
          fields,
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const cleanedContent = cleanGeneratedDocument(result.content);
      setOutput(cleanedContent);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Document generation failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyOutput = async () => {
    if (!cleanedOutput) {
      return;
    }

    try {
      await navigator.clipboard.writeText(cleanedOutput);
    } catch {
      // Ignore clipboard failures in unsupported environments.
    }
  };

  const downloadTextFile = () => {
    if (!cleanedOutput) {
      return;
    }

    const blob = new Blob([cleanedOutput], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(docType || "document").replace(/[^a-zA-Z0-9\s_-]/g, "").replace(/\s+/g, "_") || "document"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!cleanedOutput || !company || !docType) {
      return;
    }

    await downloadBrandedPdf({
      title: docType,
      content: cleanedOutput,
      brand: {
        companyName,
        companyLogo: company.logo,
        watermarkLogo: "/logos/cossa-nexus-holdings-logo.png",
        email: mem.email,
        phone: mem.phone,
        website: mem.website,
      },
    });
  };

  const printOutput = () => {
    if (!cleanedOutput) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=800,height=900");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${docType || "Document"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; white-space: pre-wrap; }
            h1 { font-size: 18px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h1>${(docType || "Document").replace(/</g, "&lt;")}</h1>
          <pre>${cleanedOutput.replace(/</g, "&lt;")}</pre>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const saveTemplate = () => {
    if (!cleanedOutput) {
      return;
    }

    const blob = new Blob([cleanedOutput], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(docType || "template").replace(/[^a-zA-Z0-9\s_-]/g, "").replace(/\s+/g, "_") || "template"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const emailOutput = () => {
    if (!cleanedOutput) {
      return;
    }

    const subject = encodeURIComponent(`${docType || "Document"} draft`);
    const body = encodeURIComponent(cleanedOutput);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="sr-only">
        NexDocs Dashboard — Generate Your Documents
      </h1>

      <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-card/70 p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <div className="font-display text-xl text-foreground">
            Welcome
            {profile?.displayName
              ? `, ${
                  profile.displayName.split(" ")[0]
                }`
              : ""}
            .
          </div>

          <div className="text-sm text-muted-foreground">
            {profile?.email}
          </div>
        </div>

        <div className="text-sm">
          {profile?.isAdmin ? (
            <span className="rounded-full bg-gold-gradient px-3 py-1 font-semibold text-primary-foreground">
              CEO · Unlimited Access
            </span>
          ) : profile?.subscriptionStatus ===
            "active" ? (
            <span className="rounded-full bg-gold-gradient px-3 py-1 font-semibold text-primary-foreground">
              Active subscriber
            </span>
          ) : active ? (
            <span className="rounded-full border border-gold/60 px-3 py-1 text-gold">
              Trial • {dl} day
              {dl === 1 ? "" : "s"} left
            </span>
          ) : (
            <Link
              to="/subscribe"
              className="rounded-full bg-gold-gradient px-3 py-1 font-semibold text-primary-foreground"
            >
              Subscribe — R99/mo
            </Link>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/assistant"
          className="flex items-center justify-between rounded-xl border border-gold/60 bg-card/70 p-4 transition hover:border-gold"
        >
          <div>
            <div className="font-display text-lg text-foreground">
              AI Assistant
            </div>

            <div className="text-xs text-muted-foreground">
              Chat with NexDocs AI, draft a
              document, or get South African
              business guidance.
            </div>
          </div>

          <span className="text-gold">→</span>
        </Link>

        <Link
          to="/leads"
          className="flex items-center justify-between rounded-xl border border-gold/40 bg-card/70 p-4 transition hover:border-gold"
        >
          <div>
            <div className="font-display text-lg text-foreground">
              Gauteng Lead Finder
            </div>

            <div className="text-xs text-muted-foreground">
              Find business leads across Gauteng
              using live OpenStreetMap data.
            </div>
          </div>

          <span className="text-gold">→</span>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card/70 p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-lg text-foreground">
              Recent conversations
            </div>

            <Link
              to="/assistant"
              className="text-xs text-gold hover:underline"
            >
              Open assistant →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No chats yet.{" "}
              <Link
                to="/assistant"
                className="text-gold hover:underline"
              >
                Start your first conversation
              </Link>{" "}
              with the NexDocs AI Business
              Assistant.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {recent.map((conversation) => (
                <li
                  key={conversation.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-foreground">
                      {conversation.title}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {new Date(
                        conversation.updatedAt,
                      ).toLocaleString("en-ZA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {conversation.messages.length}{" "}
                      messages
                    </div>
                  </div>

                  <Link
                    to="/assistant"
                    className="rounded-full border border-gold/40 px-2.5 py-1 text-xs text-gold hover:border-gold"
                  >
                    Resume
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card/70 p-4">
          <div className="font-display text-lg text-foreground">
            Business profile
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            Fill this once and the AI can reuse it
            in future documents.
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-deep/60">
            <div
              className="h-full bg-gold-gradient"
              style={{
                width: `${Math.round(
                  (memoryFilled / memoryTotal) * 100,
                )}%`,
              }}
            />
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {memoryFilled} of {memoryTotal} fields
            complete
          </div>

          <Link
            to="/assistant"
            className="mt-3 inline-block rounded-full border border-gold/40 px-3 py-1 text-xs text-gold hover:border-gold"
          >
            {memoryFilled === 0
              ? "Set up business memory"
              : "Update business memory"}
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border/60 bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-lg text-foreground">
            Popular templates
          </div>

          <a
            href="/#documents"
            className="text-xs text-gold hover:underline"
          >
            Browse all →
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {popularTemplates.map((template) => (
            <a
              key={template.id}
              href={`/assistant?template=${encodeURIComponent(
                template.id,
              )}`}
              className="block rounded-lg border border-border/60 bg-background/40 p-3 text-left transition hover:border-gold/60"
            >
              <div className="text-2xl">
                {template.icon}
              </div>

              <div className="mt-1 line-clamp-2 text-xs font-semibold text-foreground">
                {template.title}
              </div>

              <div className="text-[10px] text-muted-foreground">
                {template.category}
              </div>
            </a>
          ))}
        </div>
      </div>

      <h2 className="mb-1 font-display text-2xl text-foreground">
        Choose an Industry
      </h2>

      <p className="mb-3 text-sm text-muted-foreground">
        Pick the industry closest to your business.
        Templates are designed for South African
        businesses.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COMPANIES.map((companyItem) => {
          const displayedName =
            normaliseCompanyName(companyItem.name);

          return (
            <button
              key={companyItem.id}
              type="button"
              onClick={() => {
                setCompanyId(companyItem.id);
                setDocType(null);
                setFieldsText("");
                setOutput("");
                setError(null);
              }}
              className={`rounded-xl border p-3 text-left transition ${
                companyId === companyItem.id
                  ? "border-gold bg-card"
                  : "border-border/60 bg-card/60 hover:border-gold/60"
              }`}
            >
              <div className="flex items-center gap-2">
                {companyItem.logo ? (
                  <img
                    src={companyItem.logo}
                    alt=""
                    className="h-10 w-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold-gradient font-display text-primary-foreground">
                    SA
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold leading-tight text-foreground">
                    {displayedName}
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    {companyItem.documents.length}{" "}
                    docs
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {company && (
        <div className="mt-8 rounded-xl border border-border/60 bg-card/70 p-4 sm:p-5">
          <h3 className="mb-3 font-display text-xl text-foreground">
            {companyName} — pick a document
          </h3>

          <div className="flex flex-wrap gap-2">
            {company.documents.map((documentName) => (
              <button
                key={documentName}
                type="button"
                onClick={() => {
                  setDocType(documentName);
                  setOutput("");
                  setError(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  docType === documentName
                    ? "border-gold bg-gold-gradient font-semibold text-primary-foreground"
                    : "border-border/60 text-foreground/80 hover:border-gold/60"
                }`}
              >
                {documentName}
              </button>
            ))}
          </div>

          {docType && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Document details
                <span className="ml-1 text-xs text-muted-foreground">
                  One item per line, or combine multiple{" "}
                  <code>Field: Value</code> pairs with semicolons
                </span>
              </label>

              <textarea
                value={fieldsText}
                onChange={(event) =>
                  setFieldsText(event.target.value)
                }
                placeholder={
                  "Client name: Thabo\nService: Office painting\nScope of work: Prepare and paint office walls\nAmount: R25 000\nPayment terms: 50% deposit and balance on completion\nQuotation validity: 14 days"
                }
                rows={8}
                className="w-full rounded-md border border-border bg-input px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
              />

              <div className="mt-2 text-xs text-muted-foreground">
                NexDocs will use supplied information
                exactly and insert clear placeholders
                where important information is missing.
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={busy}
                  className="rounded-md bg-gold-gradient px-5 py-2.5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy
                    ? "Generating…"
                    : `Generate ${docType}`}
                </button>

                {output && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyOutput}
                      className="rounded-md border border-gold/60 px-4 py-2.5 font-semibold text-foreground"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={downloadTextFile}
                      className="rounded-md border border-gold/60 px-4 py-2.5 font-semibold text-foreground"
                    >
                      Download Text
                    </button>
                    <button
                      type="button"
                      onClick={downloadPdf}
                      className="rounded-md border border-gold/60 px-4 py-2.5 font-semibold text-foreground"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={printOutput}
                      className="rounded-md border border-gold/60 px-4 py-2.5 font-semibold text-foreground"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={saveTemplate}
                      className="rounded-md border border-gold/60 px-4 py-2.5 font-semibold text-foreground"
                    >
                      Save Template
                    </button>
                    <button
                      type="button"
                      onClick={emailOutput}
                      className="rounded-md border border-gold/60 px-4 py-2.5 font-semibold text-foreground"
                    >
                      Email
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {output && (
                <pre className="mt-5 whitespace-pre-wrap rounded-md border border-border/60 bg-background p-4 font-sans text-sm text-foreground/90">
                  {cleanedOutput}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
