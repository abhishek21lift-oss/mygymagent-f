import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd, MarketingShell, TrialCta, breadcrumbJsonLd } from "@/components/marketing/marketing-shell";
import { PRODUCT_NAME } from "@/lib/brand";
import { ARTICLES, ARTICLE_AUTHOR, article, articleDate, type ArticleBlock } from "@/lib/marketing";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = article((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/resources/${a.slug}` },
    authors: [{ name: ARTICLE_AUTHOR.name }],
    openGraph: {
      type: "article",
      title: a.title,
      description: a.description,
      url: `/resources/${a.slug}`,
      publishedTime: a.published,
      ...(a.updated ? { modifiedTime: a.updated } : {}),
    },
  };
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="pt-4 text-xl font-semibold tracking-tight text-foreground">{block.text}</h2>;
    case "ul":
      return (
        <ul className="ml-5 list-disc space-y-2">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "template":
      return (
        <figure className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <figcaption className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{block.label}</figcaption>
          <blockquote className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-foreground">{block.text}</blockquote>
        </figure>
      );
    default:
      return <p>{block.text}</p>;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = article((await params).slug);
  if (!a) notFound();
  const origin = siteUrl();
  const url = new URL(`/resources/${a.slug}`, origin).toString();
  return (
    <MarketingShell>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: a.title, path: `/resources/${a.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.description,
            datePublished: a.published,
            dateModified: a.updated ?? a.published,
            author: { "@type": ARTICLE_AUTHOR.name.startsWith("The ") ? "Organization" : "Person", name: ARTICLE_AUTHOR.name },
            publisher: { "@type": "Organization", name: PRODUCT_NAME, "@id": `${origin.toString().replace(/\/$/, "")}/#organization` },
            mainEntityOfPage: url,
            inLanguage: "en-IN",
          },
        ]}
      />
      <nav aria-label="Breadcrumb" className="pt-4 text-sm text-muted-foreground">
        <Link href="/resources" className="hover:text-foreground hover:underline underline-offset-4">Resources</Link>
      </nav>
      <article className="mx-auto mt-4 max-w-3xl rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] sm:p-10">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[36px]">{a.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          By {ARTICLE_AUTHOR.name} · {articleDate(a.updated ?? a.published)} · {a.readingMinutes} min read
        </p>
        <div className="mt-8 space-y-5 text-[16px] leading-8 text-muted-foreground">
          {a.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
        <p className="mt-10 border-t border-border/60 pt-5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{ARTICLE_AUTHOR.name}.</span> {ARTICLE_AUTHOR.bio}
        </p>
      </article>
      <TrialCta heading="Put these reminders on autopilot" />
    </MarketingShell>
  );
}
