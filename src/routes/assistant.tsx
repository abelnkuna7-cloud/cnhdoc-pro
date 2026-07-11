import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import jsPDF from "jspdf";
import { useAuth, hasActiveAccess } from "@/lib/auth-context";
import { chatWithAssistant, type ChatMessage } from "@/lib/assistant.functions";
import {
  type Conversation,
  type BusinessMemory,
  loadConversations,
  saveConversations,
  loadBusinessMemory,
  saveBusinessMemory,
  newConversation,
  titleFromPrompt,
  businessMemoryToSystemHint,
} from "@/lib/assistant-storage";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "NexDocs AI Business Assistant" },
      {
        name: "description",
        content:
          "The NexDocs AI Business Assistant — draft contracts, quotes, HR letters, POPIA policies, tender docs and get expert South African business advice.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "NexDocs AI Business Assistant" },
      {
        property: "og:description",
        content: "South Africa's AI Business Assistant — documents, advice, compliance.",
      },
    ],
  }),
  component: Assistant,
});

type QuickAction = { icon: string; label: string; prompt: string };

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "📄", label: "Generate Contract", prompt: "Draft a professional South African employment contract. Ask me for the key details you need first." },
  { icon: "📑", label: "Create Quotation", prompt: "Create a professional quotation for a South African client. Ask me for client, scope and amounts." },
  { icon: "🧾", label: "Create Invoice", prompt: "Create a South African tax invoice (with 15% VAT). Ask me for the client, items and amounts." },
  { icon: "👥", label: "HR Documents", prompt: "Help me with a South African HR document (BCEA / LRA compliant). Ask which one I need." },
  { icon: "🛡", label: "Compliance", prompt: "Help me with a South African compliance document (POPIA, PAIA, BBBEE, OHSA). Ask which one I need." },
  { icon: "🏗", label: "Construction Documents", prompt: "Help me with a South African construction document (method statement, risk assessment, safety file, CIDB tender). Ask which one." },
  { icon: "🧹", label: "Cleaning Documents", prompt: "Draft a cleaning services document (contract, SLA, schedule, incident report). Ask which one I need." },
  { icon: "🚚", label: "Logistics Documents", prompt: "Draft a logistics / transport document (delivery agreement, POD, freight quote). Ask which one I need." },
  { icon: "📋", label: "Tender Documents", prompt: "Help me prepare a South African tender submission (cover letter, company profile, CIDB grading, tax compliance)." },
  { icon: "💼", label: "Business Advice", prompt: "Give me practical South African business advice. Ask me what area (sales, operations, cashflow, growth)." },
  { icon: "📊", label: "Marketing Strategy", prompt: "Build a marketing strategy for my South African business. Ask me about my market, budget and goals." },
  { icon: "📈", label: "Financial Analysis", prompt: "Help me with a financial analysis in ZAR (with VAT where relevant). Ask what I want analysed." },
];

function suggestFollowUps(lastAssistant: string, lastUser: string): string[] {
  const text = `${lastUser} ${lastAssistant}`.toLowerCase();
  const s = new Set<string>();
  if (/contract|agreement|employment|nda|sla/.test(text)) {
    s.add("Convert to Quotation"); s.add("Save as Template"); s.add("Email to Client");
  }
  if (/quotation|quote|proposal/.test(text)) {
    s.add("Convert to Invoice"); s.add("Convert to Contract"); s.add("Save as Template");
  }
  if (/invoice/.test(text)) { s.add("Send to Client"); s.add("Add VAT breakdown"); s.add("Convert to Statement"); }
  if (/construction|safety|method statement|risk/.test(text)) {
    s.add("Generate Risk Assessment"); s.add("Create Method Statement"); s.add("Generate Safety File Index");
  }
  if (/popia|compliance|privacy/.test(text)) { s.add("Draft PAIA Manual"); s.add("Add Data Breach Procedure"); }
  if (/marketing|strategy|sales/.test(text)) { s.add("Build a 30-day plan"); s.add("Draft launch email"); }
  if (s.size === 0) { s.add("Improve writing"); s.add("Make it more formal"); s.add("Translate to isiZulu"); }
  return Array.from(s).slice(0, 4);
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
      {content}
    </pre>
  );
}

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.txt`; a.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(name: string, content: string, company?: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(name.slice(0, 80), margin, margin);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(`${company ?? "NexDocs AI"} • Generated by NexDocs AI`, margin, margin + 16);
  pdf.setTextColor(0);
  pdf.setFontSize(11);
  const text = content.replace(/[#*_`>]+/g, "");
  const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
  let y = margin + 40;
  for (const line of lines) {
    if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
    pdf.text(line, margin, y);
    y += 14;
  }
  pdf.save(`${name.replace(/[^a-z0-9]+/gi, "_")}.pdf`);
}

