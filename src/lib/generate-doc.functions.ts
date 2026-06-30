import { createServerFn } from "@tanstack/react-start";

const WORKER_URL = "https://nexdocs-api.cossa.workers.dev/api/generate";

export type GenerateInput = {
  company: string;
  documentType: string;
  fields: Record<string, string>;
};

export const generateDocument = createServerFn({ method: "POST" })
  .inputValidator((data: GenerateInput) => {
    if (!data || typeof data !== "object") throw new Error("Invalid input");
    if (!data.company || !data.documentType) throw new Error("Missing company or document type");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const fieldLines = Object.entries(data.fields || {})
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");
      const prompt =
        `You are NexDocs, drafting professional South African business documents. ` +
        `Include parties, date, ZAR amounts, VAT clause where relevant, and SA legal references (POPIA, BCEA, LRA) where appropriate.\n\n` +
        `Company: ${data.company}\nDocument type: ${data.documentType}\n\nFields:\n${fieldLines || "(none provided)"}`;

      const payload = {
        prompt,
        company: data.company,
        documentType: data.documentType,
        fields: data.fields ?? {},
      };

      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false as const, error: `Worker error ${res.status}: ${text.slice(0, 200)}` };
      }
      const json = (await res.json()) as { markdown?: string; content?: string };
      const content = json.markdown ?? json.content ?? "";
      if (!content) return { ok: false as const, error: "Empty response from worker" };
      return { ok: true as const, content };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Network error" };
    }
  });
