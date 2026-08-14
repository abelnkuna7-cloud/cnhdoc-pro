import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const WORKER_URL =
  process.env.NEXDOCS_WORKER_URL ??
  "https://nexdocs-api.cossa.workers.dev/api/generate";

const GenerateInputSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),

  documentType: z
    .string()
    .trim()
    .min(1, "Document type is required")
    .max(100),

  fields: z
    .record(
      z.string().trim().min(1).max(200),
      z.string().trim().max(5_000),
    )
    .default({}),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;

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

  issuer: "Issuing company",
  "issuer name": "Issuing company",
  "issuing company": "Issuing company",
  "company name": "Issuing company",
};

type WorkerResponse = {
  markdown?: string;
  content?: string;
  error?: string;
};

function cleanFields(
  fields: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields)
      .map(
        ([key, value]) =>
          [key.trim().replace(/\s+/g, " "), value.trim()] as const,
      )
      .filter(([key, value]) => key.length > 0 && value.length > 0),
  );
}

function normaliseFieldKey(rawKey: string): string {
  const cleanedKey = rawKey
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  return FIELD_ALIASES[cleanedKey] ?? rawKey.trim();
}

export function cleanGeneratedDocument(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/^\s*[-:|\s]+$/gm, "")
    .replace(/^\s*\*\s+/gm, "• ")
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseDocumentFields(fieldsText: string): {
  fields: Record<string, string>;
  errors: string[];
} {
  const fields: Record<string, string> = {};
  const errors: string[] = [];

  fieldsText.split(/\r?\n/).forEach((rawLine, index) => {
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      return;
    }

    const segments = trimmedLine
      .split(/;\s*|\s*\|\s*/g)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return;
    }

    segments.forEach((segment) => {
      const separatorIndex = segment.indexOf(":");

      if (separatorIndex <= 0) {
        errors.push(`Line ${index + 1} contains a malformed field entry: "${segment}"`);
        return;
      }

      const rawKey = segment.slice(0, separatorIndex).trim();
      const rawValue = segment.slice(separatorIndex + 1).trim();

      if (!rawKey || !rawValue) {
        errors.push(`Line ${index + 1} contains an incomplete field entry: "${segment}"`);
        return;
      }

      const normalisedKey = normaliseFieldKey(rawKey);
      fields[normalisedKey] = rawValue;
    });
  });

  return { fields, errors };
}

function getFieldValue(
  fields: Record<string, string>,
  candidates: string[],
): string | undefined {
  for (const candidate of candidates) {
    const direct = fields[candidate];
    if (direct) {
      return direct;
    }
  }

  const lowerFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key.toLowerCase(), value]),
  );

  for (const candidate of candidates) {
    const lower = lowerFields[candidate.toLowerCase()];
    if (lower) {
      return lower;
    }
  }

  return undefined;
}

function hasFieldMatching(
  fields: Record<string, string>,
  pattern: RegExp,
): boolean {
  return Object.entries(fields).some(
    ([key, value]) => pattern.test(key) && value.trim().length > 0,
  );
}

export function getMissingDocumentInformation(input: GenerateInput): string[] {
  const fields = cleanFields(input.fields);
  const docType = input.documentType.toLowerCase();

  if (!docType.includes("quotation") && !docType.includes("quote")) {
    return [];
  }

  const missing: string[] = [];
  const company = input.company.trim().toLowerCase();
  if (!company || company === "client" || company.includes("required")) {
    missing.push("Issuing company name");
  }

  if (!getFieldValue(fields, ["Client name", "Client", "Customer name", "Customer"])) {
    missing.push("Client name");
  }

  const hasDescription =
    Boolean(getFieldValue(fields, ["Service", "Scope of work", "Project", "Description"])) ||
    hasFieldMatching(fields, /^(item|line item|material|product|service)\b/i);
  if (!hasDescription) {
    missing.push("Line-item descriptions or scope of work");
  }

  const hasTotal = Boolean(getFieldValue(fields, ["Amount", "Price", "Cost", "Total", "Fee"]));
  const hasUnitPrice =
    Boolean(getFieldValue(fields, ["Unit price", "Rate"])) ||
    hasFieldMatching(fields, /(unit price|rate|price|amount|total)$/i);
  if (!hasTotal && !hasUnitPrice) {
    missing.push("Prices or quotation total");
  }

  if (
    hasUnitPrice &&
    !hasTotal &&
    !getFieldValue(fields, ["Quantity", "Qty"]) &&
    !hasFieldMatching(fields, /(quantity|qty)$/i)
  ) {
    missing.push("Quantities");
  }

  if (!getFieldValue(fields, ["Quotation validity", "Validity", "Valid for"])) {
    missing.push("Quotation validity");
  }

  if (!getFieldValue(fields, ["Payment terms", "Payment term"])) {
    missing.push("Payment terms");
  }

  if (!getFieldValue(fields, ["VAT status", "VAT"])) {
    missing.push("VAT status (registered/not registered and inclusive/exclusive)");
  }

  return missing;
}

