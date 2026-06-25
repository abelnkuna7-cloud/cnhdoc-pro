# NexDocs Cloudflare Worker Contract

The NexDocs frontend calls `https://nexdocs-api.cossa.workers.dev/generate`
to produce business documents via Groq. Build the Worker to match this
contract exactly.

## Request

```
POST /generate
Content-Type: application/json
```

Body:

```json
{
  "company": "Cossa Construction & DIY",
  "documentType": "Construction Quotation",
  "fields": {
    "Client name": "Acme Pty Ltd",
    "Project": "Office renovation",
    "Amount": "R 25 000",
    "Date": "25 June 2026"
  }
}
```

`fields` is an arbitrary key/value map of details the user typed.

## Response (success)

```json
{
  "markdown": "## Construction Quotation\n\nTo: Acme Pty Ltd\n..."
}
```

Either `markdown` or `content` is accepted as the document body. Plain text
is fine — light markdown headings/bullets are stripped before PDF rendering.

## Response (error)

Return any non-2xx status with a short text or JSON body. The frontend
surfaces the message to the user.

## Suggested Worker implementation (Groq)

```js
export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const { company, documentType, fields } = await req.json();

    const sys = "You are NexDocs, an assistant that drafts South African business documents. " +
      "Always include parties, date, ZAR amounts, VAT clause where relevant, and SA legal references " +
      "(POPIA, BCEA, LRA) where appropriate. Use clear professional tone.";

    const user = `Company: ${company}\nDocument type: ${documentType}\n\nFields:\n` +
      Object.entries(fields || {}).map(([k, v]) => `- ${k}: ${v}`).join("\n");

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      }),
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const j = await r.json();
    const markdown = j.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ markdown }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
```

Set `GROQ_API_KEY` as a Worker secret. Add a permissive `OPTIONS` handler
if you call the Worker directly from the browser; the frontend currently
calls it server-side so CORS is not required.
