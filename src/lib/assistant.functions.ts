import { createServerFn } from "@tanstack/react-start";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT =
  "You are NexDocs AI — South Africa's AI Business Platform assistant, built by Cossa Nexus Holdings (Pty) Ltd. " +
  "You help South African business owners generate professional documents (employment contracts, NDAs, quotations, invoices, disciplinary notices, POPIA policies, safety files, tender documents, board resolutions, HR letters, etc.) and give practical business, HR, sales, marketing, financial, legal, compliance and construction advice tailored to South Africa. " +
  "Use ZAR (R) for money, include VAT (15%) where relevant, and reference SA legislation (POPIA, BCEA, LRA, OHSA, CIDB, Companies Act, PAIA) when appropriate. " +
  "Format documents cleanly in Markdown with clear headings, parties, dates, and signature blocks. Be concise, professional, and helpful.";

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[] }) => {
    if (!data || !Array.isArray(data.messages)) throw new Error("messages required");
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "LOVABLE_API_KEY not configured" };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...data.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (res.status === 429) {
        return { ok: false as const, error: "Too many requests. Please wait a moment and try again." };
      }
      if (res.status === 402) {
        return { ok: false as const, error: "AI credits exhausted. Please add credits in workspace billing." };
      }
      if (!res.ok) {
        const text = await res.text();
        return { ok: false as const, error: `AI gateway error ${res.status}: ${text.slice(0, 200)}` };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content ?? "";
      if (!content) return { ok: false as const, error: "Empty response from AI" };
      return { ok: true as const, content };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Network error" };
    }
  });