export function buildMissingInformationQuestion(
  documentType: string,
  missing: string[],
): string {
  const heading = documentType.toLowerCase().includes("quotation")
    ? "quotation"
    : "document";

  return [
    `I can prepare the professional ${heading}, but I need the required information before generating it.`,
    "",
    "Please provide:",
    ...missing.map((item, index) => `${index + 1}. ${item}`),
    "",
    "You can reply using this format:",
    "Issuing company: Your company name",
    "Client name: Client or business name",
    "Client address: Full address",
    "Scope of work: Work or materials being quoted",
    "Quantity: 1",
    "Unit price: enter the agreed rate",
    "Amount: enter the agreed total or budget",
    "Payment terms: e.g. 50% deposit, balance on completion",
    "Quotation validity: e.g. 14 days",
    "VAT status: Not VAT registered / VAT inclusive / VAT exclusive",
    "",
    "For several items, list each item with its quantity and price. NexDocs will not create the quotation until the essential information is complete.",
  ].join("\n");
}

function parseCurrencyAmount(value: string): number | null {
  const match = value.match(/[-+]?\d[\d,]*(?:\.\d{1,2})?/);

  if (!match) {
    return null;
  }

  return Number(match[0].replace(/,/g, ""));
}

function formatCurrencyAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const [whole, fraction] = rounded.toFixed(2).split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return fraction && fraction !== "00"
    ? `R${withCommas}.${fraction}`
    : `R${withCommas}`;
}

function generateDocumentNumber(serverDate: Date): string {
  const stamp = serverDate.toISOString().slice(0, 10).replace(/-/g, "");
  return `QUO-${stamp}-001`;
}

function calculatePaymentSchedule(total: number, paymentTerms: string) {
  const depositPercentMatch = paymentTerms.match(/(\d+)\s*%/i);

  if (depositPercentMatch) {
    const percent = Number(depositPercentMatch[1]);
    const deposit = (total * percent) / 100;
    return {
      deposit,
      balance: total - deposit,
    };
  }

  return {
    deposit: total,
    balance: 0,
  };
}

function getDocumentHeading(input: GenerateInput): string {
  const docType = input.documentType.toLowerCase();

  if (docType.includes("invoice")) {
    return "INVOICE";
  }

  if (docType.includes("quotation")) {
    return "QUOTATION";
  }

  return input.documentType.trim().toUpperCase() || "DOCUMENT";
}

function getDocumentNumberLabel(input: GenerateInput): string {
  const docType = input.documentType.toLowerCase();

  if (docType.includes("invoice")) {
    return "Invoice Number";
  }

  if (docType.includes("quotation")) {
    return "Quotation Number";
  }

  return "Document Number";
}

function getValidityLabel(input: GenerateInput): string {
  const docType = input.documentType.toLowerCase();

  if (docType.includes("quotation")) {
    return "Quotation validity";
  }

  if (docType.includes("invoice")) {
    return "Payment terms";
  }

  return "Validity";
}

