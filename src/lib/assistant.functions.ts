import { createServerFn } from "@tanstack/react-start";
import {
  applySafeDocumentPipeline,
  buildMissingInformationQuestion,
  getMissingDocumentInformation,
  parseDocumentFields,
  type GenerateInput,
} from "./generate-doc.functions";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT =
  "You are the NexDocs AI Business Assistant — South Africa's AI Business Platform assistant, built by Cossa Nexus Holdings (Pty) Ltd. You help South African business owners generate professional documents (employment contracts, NDAs, quotations, invoices, disciplinary notices, POPIA policies, safety files, method statements, risk assessments, CIDB tender documents, board resolutions, SLAs, HR letters, cleaning contracts, logistics agreements, etc.) and give practical business, HR, sales, marketing, financial, legal, compliance, construction, cleaning, logistics and facilities advice tailored to South Africa. Use ZAR (R) for money, include VAT (15%) where relevant, and reference SA legislation (POPIA, BCEA, LRA, OHSA, CIDB, Companies Act, PAIA, BBBEE) when appropriate. " +
  "IMPORTANT — DOCUMENT GENERATION RULES: Before generating ANY document, you MUST first greet the user professionally and collect the following information by asking them clearly: 1) Their full name and company name, 2) Their physical address and city, 3) Their contact number and email address, 4) The other party's full name and company name if applicable, 5) Any specific amounts, dates, job titles, or terms relevant to the document. Once you have collected ALL required details, generate a fully structured PDF-ready document in Markdown with: document title, a unique document number, current date, Prepared for and Prepared by blocks filled with REAL client details — never use placeholders like [INSERT NAME], numbered clauses/sections, signature blocks for both parties, and a professional footer with Cossa Nexus Holdings (Pty) Ltd branding. " +
  "For general business advice questions that do not require a document, answer directly and professionally without asking for details first. Reuse the user's business profile automatically when it is provided. Always be professional, warm, and helpful.";

function inferDocumentInput(messages: ChatMessage[], businessHint?: string): GenerateInput | null {
  const userMessages = messages.filter((message) => message.role === "user");
  const combinedText = userMessages.map((message) => message.content).join("\n\n");

  if (!combinedText.trim()) {
    return null;
  }

  const lowerText = combinedText.toLowerCase();
  const documentType = lowerText.includes("invoice")
    ? "Invoice"
    : lowerText.includes("quotation") || lowerText.includes("quote")
      ? "Quotation"
      : lowerText.includes("contract")
        ? "Contract"
        : lowerText.includes("proposal")
          ? "Proposal"
          : lowerText.includes("agreement")
            ? "Agreement"
            : null;

  if (!documentType) {
    return null;
  }

  const { fields } = parseDocumentFields(combinedText);
  const issuerFromFields =
    fields["Issuing company"] ??
    fields["Company name"];
  const issuerFromProfile =
    businessHint?.match(/^Company:\s*(.+)$/im)?.[1]?.trim();
  const company = issuerFromFields?.trim() || issuerFromProfile || "";

  return {
    company,
    documentType,
    fields,
  };
}

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[]; businessHint?: string }) => {
    if (!data || !Array.isArray(data.messages)) throw new Error("messages required");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const inferredInput = inferDocumentInput(data.messages, data.businessHint);
      if (inferredInput) {
        const missing = getMissingDocumentInformation(inferredInput);
        if (missing.length > 0) {
          return {
            ok: true as const,
            content: buildMissingInformationQuestion(inferredInput.documentType, missing),
            documentReady: false as const,
          };
        }
      }

      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(data.businessHint ? [{ role: "system" as const, content: data.businessHint }] : []),
        ...data.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch("https://nexdocs-api.abelnkuna7.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (res.status === 429) return { ok: false as const, error: "Too many requests. Please wait a moment and try again." };
      if (!res.ok) {
        const text = await res.text();
        return { ok: false as const, error: `AI error ${res.status}: ${text.slice(0, 200)}` };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        content?: string;
      };

      const content = json.choices?.[0]?.message?.content ?? json.content ?? "";
      if (!content) return { ok: false as const, error: "Empty response from AI" };

      if (inferredInput) {
        const lastAssistant = [...data.messages].reverse().find((message) => message.role === "assistant")?.content ?? "";
        const safeResult = applySafeDocumentPipeline(inferredInput, new Date(), content || lastAssistant);
        return { ok: true as const, content: safeResult.content, documentReady: true as const };
      }

      return { ok: true as const, content, documentReady: false as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Network error" };
    }
  });
