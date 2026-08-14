import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import {
  businessMemoryHint,
  loadBusinessMemory,
  type BusinessMemory,
} from "@/lib/nexdocs-data";
import {
  chatWithAssistant,
  type ChatMessage,
} from "@/lib/assistant.functions";
import { cleanGeneratedDocument } from "@/lib/generate-doc.functions";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "NexDocs AI assistant" },
      {
        name: "description",
        content:
          "Ask NexDocs for concise South African business guidance or start a guided document brief.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Assistant,
});

type UiMessage = ChatMessage & {
  guidedBrief?: boolean;
};

const QUICK_ACTIONS = [
  {
    icon: "✦",
    title: "Guided document brief",
    description: "Create an editable quotation, invoice, agreement or policy.",
    document: true,
  },
  {
    icon: "◌",
    title: "Business guidance",
    description: "Ask a practical question about your next business step.",
    prompt: "Give me concise practical guidance for a South African small business.",
  },
  {
    icon: "✓",
    title: "HR & compliance",
    description: "Get plain-language direction before drafting a document.",
    prompt: "Give me concise South African HR and compliance guidance. Ask one essential question first if needed.",
  },
];

function Assistant() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(chatWithAssistant);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [memory, setMemory] = useState<BusinessMemory>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void loadBusinessMemory(user.uid)
      .then(setMemory)
      .catch((memoryError) => console.error("Could not load memory", memoryError));
  }, [user]);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const workspaceLabel = useMemo(() => {
    if (profile?.isCossaWorkspace) return "Cossa Nexus private workspace";
    return "Your private NexDocs workspace";
  }, [profile?.isCossaWorkspace]);

  if (loading || !user || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        Loading the AI assistant…
      </div>
    );
  }

  const submit = async (raw: string) => {
    const content = raw.trim();
    if (!content || busy) return;

    const nextMessages: UiMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const result = await send({
        data: {
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
          businessHint: businessMemoryHint(memory),
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const guidedBrief =
        "guidedBrief" in result && Boolean(result.guidedBrief);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          guidedBrief,
          content: guidedBrief
            ? "A guided brief will produce a cleaner, editable document. It collects the issuing company, client, dates, scope, line items and terms in the right places."
            : cleanGeneratedDocument(result.content),
        },
      ]);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "The assistant could not respond. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-gold/30 bg-card/70 shadow-2xl shadow-black/25">
        <div className="border-b border-border/60 bg-gradient-to-r from-charcoal via-card to-charcoal px-5 py-6 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                NexDocs AI
              </div>
              <h1 className="mt-2 font-display text-3xl text-foreground">
                Clear advice. Clean document drafts.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Ask for concise South African business guidance, or use the guided brief for documents that need names, companies, dates, prices and signatures.
              </p>
            </div>
            <div className="rounded-full border border-gold/30 bg-black/20 px-3 py-1.5 text-xs font-semibold text-gold">
              {workspaceLabel}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border/60 bg-background/20 p-4 sm:grid-cols-3 sm:p-5">
          {QUICK_ACTIONS.map((action) =>
            action.document ? (
              <Link
                key={action.title}
                to="/dashboard"
                className="rounded-2xl border border-gold/40 bg-gold/10 p-4 transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold/15"
              >
                <div className="text-xl text-gold">{action.icon}</div>
                <div className="mt-2 font-display text-lg text-foreground">{action.title}</div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{action.description}</p>
                <span className="mt-3 inline-block text-xs font-bold text-gold">Open brief →</span>
              </Link>
            ) : (
              <button
                type="button"
                key={action.title}
                onClick={() => action.prompt && void submit(action.prompt)}
                className="rounded-2xl border border-border/70 bg-card/50 p-4 text-left transition hover:-translate-y-0.5 hover:border-gold/60"
              >
                <div className="text-xl text-gold">{action.icon}</div>
                <div className="mt-2 font-display text-lg text-foreground">{action.title}</div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{action.description}</p>
                <span className="mt-3 inline-block text-xs font-bold text-gold">Ask NexDocs →</span>
              </button>
            ),
          )}
        </div>

        <div
          ref={scroller}
          className="min-h-[24rem] max-h-[34rem] space-y-4 overflow-y-auto p-5 sm:p-8"
        >
          {messages.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center">
              <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">
                Start a conversation
              </div>
              <h2 className="mt-5 font-display text-2xl text-foreground">
                What would you like help with?
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                For documents, choose the guided brief above. For questions, type naturally and NexDocs will keep the response focused and practical.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gold-gradient px-4 py-3 text-sm font-medium text-primary-foreground"
                      : "max-w-[92%] rounded-2xl rounded-bl-sm border border-border/60 bg-background/50 px-4 py-4 text-sm leading-6 text-foreground"
                  }
                >
                  {message.guidedBrief ? (
                    <>
                      <div className="font-display text-lg text-foreground">
                        Let’s build it properly.
                      </div>
                      <p className="mt-2 text-muted-foreground">{message.content}</p>
                      <Link
                        to="/dashboard"
                        className="mt-4 inline-flex rounded-lg bg-gold-gradient px-4 py-2 text-sm font-bold text-primary-foreground"
                      >
                        Complete guided brief
                      </Link>
                    </>
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                </div>
              </div>
            ))
          )}

          {busy ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
              NexDocs is preparing a focused response…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(input);
          }}
          className="border-t border-border/60 bg-background/20 p-3 sm:p-4"
        >
          <div className="flex items-end gap-3 rounded-2xl border border-border bg-card/80 p-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit(input);
                }
              }}
              rows={2}
              disabled={busy}
              placeholder="Ask a business question…"
              className="min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