export function buildSafeDocumentContent(input: GenerateInput, serverDate: Date): string {
  const fields = cleanFields(input.fields);
  const value = (labels: string[]) => getFieldValue(fields, labels);
  const clientName = value(["Client name", "Client", "Customer name", "Customer"]) ?? "[Client name required]";
  const clientContact = value(["Client contact", "Client contact person"]);
  const clientEmail = value(["Client email", "Client email address"]);
  const clientPhone = value(["Client phone", "Client telephone"]);
  const clientAddress = value(["Client address", "Client physical address"]);
  const issuerContact = value(["Issuer contact", "Contact person"]);
  const issuerEmail = value(["Issuer email", "Business email"]);
  const issuerPhone = value(["Issuer phone", "Business phone"]);
  const issuerAddress = value(["Issuer address", "Business address"]);
  const documentDate = value(["Document date", "Date"]) ?? serverDate.toISOString().slice(0, 10);
  const projectDate = value(["Project or service date", "Service date", "Project date"]);
  const projectTime = value(["Project or service time", "Service time", "Project time"]);
  const subject = value(["Subject", "Document title", "Title"]);
  const scope = value(["Scope of work", "Service", "Work", "Job"]);
  const lineItems = value(["Line items", "Items", "Line-item descriptions"]);
  const amountValue = value(["Amount or budget", "Amount", "Price", "Cost", "Total", "Fee"]) ?? "[Amount required]";
  const vatTreatment = value(["VAT status", "VAT treatment"]) ?? "Not specified";
  const paymentTerms = value(["Payment terms", "Payment term"]);
  const validity = value(["Quotation validity", "Validity", "Valid for"]);
  const amountNumber = parseCurrencyAmount(amountValue);
  const documentNumber = generateDocumentNumber(serverDate);
  const issuerName = input.company.trim() || "[Issuing company details required]";
  const documentHeading = getDocumentHeading(input);
  const numberLabel = getDocumentNumberLabel(input);
  const validityLabel = getValidityLabel(input);
  const lines = [
    documentHeading,
    "",
    `${numberLabel}: ${documentNumber}`,
    `Date: ${documentDate}`,
    "",
    "Prepared by",
    issuerName,
    issuerContact && `Contact: ${issuerContact}`,
    issuerEmail && `Email: ${issuerEmail}`,
    issuerPhone && `Phone: ${issuerPhone}`,
    issuerAddress && `Address: ${issuerAddress}`,
    "",
    "Prepared for",
    clientName,
    clientContact && `Contact: ${clientContact}`,
    clientEmail && `Email: ${clientEmail}`,
    clientPhone && `Phone: ${clientPhone}`,
    clientAddress && `Address: ${clientAddress}`,
    "",
    subject && `Subject: ${subject}`,
    ...(scope ? [`Scope of work: ${scope}`] : []),
    projectDate && `Project or service date: ${projectDate}`,
    projectTime && `Time: ${projectTime}`,
    lineItems && `Line items: ${lineItems}`,
    amountNumber !== null ? `Total, rate or budget: ${formatCurrencyAmount(amountNumber)}` : `Total, rate or budget: ${amountValue}`,
    `VAT treatment: ${vatTreatment}.`,
    paymentTerms && `Payment terms: ${paymentTerms}`,
    validity && `${validityLabel}: ${validity}`,
    "",
    "This document is generated from information supplied by the user and should be reviewed before use.",
  ].filter((line): line is string => Boolean(line));
  return cleanGeneratedDocument(lines.join("\n"));
}
export function validateSafeDocumentContent(
  content: string,
  input: GenerateInput,
  serverDate: Date,
): string[] {
  const violations: string[] = [];
  const fields = cleanFields(input.fields);
  const documentNumber = generateDocumentNumber(serverDate);
  const numberLabel = getDocumentNumberLabel(input);
  const expectedDate = getFieldValue(fields, ["Document date", "Date"]) ?? serverDate.toISOString().slice(0, 10);
  const expectedVat = getFieldValue(fields, ["VAT status", "VAT treatment"]) ?? "Not specified";
  const clientName = getFieldValue(fields, ["Client name", "Client", "Customer name", "Customer"]);
  const issuerName = input.company.trim();
  if (!content.includes(`${numberLabel}: ${documentNumber}`)) violations.push("Document number was not generated in application code.");
  if (!content.includes(`Date: ${expectedDate}`)) violations.push("Date does not match the supplied document date.");
  if (!content.includes(`VAT treatment: ${expectedVat}.`)) violations.push("VAT treatment does not match the supplied choice.");
  if (clientName && !content.includes(clientName)) violations.push("Client details do not match the supplied input.");
  if (issuerName && !content.includes(issuerName)) violations.push("Issuing company details are missing or invalid.");
  if (/\b(CIDB|NHBRC|CIPC|B-BBEE|legally compliant|building regulations|industry standards|registered with|registration number|vat number|banking details|signature)\b/i.test(content)) violations.push("Invented compliance or company detail detected.");
  if (/^#{1,6}\s|\*\*|\*\*\*|\*[^*]|`|^>\s|^\s*\|/m.test(content)) violations.push("Raw Markdown formatting was detected.");
  return violations;
}
export function applySafeDocumentPipeline(
  input: GenerateInput,
  serverDate: Date,
  draftContent?: string,
): { content: string; issues: string[]; usedFallback: boolean } {
  const deterministicContent = buildSafeDocumentContent(input, serverDate);
  const cleanedDraft = draftContent ? cleanGeneratedDocument(draftContent) : "";
  const candidateContent = cleanedDraft || deterministicContent;
  const cleanedCandidate = cleanGeneratedDocument(candidateContent);
  const issues = validateSafeDocumentContent(cleanedCandidate, input, serverDate);

  if (issues.length === 0) {
    return {
      content: cleanedCandidate,
      issues: [],
      usedFallback: false,
    };
  }

  return {
    content: deterministicContent,
    issues,
    usedFallback: true,
  };
}

export function buildPrompt(input: GenerateInput): string {
  const fields = cleanFields(input.fields);

  const fieldLines =
    Object.keys(fields).length > 0
      ? Object.entries(fields)
          .map(([key, value]) => `- "${key}" = "${value}"`)
          .join("\n")
      : "- No additional document fields were provided.";

  const serverDateText = new Date().toISOString().slice(0, 10);

  return `
You are NexDocs, a professional South African business-document drafting assistant.

Create a professional ${input.documentType} for ${input.company} using only the information explicitly supplied below.

STRICT DOCUMENT-SAFETY RULES

1. Use only information explicitly supplied by the user or retrieved from an authenticated company profile.
2. Never invent document numbers, dates, company names, addresses, registration numbers, VAT numbers or VAT registration status, contact details, compliance claims, CIDB, NHBRC, CIPC or B-BBEE status, legal approvals, project dates, signatures or banking details.
3. Generate the document number in application code, not in the AI response.
4. Use the supplied Document date exactly when it exists. When it is missing, use the current server date ${serverDateText}.
5. Preserve the exact user-entered amount and do not invent VAT totals.
6. Do not add or calculate VAT unless the user explicitly states VAT inclusive, VAT exclusive, VAT registered or a VAT rate.
7. When VAT treatment is missing, write exactly: VAT treatment: Not specified.
8. Calculate deposit and balance deterministically in application code.
9. Keep the prepared-for and prepared-by fields separate. Prepared for = client. Prepared by = authenticated company profile. If the issuer profile is unavailable, use [Issuing company details required].
10. Never state that the issuer complies with legislation, CIDB, NHBRC, building regulations or industry standards unless that information exists in verified company data.
11. Do not claim that a quotation is legally compliant. Use this exact disclaimer: This document is generated from information supplied by the user and should be reviewed before use.
12. Quotation validity must use the exact period entered by the user. Only calculate an expiry date when a verified issue date is supplied.
13. Missing information must remain clearly marked rather than fabricated: [Not provided], [To be completed], [Issuing company details required].
14. Do not return raw Markdown formatting. Use plain professional text only.
15. Do not include headings such as #, ## or ###, bold markers, italic markers, separators such as *** or --- or blockquote markers, inline backticks, Markdown tables or Markdown table separator rows.
16. If the content contains unsupported years or dates, invented VAT calculations, invented registration details, placeholder company details presented as facts, payment amounts that do not reconcile to the total, or unsupported legal or compliance claims, regenerate it.

DOCUMENT INFORMATION

Company:
"${input.company}"

Document type:
"${input.documentType}"

Supplied fields:
${fieldLines}
`.trim();
}

export const generateDocument = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => GenerateInputSchema.parse(data))
  .handler(async ({ data }) => {
    const serverDate = new Date();
    const normalisedInput = {
      ...data,
      company: data.company.trim(),
      documentType: data.documentType.trim(),
      fields: cleanFields(data.fields),
    };
    const missingInformation = getMissingDocumentInformation(normalisedInput);
    if (missingInformation.length > 0) {
      return {
        ok: false as const,
        error: `Please complete the document before generating it: ${missingInformation.join("; ")}.`,
      };
    }

    const fallback = applySafeDocumentPipeline(normalisedInput, serverDate);
    try {
      const response = await fetch(`${WORKER_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(normalisedInput),
          documentType: normalisedInput.documentType,
          companyName: normalisedInput.company,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        console.error("NexDocs worker request failed", { status: response.status });
        return { ok: true as const, content: fallback.content };
      }

      const json = (await response.json()) as WorkerResponse;
      const safeResult = applySafeDocumentPipeline(
        normalisedInput,
        serverDate,
        json.content ?? json.markdown,
      );
      return { ok: true as const, content: safeResult.content };
    } catch (error) {
      console.error("NexDocs document generation fallback", error);
      return { ok: true as const, content: fallback.content };
    }
  });
