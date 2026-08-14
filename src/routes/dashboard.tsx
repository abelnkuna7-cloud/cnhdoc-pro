import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import {
  type BusinessMemory,
  type BusinessUnit,
  listWorkspaceBusinessUnits,
  loadBusinessMemory,
  saveBusinessMemory,
  saveDocumentDraft,
} from "@/lib/nexdocs-data";
import {
  cleanGeneratedDocument,
  generateDocument,
} from "@/lib/generate-doc.functions";
import { downloadBrandedPdf } from "@/lib/branded-pdf";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    document: typeof search.document === "string" ? search.document : "",
  }),
  head: () => ({
    meta: [
      { title: "NexDocs workspace — Guided documents" },
      {
        name: "description",
        content:
          "Create a professional business document through a guided, editable NexDocs brief.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const DOCUMENT_TYPES = [
  "Quotation",
  "Tax invoice",
  "Service agreement",
  "Employment contract",
  "Scope of work",
  "Method statement",
  "Risk assessment",
  "POPIA policy",
  "Company profile",
  "Tender document",
  "Catering quotation",
  "Company letterhead",
  "Business card",
  "Proposal",
  "Purchase order",
  "Delivery note",
];

type DocumentForm = {
  documentType: string;
  businessUnitId: string;
  issuingCompany: string;
  issuerContact: string;
  issuerEmail: string;
  issuerPhone: string;
  issuerAddress: string;
  clientName: string;
  clientContact: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  documentDate: string;
  projectDate: string;
  projectTime: string;
  title: string;
  scope: string;
  lineItems: string;
  amount: string;
  vatStatus: string;
  paymentTerms: string;
  validity: string;
  notes: string;
};

function blankForm(): DocumentForm {
  return {
    documentType: "Quotation",
    businessUnitId: "",
    issuingCompany: "",
    issuerContact: "",
    issuerEmail: "",
    issuerPhone: "",
    issuerAddress: "",
    clientName: "",
    clientContact: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    documentDate: new Date().toISOString().slice(0, 10),
    projectDate: "",
    projectTime: "",
    title: "",
    scope: "",
    lineItems: "",
    amount: "",
    vatStatus: "Not specified",
    paymentTerms: "Payment terms to be agreed",
    validity: "14 days",
    notes: "",
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-foreground/90">
      <span className="mb-1.5 block font-medium">
        {label}
        {required ? <span className="ml-1 text-gold">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-foreground/90">
      <span className="mb-1.5 block font-medium">
        {label}
        {required ? <span className="ml-1 text-gold">*</span> : null}
      </span>
      <textarea
        value={value}
        required={required}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { document: requestedDocument } = Route.useSearch();
  const generate = useServerFn(generateDocument);
  const [form, setForm] = useState<DocumentForm>(blankForm);
  const [memory, setMemory] = useState<BusinessMemory>({});
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [output, setOutput] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof DocumentForm>(
    key: K,
    value: DocumentForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !profile) return;

    const loadWorkspace = async () => {
      try {
        const [savedMemory, workspaceUnits] = await Promise.all([
          loadBusinessMemory(user.uid),
          listWorkspaceBusinessUnits(profile),
        ]);

        const preferredSlug =
          typeof savedMemory.defaults?.preferred_business_unit === "string"
            ? savedMemory.defaults.preferred_business_unit
            : "cossa-nexus-construction";
        const preferredUnit =
          profile.isCossaWorkspace
            ? workspaceUnits.find((unit) => unit.slug === preferredSlug) ??
              workspaceUnits.find((unit) => unit.slug === "cossa-nexus-construction") ??
              workspaceUnits[0]
            : undefined;
        const requestedType = DOCUMENT_TYPES.find(
          (type) => type.toLowerCase() === requestedDocument.toLowerCase(),
        );

        setMemory(savedMemory);
        setUnits(workspaceUnits);
        setForm((current) => ({
          ...current,
          documentType: requestedType || current.documentType,
          issuingCompany:
            preferredUnit?.name ||
            savedMemory.companyName ||
            current.issuingCompany,
          issuerContact: savedMemory.contactName || current.issuerContact,
          issuerEmail: savedMemory.email || current.issuerEmail,
          issuerPhone: savedMemory.phone || current.issuerPhone,
          issuerAddress: savedMemory.address || current.issuerAddress,
          businessUnitId: preferredUnit?.id || current.businessUnitId,
        }));
      } catch (loadError) {
        console.error(loadError);
        setError("Your private workspace could not be loaded. Please refresh and try again.");
      }
    };

    void loadWorkspace();
  }, [user, profile, requestedDocument]);

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === form.businessUnitId) ?? null,
    [units, form.businessUnitId],
  );

  const outputText = useMemo(
    () => cleanGeneratedDocument(output),
    [output],
  );

  if (loading || !user || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        Loading your private workspace…
      </div>
    );
  }

  const chooseUnit = (unitId: string) => {
    const unit = units.find((item) => item.id === unitId);
    setForm((current) => ({
      ...current,
      businessUnitId: unitId,
      issuingCompany: unit?.name || current.issuingCompany,
    }));
  };

  const persistMemory = async () => {
    setMemoryBusy(true);
    setError(null);
    try {
      const nextMemory: BusinessMemory = {
        companyName:
          profile.isCossaWorkspace
            ? memory.companyName || "Cossa Nexus Holdings (Pty) Ltd"
            : form.issuingCompany,
        contactName: form.issuerContact,
        email: form.issuerEmail,
        phone: form.issuerPhone,
        address: form.issuerAddress,
        defaults:
          profile.isCossaWorkspace
            ? {
                ...memory.defaults,
                preferred_business_unit:
                  selectedUnit?.slug || "cossa-nexus-construction",
              }
            : memory.defaults,
      };
      await saveBusinessMemory(user.uid, profile, nextMemory);
      setMemory(nextMemory);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your business details.",
      );
    } finally {
      setMemoryBusy(false);
    }
  };

  const createDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!form.issuingCompany.trim() || !form.clientName.trim() || !form.scope.trim()) {
      setError("Please complete the issuing company, client name and scope of work.");
      return;
    }

    const fields = Object.fromEntries(
      Object.entries({
        "Issuing company": form.issuingCompany,
        "Issuer contact": form.issuerContact,
        "Issuer email": form.issuerEmail,
        "Issuer phone": form.issuerPhone,
        "Issuer address": form.issuerAddress,
        "Client name": form.clientName,
        "Client contact": form.clientContact,
        "Client email": form.clientEmail,
        "Client phone": form.clientPhone,
        "Client address": form.clientAddress,
        "Document date": form.documentDate,
        "Project or service date": form.projectDate,
        "Project or service time": form.projectTime,
        Subject: form.title,
        "Scope of work": form.scope,
        "Line items": form.lineItems,
        "Amount or budget": form.amount,
        "VAT status": form.vatStatus,
        "Payment terms": form.paymentTerms,
        "Validity": form.validity,
        "Additional instructions": form.notes,
      }).filter(([, value]) => value.trim().length > 0),
    );

    setBusy(true);
    try {
      const result = await generate({
        data: {
          company: form.issuingCompany,
          documentType: form.documentType,
          fields,
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const generated = cleanGeneratedDocument(result.content);
      const title =
        form.title.trim() ||
        form.documentType + " — " + form.clientName.trim();

      setOutput(generated);

      await saveDocumentDraft({
        userId: user.uid,
        profile,
        documentType: form.documentType,
        title,
        businessUnitId: selectedUnit?.id ?? null,
        formData: fields,
        generatedContent: generated,
      });

      const nextMemory: BusinessMemory = {
        companyName:
          profile.isCossaWorkspace
            ? memory.companyName || "Cossa Nexus Holdings (Pty) Ltd"
            : form.issuingCompany,
        contactName: form.issuerContact,
        email: form.issuerEmail,
        phone: form.issuerPhone,
        address: form.issuerAddress,
        defaults:
          profile.isCossaWorkspace
            ? {
                ...memory.defaults,
                preferred_business_unit:
                  selectedUnit?.slug || "cossa-nexus-construction",
              }
            : memory.defaults,
      };
      await saveBusinessMemory(user.uid, profile, nextMemory);
      setMemory(nextMemory);
      setSaved(true);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate the document.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-card via-card to-charcoal/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Guided document brief
            </div>
            <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
              Build a polished first draft — one clear step at a time.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Complete the details below, review the editable result, then download it when it is ready.
              NexDocs does not invent company, client, date or pricing details.
            </p>
          </div>
          <Link
            to="/assistant"
            className="rounded-lg border border-gold/50 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
          >
            Ask NexDocs AI
          </Link>
        </div>

        {profile.isCossaWorkspace ? (
          <div className="mt-6 rounded-2xl border border-gold/30 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Cossa Nexus private workspace
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your organisation defaults and the six business units are visible only in this signed-in workspace.
                </p>
              </div>
              <a
                href="https://growth.cossanexusholdings.co.za/operations/nexdocs"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-gold hover:text-gold-soft"
              >
                View NexDocs activity in Growth →
              </a>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <button
                  type="button"
                  key={unit.id}
                  onClick={() => chooseUnit(unit.id)}
                  className={
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition " +
                    (form.businessUnitId === unit.id
                      ? "border-gold bg-gold/10"
                      : "border-border/60 bg-background/30 hover:border-gold/50")
                  }
                >
                  {unit.slug === "cossa-nexus-construction" ? (
                    <img
                      src="/logos/cossa-nexus-construction-logo.jpg"
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-lg text-gold">
                      {unit.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {unit.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Use as issuing company
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border/70 bg-background/30 p-4 text-sm text-muted-foreground">
            This is your private document workspace. Your company details and generated documents are separated from every other NexDocs account.
          </div>
        )}
      </div>

      <form onSubmit={createDocument} className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-xl shadow-black/10 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-foreground">Document details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Short, clear inputs produce a professional editable draft.
              </p>
            </div>
            <select
              value={form.documentType}
              onChange={(event) => update("documentType", event.target.value)}
              className="rounded-lg border border-gold/50 bg-background px-3 py-2 text-sm text-foreground outline-none"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Document title"
              value={form.title}
              onChange={(value) => update("title", value)}
              placeholder="e.g. Warehouse painting quotation"
            />
            <Field
              label="Document date"
              value={form.documentDate}
              onChange={(value) => update("documentDate", value)}
              type="date"
              required
            />
            <Field
              label="Project or service date"
              value={form.projectDate}
              onChange={(value) => update("projectDate", value)}
              type="date"
            />
            <Field
              label="Time, if relevant"
              value={form.projectTime}
              onChange={(value) => update("projectTime", value)}
              type="time"
            />
          </div>

          <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-display text-lg text-foreground">Your business</h3>
                <button
                  type="button"
                  onClick={() => void persistMemory()}
                  disabled={memoryBusy}
                  className="text-xs font-semibold text-gold hover:text-gold-soft disabled:opacity-60"
                >
                  {memoryBusy ? "Saving…" : memory.companyName ? "Update saved details" : "Save for next time"}
                </button>
              </div>
            </div>
            <Field
              label="Issuing company"
              value={form.issuingCompany}
              onChange={(value) => update("issuingCompany", value)}
              required
            />
            <Field
              label="Contact person"
              value={form.issuerContact}
              onChange={(value) => update("issuerContact", value)}
              placeholder="Full name"
            />
            <Field
              label="Business email"
              value={form.issuerEmail}
              onChange={(value) => update("issuerEmail", value)}
              type="email"
            />
            <Field
              label="Business phone"
              value={form.issuerPhone}
              onChange={(value) => update("issuerPhone", value)}
              type="tel"
            />
            <div className="sm:col-span-2">
              <Field
                label="Business address"
                value={form.issuerAddress}
                onChange={(value) => update("issuerAddress", value)}
                placeholder="Street, suburb, city"
              />
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="font-display text-lg text-foreground">Client or receiving party</h3>
            </div>
            <Field
              label="Client or company name"
              value={form.clientName}
              onChange={(value) => update("clientName", value)}
              required
            />
            <Field
              label="Contact person"
              value={form.clientContact}
              onChange={(value) => update("clientContact", value)}
            />
            <Field
              label="Client email"
              value={form.clientEmail}
              onChange={(value) => update("clientEmail", value)}
              type="email"
            />
            <Field
              label="Client phone"
              value={form.clientPhone}
              onChange={(value) => update("clientPhone", value)}
              type="tel"
            />
            <div className="sm:col-span-2">
              <Field
                label="Client address"
                value={form.clientAddress}
                onChange={(value) => update("clientAddress", value)}
                placeholder="Street, suburb, city"
              />
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 pt-5">
            <TextField
              label="Scope of work or document purpose"
              value={form.scope}
              onChange={(value) => update("scope", value)}
              placeholder="Describe the work, document purpose or key agreement in plain language."
              required
            />
            <TextField
              label="Line items, quantities and prices"
              value={form.lineItems}
              onChange={(value) => update("lineItems", value)}
              placeholder={"Item 1 — 2 units at R1,500\nItem 2 — 1 service at R4,000"}
              rows={4}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Total, rate or budget"
                value={form.amount}
                onChange={(value) => update("amount", value)}
                placeholder="e.g. R 45,000"
              />
              <label className="block text-sm text-foreground/90">
                <span className="mb-1.5 block font-medium">VAT treatment</span>
                <select
                  value={form.vatStatus}
                  onChange={(event) => update("vatStatus", event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                >
                  <option>Not specified</option>
                  <option>VAT inclusive</option>
                  <option>VAT exclusive</option>
                  <option>Not VAT registered</option>
                </select>
              </label>
              <Field
                label="Payment terms"
                value={form.paymentTerms}
                onChange={(value) => update("paymentTerms", value)}
              />
              <Field
                label="Validity or expiry"
                value={form.validity}
                onChange={(value) => update("validity", value)}
              />
            </div>
            <TextField
              label="Additional instructions"
              value={form.notes}
              onChange={(value) => update("notes", value)}
              placeholder="Add only facts you want in the document. The result stays concise and editable."
              rows={3}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gold-gradient px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-gold/20 transition hover:brightness-105 disabled:opacity-60"
          >
            {busy ? "Creating your editable draft…" : "Create editable document"}
          </button>
        </section>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-gold/30 bg-card/70 p-5 shadow-xl shadow-black/10">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Review before sending
            </div>
            <h2 className="mt-2 font-display text-2xl text-foreground">
              {outputText ? "Your editable draft" : "A professional result, not a template dump."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {outputText
                ? "Review the wording, update any details and download a branded copy when you are happy."
                : "NexDocs uses only the details you provide. It will not fill a client name, company number, date or price with made-up information."}
            </p>

            {outputText ? (
              <>
                <textarea
                  value={outputText}
                  onChange={(event) => setOutput(cleanGeneratedDocument(event.target.value))}
                  aria-label="Editable document draft"
                  className="mt-5 min-h-[28rem] w-full rounded-xl border border-border/60 bg-background p-4 font-sans text-sm leading-6 text-foreground outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(outputText)}
                    className="rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-foreground hover:border-gold/60"
                  >
                    Copy text
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadBrandedPdf({
                        title:
                          form.title ||
                          form.documentType + " — " + form.clientName,
                        content: outputText,
                        brand: {
                          companyName: form.issuingCompany,
                          companyLogo:
                            selectedUnit?.slug === "cossa-nexus-construction"
                              ? "/logos/cossa-nexus-construction-logo.jpg"
                              : "/logos/nexdocs-logo.png",
                          watermarkLogo: "/logos/nexdocs-logo.png",
                          email: form.issuerEmail,
                          phone: form.issuerPhone,
                        },
                      })
                    }
                    className="rounded-lg bg-gold-gradient px-3 py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    Download PDF
                  </button>
                </div>
                {saved ? (
                  <p className="mt-3 text-xs text-gold">
                    Saved to your private NexDocs workspace.
                    {profile.isCossaWorkspace
                      ? " It is also visible as document activity in Growth."
                      : ""}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-background/30 p-5">
                <div className="text-sm font-semibold text-foreground">What happens next</div>
                <ol className="mt-3 space-y-2 text-sm leading-5 text-muted-foreground">
                  <li>1. NexDocs creates a concise draft from this brief.</li>
                  <li>2. You review and amend the wording.</li>
                  <li>3. Download a shareable PDF when ready.</li>
                </ol>
              </div>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
