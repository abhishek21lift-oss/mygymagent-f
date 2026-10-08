import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { JsonLd, MarketingShell, TrialCta, breadcrumbJsonLd } from "@/components/marketing/marketing-shell";
import { FEATURE_PAGES, featurePage } from "@/lib/marketing";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return FEATURE_PAGES.map((page) => ({ slug: page.slug }));
}

/** Only the pages in FEATURE_PAGES exist; any other slug is a 404. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = featurePage((await params).slug);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: `/features/${page.slug}` },
    openGraph: { title: page.title, description: page.description, url: `/features/${page.slug}` },
  };
}

export default async function FeatureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = featurePage((await params).slug);
  if (!page) notFound();
  const others = FEATURE_PAGES.filter((p) => p.slug !== page.slug);
  return (
    <MarketingShell>
      <JsonLd
        data={[
          breadcrumbJsonLd(siteUrl(), [
            { name: "Home", path: "/" },
            { name: "Features", path: "/features" },
            { name: page.metaTitle, path: `/features/${page.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]}
      />
      <nav aria-label="Breadcrumb" className="pt-4 text-sm text-muted-foreground">
        <Link href="/features" className="hover:text-foreground hover:underline underline-offset-4">Features</Link>
        <span aria-hidden="true"> / </span>
        <span>{page.metaTitle}</span>
      </nav>
      <section className="pt-4">
        <h1 className="max-w-3xl text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[42px]">{page.title}</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-7 text-muted-foreground">{page.lede}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            Start free trial
          </Link>
          <Link href="/pricing" className="rounded-full px-6 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-muted">
            See pricing
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">How it works</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {page.steps.map((step, i) => (
            <li key={step.title} className="rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
              <span className="text-xs font-bold uppercase tracking-wide text-primary">Step {i + 1}</span>
              <h3 className="mt-1 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">What you get</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {page.points.map((point) => (
            <li key={point} className="flex gap-2 text-[15px] text-foreground">
              <Check className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Questions</h2>
        <dl className="mt-5 space-y-6">
          {page.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-foreground">{f.q}</dt>
              <dd className="mt-1.5 text-[15px] leading-7 text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">More features</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map((p) => (
            <li key={p.slug}>
              <Link href={`/features/${p.slug}`} className="inline-block rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border transition hover:bg-muted">
                {p.metaTitle}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <TrialCta />
    </MarketingShell>
  );
}
