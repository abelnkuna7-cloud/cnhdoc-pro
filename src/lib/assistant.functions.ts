import { createServerFn } from "@tanstack/react-start";
import {
  applySafeDocumentPipeline,
  getMissingDocumentInformation,
  parseDocumentFields,
  type GenerateInput,
} from "./generate-doc.functions";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const SYSTEM_PROMPT =
  "You are NexDocs AI, a practical South African business assistant. Give concise, professional answers in plain text. Use short sections and short paragraphs when helpful. Never use Markdown markers such as #, ##, **, ***, tables or long filler. For documents that need company names, client details, dates, prices, terms or signatures, tell the user to use the NexDocs guided brief rather than collecting a long reply in chat. Do not invent any company information, registration details, contact details, dates, pricing, VAT status, legal approvals or compliance claims. Use ZAR and South African context only when relevant. Answer a direct advice question clearly; ask no more than one essential follow-up question at a time.";

function inferDocumentInput(
  messages: ChatMessage[],
  businessHint?: string,
): GenerateInput | null {
  const userMessages = messages.filter((message) => message.role === "user");
  const combinedText = userMessages.map((message) => message.content).join("\n\n");

  if (!combinedText.trim()) return null;

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

  if (!documentType) return null;

  const { fields } = parseDocumentFields(combinedText);
  const issuerFromFields = fields["Issuing company"] ?? fields["Company name"];
  const issuerFromProfile = businessHint
    ?.match(/^Company:\s*(.+)$/im)?.[1]
    ?.trim();

  return {
    company: issuerFromFields?.trim() || issuerFromProfile || "",
    documentType,
    fields,
  };
}

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[]; businessHint?: string }) => {
    if (!data || !Array.isArray(data.messages)) {
      throw new Error("messages required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const inferredInput = inferDocumentInput(data.messages, data.businessHint);

      if (
        inferredInput &&
        getMissingDocumentInformation(inferredInput).length > 0
      ) {
        return {
          ok: true as const,
          content: "",
          documentReady: false as const,
          guidedBrief: true as const,
        };
      }

      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(data.businessHint
          ? [{ role: "system" as const, content: data.businessHint }]
          : []),
        ...data.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ];

      const response = await fetch("https://nexdocs-api.abelnkuna7.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (response.status === 429) {
        return {
          ok: false as const,
          error: "Too many requests. Please wait a moment and try again.",
        };
      }

      if (!response.ok) {
        const message = await response.text();
        return {
          ok: false as const,
          error: "AI error " + response.status + ": " + message.slice(0, 200),
        };
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        content?: string;
      };

      const content =
        json.choices?.[0]?.message?.content ??
        json.content ??
        "";

      if (!content) {
        return { ok: false as const, error: "Empty response from AI" };
      }

      if (inferredInput) {
        const safeResult = applySafeDocumentPipeline(
          inferredInput,
          new Date(),
          content,
        );
        return {
          ok: true as const,
          content: safeResult.content,
          documentReady: true as const,
          guidedBrief: false as const,
        };
      }

      return {
        ok: true as const,
        content,
        documentReady: false as const,
        guidedBrief: false as const,
      };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  });
