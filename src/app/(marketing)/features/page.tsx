import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd, MarketingShell, TrialCta, breadcrumbJsonLd } from "@/components/marketing/marketing-shell";
import { FEATURE_PAGES } from "@/lib/marketing";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Features: Gym Management Software for India",
  description:
    "WhatsApp reminders, QR check-in, PT management, billing and a member app: what the gym management software does, feature by feature.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd(siteUrl(), [
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ])}
      />
      <section className="pt-6">
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[44px]">
          Everything a gym runs on, in one app
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Memberships, payments, check-in, training and staff, with WhatsApp doing the reminding. Pick a feature to see how it works.
        </p>
      </section>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {FEATURE_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/features/${page.slug}`}
              className="block h-full rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] transition hover:border-primary/40"
            >
              <h2 className="text-lg font-semibold text-foreground">{page.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{page.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">How it works →</span>
            </Link>
          </li>
        ))}
      </ul>
      <TrialCta />
    </MarketingShell>
  );
}
