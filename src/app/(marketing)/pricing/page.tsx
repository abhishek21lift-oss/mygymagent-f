import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { JsonLd, MarketingShell, TrialCta, breadcrumbJsonLd } from "@/components/marketing/marketing-shell";
import { PRODUCT_NAME } from "@/lib/brand";
import { PLATFORM_PLANS, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing: Gym Management Software Plans in India",
  description: `${PRODUCT_NAME} pricing in rupees: a free trial, then plans from ₹${PLATFORM_PLANS.find((p) => p.pricePerMonth > 0)?.pricePerMonth ?? 999}/month by members, branches and staff. No setup fee, no card for the trial.`,
  alternates: { canonical: "/pricing" },
};

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const PRICING_FAQS = [
  { q: "Is there a setup fee?", a: "No. You pay the monthly plan price and nothing else. Importing your members from a spreadsheet is part of every plan." },
  { q: "Do I need a card for the free trial?", a: "No. Sign up with your gym's details and use every feature with real data. Choose a plan when you're ready." },
  { q: "What happens when I reach a plan's limit?", a: "Everything you already have keeps working. Adding more members, branches or staff than the plan allows asks you to move up a plan first, and the Subscription page shows where you stand." },
  { q: "Are WhatsApp messages extra?", a: "The monthly WhatsApp allowance is included in each plan, and messages go out from your gym's own number." },
  { q: "Can I change plans later?", a: "Yes. Talk to us and we'll move you up or down; your data stays exactly as it is." },
];

export default function PricingPage() {
  const origin = siteUrl();
  return (
    <MarketingShell>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${PRODUCT_NAME} gym management software`,
            description: "Gym management software with WhatsApp automation and AI, for gyms and fitness studios in India.",
            brand: { "@type": "Brand", name: PRODUCT_NAME },
            offers: PLATFORM_PLANS.map((plan) => ({
              "@type": "Offer",
              name: plan.name,
              price: plan.pricePerMonth,
              priceCurrency: "INR",
              url: new URL("/register", origin).toString(),
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: PRICING_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]}
      />
      <section className="pt-6 text-center">
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[44px]">
          Simple pricing for gyms in India
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Start free with your real members. Pay monthly in rupees when you&apos;re ready, by the size of your gym. No setup fee.
        </p>
      </section>

      <section aria-label="Plans" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_PLANS.map((plan) => (
          <article
            key={plan.key}
            className={`flex flex-col rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)] ${plan.highlight ? "border-primary ring-2 ring-primary/30" : "border-border/60"}`}
          >
            <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
            <p className="mt-5">
              <span className="text-3xl font-bold tabular-nums text-foreground">{plan.pricePerMonth ? rupees(plan.pricePerMonth) : "Free"}</span>
              {plan.pricePerMonth ? <span className="text-sm text-muted-foreground"> / month</span> : null}
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-foreground">
              {[
                `Up to ${plan.limits.members.toLocaleString("en-IN")} members`,
                `${plan.limits.branches} branch${plan.limits.branches === 1 ? "" : "es"}`,
                `${plan.limits.staff} staff accounts`,
                `${plan.limits.whatsappMonthly.toLocaleString("en-IN")} WhatsApp messages a month`,
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${plan.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "ring-1 ring-border hover:bg-muted"}`}
            >
              {plan.pricePerMonth ? "Start free, then choose" : "Start free trial"}
            </Link>
          </article>
        ))}
      </section>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Every plan includes every feature: memberships, WhatsApp reminders, QR check-in, PT, payroll, inventory, reports and the AI agent.{" "}
        <Link href="/features" className="font-medium text-primary underline-offset-4 hover:underline">See all features</Link>
      </p>

      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pricing questions</h2>
        <dl className="mt-6 space-y-6">
          {PRICING_FAQS.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-foreground">{f.q}</dt>
              <dd className="mt-1.5 text-[15px] leading-7 text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <TrialCta />
    </MarketingShell>
  );
}
