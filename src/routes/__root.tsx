import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { WHATSAPP_NUMBER } from "../lib/firebase";
import { NEXDOCS_LOGO } from "../lib/companies";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 eagle-bg">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-gold-gradient">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4 eagle-bg">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-display text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "NexDocs — AI Business Documents for South Africa" },
      { name: "description", content: "AI-powered business document generator. Contracts, quotes, HR docs, legal letters. Built for South African businesses." },
      { name: "theme-color", content: "#000000" },
      { property: "og:title", content: "NexDocs — AI Business Documents for South Africa" },
      { name: "twitter:title", content: "NexDocs — AI Business Documents for South Africa" },
      { property: "og:description", content: "AI-powered business document generator. Contracts, quotes, HR docs, legal letters. Built for South African businesses." },
      { name: "twitter:description", content: "AI-powered business document generator. Contracts, quotes, HR docs, legal letters. Built for South African businesses." },
      { property: "og:image", content: "https://nexdocs.cossanexusholdings.co.za/logos/nexdocs-logo.png" },
      { name: "twitter:image", content: "https://nexdocs.cossanexusholdings.co.za/logos/nexdocs-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "NexDocs",
          url: "https://nexdocs.cossanexusholdings.co.za/",
          description: "AI-powered business document generator for South African businesses by Cossa Nexus Holdings.",
          parentOrganization: { "@type": "Organization", name: "Cossa Nexus Holdings" },
          areaServed: "ZA",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ContactMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          id="nexdocs-contact-menu"
          className="w-60 rounded-xl border border-gold/40 bg-black/95 p-2 shadow-2xl shadow-black/60 backdrop-blur"
        >
          <Link
            to="/assistant"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-charcoal"
          >
            <span>Ask NexDocs AI</span>
            <span aria-hidden="true" className="text-gold">→</span>
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20NexDocs%2C%20I%20need%20help.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-charcoal"
          >
            <span>WhatsApp us</span>
            <span aria-hidden="true" className="text-[#25D366]">●</span>
          </a>
          <a
            href="tel:+27678011907"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-charcoal"
          >
            <span>Call +27 67 801 1907</span>
            <span aria-hidden="true" className="text-gold">↗</span>
          </a>
          <a
            href="mailto:cossa@cossanexusholdings.co.za?subject=NexDocs%20support"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-charcoal"
          >
            <span>Email NexDocs support</span>
            <span aria-hidden="true" className="text-gold">↗</span>
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-controls="nexdocs-contact-menu"
        className="flex min-h-12 items-center justify-center rounded-full bg-gold-gradient px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/40 transition active:scale-95"
      >
        {open ? "Close" : "Need help?"}
      </button>
    </div>
  );
}

function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label="NexDocs home">
          <img src={NEXDOCS_LOGO} alt="NexDocs" className="h-9 w-9 rounded-md object-cover" />
          <span className="font-display text-lg text-gold-gradient">NexDocs</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-md px-2 py-1.5 text-foreground/80 hover:text-foreground sm:px-3">Dashboard</Link>
              <Link to="/assistant" className="rounded-md px-2 py-1.5 text-gold hover:text-gold-gradient sm:px-3">AI</Link>
              {profile?.isAdmin && (
                <Link to="/admin" className="rounded-md px-2 py-1.5 text-foreground/80 hover:text-foreground sm:px-3">Admin</Link>
              )}
              <button onClick={() => signOut()} className="rounded-md px-2 py-1.5 text-foreground/80 hover:text-foreground sm:px-3">Sign out</button>
            </>
          ) : (
            <Link to="/auth" className="rounded-md bg-gold-gradient px-4 py-2 font-semibold text-primary-foreground">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const col = (title: string, links: { label: string; to?: string; href?: string }[]) => (
    <div>
      <div className="mb-3 font-display text-sm text-gold">{title}</div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map((link) => {
          const isExternal = Boolean(link.href?.startsWith("http"));
          return link.to ? (
            <li key={link.label}>
              <Link to={link.to} className="hover:text-foreground">{link.label}</Link>
            </li>
          ) : (
            <li key={link.label}>
              <a
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <footer className="mt-16 border-t border-border/60 bg-black">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <img src={NEXDOCS_LOGO} alt="NexDocs" className="h-10 w-10 rounded-md object-cover" />
            <div className="font-display text-lg text-gold-gradient">NexDocs</div>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            AI business documents and practical guidance for South African businesses.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">A Cossa Nexus Holdings product.</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <a href="tel:+27678011907" className="text-gold hover:text-gold-soft">+27 67 801 1907</a>
            <a href="mailto:cossa@cossanexusholdings.co.za" className="text-gold hover:text-gold-soft">Email us</a>
          </div>
        </div>
        {col("Product", [
          { label: "Document templates", href: "/#templates" },
          { label: "Pricing", to: "/subscribe" },
          { label: "AI Assistant", to: "/assistant" },
          { label: "Dashboard", to: "/dashboard" },
        ])}
        {col("Support", [
          { label: "Contact Cossa", href: "mailto:cossa@cossanexusholdings.co.za?subject=NexDocs%20enquiry" },
          { label: "WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20NexDocs%2C%20I%20need%20help.` },
          { label: "Call us", href: "tel:+27678011907" },
          { label: "Support email", href: "mailto:cossa@cossanexusholdings.co.za?subject=NexDocs%20support" },
        ])}
        {col("Cossa platforms", [
          { label: "Cossa Nexus Holdings", href: "https://cossanexusholdings.co.za/" },
          { label: "Cossa Growth", href: "https://growth.cossanexusholdings.co.za/" },
          { label: "Cossa Store", href: "https://store.cossanexusholdings.co.za/" },
          { label: "Cossa Nexus Constructions", href: "https://cossanexusholdings.co.za/industries" },
        ])}
        {col("Legal", [
          { label: "Privacy & POPIA", href: "https://cossanexusholdings.co.za/privacy" },
          { label: "Terms & Conditions", href: "https://cossanexusholdings.co.za/terms" },
          { label: "Cookie Policy", href: "https://cossanexusholdings.co.za/cookies" },
          { label: "Company contact", href: "mailto:cossa@cossanexusholdings.co.za" },
        ])}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <div>© {year} NexDocs. All rights reserved.</div>
          <div>Built by <span className="text-gold">Cossa Nexus Holdings (Pty) Ltd</span></div>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen eagle-bg flex flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <ContactMenu />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
