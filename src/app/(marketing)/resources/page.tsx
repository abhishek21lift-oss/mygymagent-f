import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd, MarketingShell, TrialCta, breadcrumbJsonLd } from "@/components/marketing/marketing-shell";
import { ARTICLES, articleDate } from "@/lib/marketing";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Resources for Gym Owners",
  description:
    "Practical guides for running a gym in India: renewal WhatsApp templates, reducing member churn and pricing personal training.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  const articles = [...ARTICLES].sort((a, b) => (b.updated ?? b.published).localeCompare(a.updated ?? a.published));
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd(siteUrl(), [
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ])}
      />
      <section className="pt-6">
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[44px]">Resources for gym owners</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Practical guides from the gym floor: keeping members, collecting dues and pricing training.
        </p>
      </section>
      <ul className="mt-10 grid gap-4">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/resources/${a.slug}`}
              className="block rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] transition hover:border-primary/40"
            >
              <p className="text-xs text-muted-foreground">
                {articleDate(a.updated ?? a.published)} · {a.readingMinutes} min read
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{a.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <TrialCta />
    </MarketingShell>
  );
}
