import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { CNH_LOGO } from "@/lib/companies";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to NexDocs — AI Business Documents" },
      { name: "description", content: "Sign in or create a NexDocs account to start your 10-day free trial of AI-powered South African business document generation." },
      { property: "og:title", content: "Sign in to NexDocs — AI Business Documents" },
      { property: "og:description", content: "Create an account and start generating SA business documents with AI in seconds." },
      { property: "og:url", content: "https://nexdoc-cossanexusholdings.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://nexdoc-cossanexusholdings.lovable.app/auth" }],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else if (mode === "signup") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signUp(email.trim(), password, displayName.trim());
      } else {
        await resetPassword(email.trim());
        setInfo("Password reset email sent. Check your inbox.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/[^)]+\)\.?/, "").trim() || msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center mb-6">
          <img src={CNH_LOGO} alt="CNH" className="h-16 w-16 rounded-xl object-cover" />
          <h1 className="mt-3 font-display text-2xl text-gold-gradient">Sign in to NexDocs — AI Business Documents</h1>
          <p className="text-xs text-muted-foreground">Cossa Nexus Holdings</p>
        </div>

        <div className="flex rounded-md border border-border/60 p-1 mb-5 text-sm">
          {(["signin", "signup", "forgot"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              className={`flex-1 py-2 rounded font-medium transition ${
                mode === m ? "bg-gold-gradient text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "signin" ? "Sign in" : m === "signup" ? "Register" : "Reset"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              required
              autoComplete="name"
              placeholder="Full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-md bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            />
          )}
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-input border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            />
          )}
          {error && <div className="text-sm text-destructive">{error}</div>}
          {info && <div className="text-sm text-gold">{info}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-gold-gradient py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset email"}
          </button>
        </form>
        {mode === "signup" && (
          <p className="mt-4 text-xs text-muted-foreground text-center">
            10-day free trial. R99/month after. Cancel anytime.
          </p>
        )}
      </div>
    </div>
  );
}
