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

const ISSUER_PLACEHOLDER = "[Issuing company details required]";

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

export function buildSafeDocumentContent(input: GenerateInput, serverDate: Date): string {
  const fields = cleanFields(input.fields);
  const clientName =
    getFieldValue(fields, ["Client name", "Client", "Customer name", "Customer"]) ??
    "[Client name required]";
  const service =
    getFieldValue(fields, ["Service", "Work", "Job"]) ?? "[Service required]";
  const amountValue =
    getFieldValue(fields, ["Amount", "Price", "Cost", "Total", "Fee"]) ??
    "[Amount required]";
  const paymentTerms =
    getFieldValue(fields, ["Payment terms", "Payment term"]) ??
    "[Payment terms required]";
  const validity =
    getFieldValue(fields, ["Quotation validity", "Validity", "Valid for"]) ??
    "[Quotation validity required]";

  const amountNumber = parseCurrencyAmount(amountValue) ?? 0;
  const { deposit, balance } = calculatePaymentSchedule(amountNumber, paymentTerms);
  const documentNumber = generateDocumentNumber(serverDate);
  const serverDateText = serverDate.toISOString().slice(0, 10);
  const issuerName = ISSUER_PLACEHOLDER;

  const lines = [
    "QUOTATION",
    "",
    `Quotation Number: ${documentNumber}`,
    `Date: ${serverDateText}`,
    `Prepared for: ${clientName}`,
    `Prepared by: ${issuerName}`,
    `Service: ${service}`,
    `Total: ${formatCurrencyAmount(amountNumber)}`,
    `Deposit: ${formatCurrencyAmount(deposit)}`,
    `Balance: ${formatCurrencyAmount(balance)}`,
    "VAT treatment: Not specified.",
    `Quotation validity: ${validity}`,
    "This document is generated from information supplied by the user and should be reviewed before use.",
  ];

  return lines.join("\n");
}

export function validateSafeDocumentContent(
  content: string,
  input: GenerateInput,
  serverDate: Date,
): string[] {
  const violations: string[] = [];
  const serverDateText = serverDate.toISOString().slice(0, 10);
  const documentNumber = generateDocumentNumber(serverDate);

  const years = [...content.matchAll(/\b(19|20)\d{2}\b/g)].map((match) => match[0]);
  for (const year of years) {
    if (year !== String(serverDate.getFullYear())) {
      violations.push(`Unsupported year: ${year}`);
    }
  }

  if (!content.includes(`Quotation Number: ${documentNumber}`)) {
    violations.push("Document number was not generated in application code.");
  }

  if (!content.includes(`Date: ${serverDateText}`)) {
    violations.push("Date does not match the server date.");
  }

  if (!content.includes("VAT treatment: Not specified.")) {
    violations.push("VAT treatment is not set to Not specified.");
  }

  if (content.includes("VAT total") || content.includes("VAT amount")) {
    violations.push("Invented VAT calculation detected.");
  }

  if (/\b(CIDB|NHBRC|CIPC|B-BBEE|legally compliant|building regulations|industry standards|registered with|registration number|vat number|banking details|signature)\b/i.test(content)) {
    violations.push("Invented compliance or company detail detected.");
  }

  if (/^#{1,6}\s|\*\*|\*\*\*|\*[^*]|`|^>\s|^\s*\|/m.test(content)) {
    violations.push("Raw Markdown formatting was detected.");
  }

  const amountMatch = content.match(/Total:\s*([Rr]?\d[\d,]*(?:\.\d{1,2})?)/i);
  const depositMatch = content.match(/Deposit:\s*([Rr]?\d[\d,]*(?:\.\d{1,2})?)/i);
  const balanceMatch = content.match(/Balance:\s*([Rr]?\d[\d,]*(?:\.\d{1,2})?)/i);

  if (amountMatch && depositMatch && balanceMatch) {
    const total = parseCurrencyAmount(amountMatch[1]) ?? 0;
    const deposit = parseCurrencyAmount(depositMatch[1]) ?? 0;
    const balance = parseCurrencyAmount(balanceMatch[1]) ?? 0;

    if (Math.abs((deposit + balance) - total) > 0.01) {
      violations.push("Payment amounts do not reconcile to the total.");
    }
  }

  const clientName = getFieldValue(cleanFields(input.fields), ["Client name", "Client", "Customer name", "Customer"]);
  if (clientName && !content.includes(`Prepared for: ${clientName}`)) {
    violations.push("Prepared for value does not match the client input.");
  }

  const issuerName = ISSUER_PLACEHOLDER;
  if (!content.includes(`Prepared by: ${issuerName}`)) {
    violations.push("Prepared by value is missing or invalid.");
  }

  return violations;
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
4. The current server date is ${serverDateText}. Use that exact date and do not rely on your internal knowledge of the date.
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
  .validator(GenerateInputSchema)
  .handler(async ({ data }) => {
    try {
      const cleanedFields = cleanFields(data.fields);
      const payload = {
        prompt: buildPrompt({
          ...data,
          company: data.company.trim(),
          documentType: data.documentType.trim(),
          fields: cleanedFields,
        }),
        company: data.company.trim(),
        documentType: data.documentType.trim(),
        fields: cleanedFields,
      };

      const serverDate = new Date();
      const content = buildSafeDocumentContent(
        {
          ...data,
          company: data.company.trim(),
          documentType: data.documentType.trim(),
          fields: cleanedFields,
        },
        serverDate,
      );

      const validationIssues = validateSafeDocumentContent(
        content,
        {
          ...data,
          company: data.company.trim(),
          documentType: data.documentType.trim(),
          fields: cleanedFields,
        },
        serverDate,
      );

      if (validationIssues.length > 0) {
        return {
          ok: false as const,
          error: `Document generation failed safety validation: ${validationIssues.join("; ")}`,
        };
      }

      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error("NexDocs worker request failed", {
          status: response.status,
          response: responseText.slice(0, 500),
        });
      }

      return {
        ok: true as const,
        content,
      };
    } catch (error) {
      console.error("NexDocs document generation error", error);

      if (
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        return {
          ok: false as const,
          error: "Document generation timed out. Please try again.",
        };
      }

      return {
        ok: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate the document.",
      };
    }
  });
