import type { ReactNode } from "react";
import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo";
import { PRODUCT_NAME } from "@/lib/brand";
import { LEGAL_LINKS } from "@/lib/legal";
import { FEATURE_PAGES } from "@/lib/marketing";

/** The public site's own pages: what the landing page links to. */
export const MARKETING_NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
] as const;

/**
 * The frame for the public pages beyond the landing page: a plain header
 * and footer, server-rendered, no animation. These pages exist to be read
 * and indexed, so they carry no app code.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-ambient min-h-svh">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandLogo decorative className="h-8" />
          <span className="text-sm font-semibold tracking-tight text-foreground">{PRODUCT_NAME}</span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm">
          {MARKETING_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="rounded-full px-3 py-2 font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90">
            Start free trial
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">{children}</main>

      <footer className="border-t border-border/60 px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{PRODUCT_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Gym management software with WhatsApp automation and AI, for gyms and fitness studios across India.
            </p>
          </div>
          <nav aria-label="Features">
            <p className="text-sm font-semibold text-foreground">Features</p>
            <ul className="mt-3 space-y-2 text-sm">
              {FEATURE_PAGES.map((page) => (
                <li key={page.slug}>
                  <Link href={`/features/${page.slug}`} className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
                    {page.metaTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Company">
            <p className="text-sm font-semibold text-foreground">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[...MARKETING_NAV, ...LEGAL_LINKS].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Breadcrumbs as structured data, so results show the page's place. */
export function breadcrumbJsonLd(origin: URL, trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: new URL(item.path, origin).toString(),
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  // `<` escaped so a string in the data can never close the script tag.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** The call to action every public page ends with. */
export function TrialCta({ heading = "See it with your own gym's data" }: { heading?: string }) {
  return (
    <section className="mt-12 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-10">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Start a free trial, import your members, and run a week of your gym on it. No card needed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/register" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          Start free trial
        </Link>
        <Link href="/pricing" className="rounded-full px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-muted">
          See pricing
        </Link>
      </div>
    </section>
  );
}