function BusinessMemoryDrawer({
  open, onClose, memory, onSave,
}: { open: boolean; onClose: () => void; memory: BusinessMemory; onSave: (m: BusinessMemory) => void }) {
  const [m, setM] = useState<BusinessMemory>(memory);
  useEffect(() => setM(memory), [memory, open]);
  if (!open) return null;
  const field = (k: keyof BusinessMemory, label: string, placeholder = "") => (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input
        value={m[k] ?? ""}
        onChange={(e) => setM({ ...m, [k]: e.target.value })}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
      />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto bg-card border-l border-border p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-gold-gradient">Business Memory</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          NexDocs AI reuses this profile automatically when drafting your documents. Stored securely in this browser.
        </p>
        <div className="space-y-3">
          {field("companyName", "Company Name", "Acme (Pty) Ltd")}
          {field("industry", "Industry", "Construction")}
          {field("address", "Address", "Sandton, Johannesburg")}
          {field("registrationNumber", "Registration Number", "2020/123456/07")}
          {field("vatNumber", "VAT Number", "4123456789")}
          {field("employees", "Employees", "12")}
          {field("services", "Services", "Renovations, tenant installations")}
          {field("brandColours", "Brand Colours", "Navy #0A1F44, Gold #D4AF37")}
          {field("email", "Email", "hello@acme.co.za")}
          {field("phone", "Phone", "+27 11 000 0000")}
          {field("website", "Website", "www.acme.co.za")}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => { onSave(m); onClose(); }}
            className="flex-1 rounded-md bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Save profile
          </button>
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2.5 text-sm text-foreground">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Assistant() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(chatWithAssistant);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showMemory, setShowMemory] = useState(false);
  const [memory, setMemory] = useState<BusinessMemory>({});
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // hydrate
  useEffect(() => {
    const list = loadConversations();
    setConversations(list);
    setActiveId(list[0]?.id ?? null);
    setMemory(loadBusinessMemory());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeId, busy, conversations]);

  useEffect(() => { inputRef.current?.focus(); }, [activeId]);

  const active = hasActiveAccess(profile);
  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const persist = (next: Conversation[]) => {
    setConversations(next);
    saveConversations(next);
  };

  const startNew = () => {
    const c = newConversation();
    persist([c, ...conversations]);
    setActiveId(c.id);
    setInput("");
  };

  const upsertConversation = (updated: Conversation) => {
    const exists = conversations.some((c) => c.id === updated.id);
    const next = exists
      ? conversations.map((c) => (c.id === updated.id ? updated : c))
      : [updated, ...conversations];
    // sort: pinned first, then updatedAt desc
    next.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return b.updatedAt - a.updatedAt;
    });
    persist(next);
  };

  const submit = async (text: string, opts?: { regenerate?: boolean }) => {
    const prompt = text.trim();
    if (!prompt && !opts?.regenerate) return;
    if (busy) return;
    if (!active) { navigate({ to: "/subscribe" }); return; }
    setError(null);

    let conv = activeConv;
    if (!conv) {
      conv = newConversation(titleFromPrompt(prompt));
      setActiveId(conv.id);
    }

    let baseMessages: ChatMessage[];
    if (opts?.regenerate) {
      // drop last assistant, resend
      baseMessages = [...conv.messages];
      if (baseMessages.length && baseMessages[baseMessages.length - 1].role === "assistant") {
        baseMessages = baseMessages.slice(0, -1);
      }
    } else {
      baseMessages = [...conv.messages, { role: "user" as const, content: prompt }];
    }

    const updated: Conversation = {
      ...conv,
      title: conv.messages.length === 0 && !opts?.regenerate ? titleFromPrompt(prompt) : conv.title,
      messages: baseMessages,
      updatedAt: Date.now(),
    };
    upsertConversation(updated);
    if (!opts?.regenerate) setInput("");
    setBusy(true);
    try {
      const hint = businessMemoryToSystemHint(memory) || undefined;
      const res = await send({ data: { messages: baseMessages, businessHint: hint } });
      if (!res.ok) {
        setError(res.error);
      } else {
        const withAssistant: Conversation = {
          ...updated,
          messages: [...baseMessages, { role: "assistant", content: res.content }],
          updatedAt: Date.now(),
        };
        upsertConversation(withAssistant);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const deleteConv = (id: string) => {
    const next = conversations.filter((c) => c.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  };

  const renameConv = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (!c) return;
    const name = window.prompt("Rename conversation", c.title);
    if (name && name.trim()) upsertConversation({ ...c, title: name.trim(), updatedAt: Date.now() });
  };

  const togglePin = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (c) upsertConversation({ ...c, pinned: !c.pinned, updatedAt: c.updatedAt });
  };
  const toggleFav = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (c) upsertConversation({ ...c, favourite: !c.favourite, updatedAt: c.updatedAt });
  };

  const exportConv = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (!c) return;
    const lines = c.messages.map((m) => `## ${m.role === "user" ? "You" : "NexDocs AI"}\n\n${m.content}`).join("\n\n---\n\n");
    downloadText(c.title || "conversation", `# ${c.title}\n\n${lines}`);
  };

  const shareConv = async (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (!c) return;
    const text = c.messages.map((m) => `${m.role === "user" ? "You" : "NexDocs AI"}: ${m.content}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      alert("Conversation copied to clipboard.");
    } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [conversations, search]);

  if (loading || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const firstName = profile?.displayName?.split(" ")[0] ?? "there";
  const lastAssistant = activeConv?.messages.filter((m) => m.role === "assistant").slice(-1)[0]?.content ?? "";
  const lastUser = activeConv?.messages.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";
  const followUps = activeConv && activeConv.messages.length > 0 && !busy
    ? suggestFollowUps(lastAssistant, lastUser)
    : [];

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-7xl gap-3 px-2 sm:px-4">
      {/* Sidebar */}
      <aside className={`${showSidebar ? "flex" : "hidden"} md:flex w-72 shrink-0 flex-col border-r border-border/60 py-4 pr-2`}>
        <button
          onClick={startNew}
          className="mb-3 rounded-lg bg-gold-gradient px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          + New chat
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="mb-3 w-full rounded-md bg-input border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 && (
            <div className="text-xs text-muted-foreground px-2 py-6 text-center">No conversations yet.</div>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`group rounded-md border px-2 py-1.5 text-sm transition ${
                c.id === activeId ? "border-gold bg-card" : "border-transparent hover:bg-card/60"
              }`}
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setActiveId(c.id); setShowSidebar(false); }}
                  className="flex-1 text-left truncate text-foreground/90"
                  title={c.title}
                >
                  {c.pinned ? "📌 " : ""}{c.favourite ? "⭐ " : ""}{c.title}
                </button>
                <button onClick={() => togglePin(c.id)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-gold" title="Pin">📌</button>
                <button onClick={() => toggleFav(c.id)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-gold" title="Favourite">⭐</button>
                <button onClick={() => renameConv(c.id)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground" title="Rename">✎</button>
                <button onClick={() => exportConv(c.id)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground" title="Export">⬇</button>
                <button onClick={() => shareConv(c.id)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground" title="Share">↗</button>
                <button onClick={() => deleteConv(c.id)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive" title="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowMemory(true)}
          className="mt-3 rounded-md border border-gold/60 px-3 py-2 text-xs text-gold hover:bg-gold/10"
        >
          🧠 Business Memory
        </button>
      </aside>

      {/* Main */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="md:hidden rounded-md border border-border px-2 py-1 text-sm"
              onClick={() => setShowSidebar((v) => !v)}
              aria-label="Toggle conversations"
            >
              ☰
            </button>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-gold">NexDocs AI Business Assistant</div>
              <h1 className="font-display text-xl sm:text-2xl text-foreground truncate">
                {activeConv?.title ?? "New chat"}
              </h1>
            </div>
          </div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur"
        >
          {(!activeConv || activeConv.messages.length === 0) && (
            <div className="py-4">
              <div className="text-center">
                <h2 className="font-display text-2xl text-gold-gradient">Welcome back, {firstName}.</h2>
                <p className="mt-1 text-sm text-foreground/90">Ask me anything about your business.</p>
                <p className="text-xs text-muted-foreground">What would you like to do today?</p>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => submit(q.prompt)}
                    className="rounded-xl border border-border/60 bg-background/40 px-3 py-3 text-left hover:border-gold/60 hover:bg-card transition"
                  >
                    <div className="text-2xl">{q.icon}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{q.label}</div>
                  </button>
                ))}
              </div>
              {!memory.companyName && (
                <div className="mt-6 rounded-xl border border-gold/40 bg-card/60 p-4 text-sm">
                  <div className="font-semibold text-foreground">Set up your Business Memory</div>
                  <p className="text-muted-foreground text-xs mt-1">
                    Save your company details once and NexDocs AI reuses them in every document you generate.
                  </p>
                  <button
                    onClick={() => setShowMemory(true)}
                    className="mt-3 rounded-md bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Add business details
                  </button>
                </div>
              )}
            </div>
          )}

          {activeConv?.messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gold-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground">
                  {m.content}
                </div>
              ) : (
                <div className="w-full max-w-full rounded-2xl rounded-bl-sm border border-border/50 bg-background/50 px-4 py-3">
                  <AssistantMessage content={m.content} />
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <button onClick={() => navigator.clipboard.writeText(m.content)} className="rounded-md border border-border px-2 py-1 hover:border-gold/60">Copy</button>
                    <button onClick={() => downloadPdf(activeConv?.title || "NexDocs Document", m.content, memory.companyName)} className="rounded-md border border-border px-2 py-1 hover:border-gold/60">Download PDF</button>
                    <button onClick={() => downloadText(activeConv?.title || "NexDocs Document", m.content)} className="rounded-md border border-border px-2 py-1 hover:border-gold/60">Download Text</button>
                    {i === activeConv!.messages.length - 1 && (
                      <>
                        <button onClick={() => submit("", { regenerate: true })} className="rounded-md border border-border px-2 py-1 hover:border-gold/60">Regenerate</button>
                        <button onClick={() => submit("Improve the writing of the previous response — sharper, more professional, keep meaning.")} className="rounded-md border border-border px-2 py-1 hover:border-gold/60">Improve Writing</button>
                        <button onClick={() => submit("Translate the previous response into isiZulu, keeping legal terms accurate.")} className="rounded-md border border-border px-2 py-1 hover:border-gold/60">Translate</button>
                        <button onClick={() => window.print()} className="rounded-md border border-border px-2 py-1 hover:border-gold/60">Print</button>
                      </>
                    )}
                  </div>
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

          {followUps.length > 0 && (
            <div className="pt-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Suggested next steps</div>
              <div className="flex flex-wrap gap-1.5">
                {followUps.map((f) => (
                  <button
                    key={f}
                    onClick={() => submit(f)}
                    className="rounded-full border border-gold/50 px-3 py-1 text-xs text-gold hover:bg-gold/10"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="mt-3 mb-4 flex items-end gap-2 rounded-xl border border-border/60 bg-card/70 p-2 backdrop-blur"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
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
      </section>

      <BusinessMemoryDrawer
        open={showMemory}
        onClose={() => setShowMemory(false)}
        memory={memory}
        onSave={(m) => { setMemory(m); saveBusinessMemory(m); }}
      />
    </div>
  );
}
