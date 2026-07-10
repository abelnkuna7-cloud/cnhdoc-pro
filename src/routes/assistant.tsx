import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, hasActiveAccess } from "@/lib/auth-context";
import { chatWithAssistant, type ChatMessage } from "@/lib/assistant.functions";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — NexDocs AI" },
      {
        name: "description",
        content:
          "Chat with NexDocs AI — South Africa's AI Business Platform. Draft contracts, quotes, HR letters, POPIA policies and get expert business advice in seconds.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "AI Assistant — NexDocs AI" },
      {
        property: "og:description",
        content: "ChatGPT-style AI assistant for South African businesses — documents, advice, compliance.",
      },
    ],
  }),
  component: Assistant,
});

const SUGGESTIONS = [
  "Draft an employment contract for a driver at R8,500/month",
  "Create a quotation for office renovation — R125,000 excl. VAT",
  "Write a first written warning for repeated lateness (BCEA compliant)",
  "Generate a POPIA privacy policy for a small retail store",
  "Draft an NDA between two SA companies",
  "Prepare a CIDB tender cover letter for a Grade 4 CE project",
];

function AssistantMessage({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
      {content}
    </pre>
  );
}

function Assistant() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(chatWithAssistant);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const active = hasActiveAccess(profile);

  const submit = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    if (!active) {
      navigate({ to: "/subscribe" });
      return;
    }
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: prompt }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await send({ data: { messages: next } });
      if (!res.ok) {
        setError(res.error);
        setMessages(next); // keep user message
      } else {
        setMessages([...next, { role: "assistant", content: res.content }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-4xl flex-col px-3 sm:px-4">
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-gold">NexDocs AI</div>
          <h1 className="font-display text-2xl text-foreground">AI Assistant</h1>
        </div>
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Dashboard
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur"
      >
        {messages.length === 0 && (
          <div className="py-6">
            <p className="text-center text-sm text-muted-foreground">
              Ask me to draft a document or give business advice for South Africa.
            </p>
            <div className="mx-auto mt-5 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-sm text-foreground/80 hover:border-gold/60 hover:text-foreground transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {m.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gold-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground">
                {m.content}
              </div>
            ) : (
              <div className="w-full max-w-full rounded-2xl rounded-bl-sm border border-border/50 bg-background/50 px-4 py-3">
                <AssistantMessage content={m.content} />
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
            NexDocs AI is thinking…
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mt-3 mb-4 flex items-end gap-2 rounded-xl border border-border/60 bg-card/70 p-2 backdrop-blur"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          rows={1}
          placeholder={active ? "Message NexDocs AI…  (Shift+Enter for new line)" : "Subscribe to chat with NexDocs AI"}
          disabled={!active || busy}
          className="min-h-[44px] max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim() || !active}
          className="rounded-lg bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
