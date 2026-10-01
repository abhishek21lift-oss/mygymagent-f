import { BrandLogo } from "@/components/shared/brand-logo";
import type { ReactNode } from "react";
import Link from "next/link";

import { PRODUCT_NAME } from "@/lib/brand";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

/**
 * A business detail from `LEGAL`, or a visible marker when it is not set.
 * The marker is deliberate: a blank would read as a typo, and a guessed
 * value would be a false statement in a legal document.
 */
export function Fact({ value, label }: { value: string | null; label: string }) {
  if (value) return <>{value}</>;
  return (
    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-900 dark:text-amber-200">
      [{label} — to be published]
    </span>
  );
}

export function EmailFact({ value, label }: { value: string | null; label: string }) {
  if (!value) return <Fact value={null} label={label} />;
  return (
    <a href={`mailto:${value}`} className="font-medium text-primary underline-offset-4 hover:underline">
      {value}
    </a>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

/** The frame every public policy page shares: mark, title, body, footer. */
export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <div className="page-ambient min-h-svh">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandLogo decorative className="h-8" />
          <span className="text-sm font-semibold tracking-tight text-foreground">{PRODUCT_NAME}</span>
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm ring-1 ring-border/60 transition hover:bg-muted"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        <article className="rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] sm:p-10">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[34px]">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective <Fact value={LEGAL.effectiveDate} label="effective date" />
          </p>
          <p className="mt-5 text-[15px] leading-7 text-muted-foreground">{summary}</p>
          <div className="mt-8 space-y-8">{children}</div>
        </article>
        <LegalFooter />
      </main>
    </div>
  );
}

export function LegalFooter({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={className ?? "mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"}>
      {LEGAL_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-foreground hover:underline underline-offset-4">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
