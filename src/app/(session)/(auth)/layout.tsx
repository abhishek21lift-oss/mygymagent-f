import { BrandLogo } from "@/components/shared/brand-logo";
import * as React from "react";

import { LegalFooter } from "../../(legal)/legal-ui";
import { PRODUCT_NAME } from "@/lib/brand";

/**
 * The sign-in canvas — split-screen on desktop, single column on mobile.
 *
 * Desktop: a rich visual panel on the left (55%) carrying the brand, the
 * headline, a dashboard preview and ambient lighting, and a clean pearl
 * auth surface on the right (45%) holding the form. The theme stays light:
 * the panel is a deep brand gradient only because it is the one surface
 * here that is never read as content.
 *
 * Mobile: the visual panel is skipped entirely. A compact gradient hero
 * above the form keeps the brand and the promise present without stealing
 * vertical space from the fields.
 *
 * No authentication behaviour lives here. The children (login, register,
 * forgot-password, reset-password) own all of it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-canvas relative min-h-svh lg:grid lg:grid-cols-[55%_45%]">
      {/* ——— Left visual panel (desktop only) ——— */}
      <aside className="auth-visual-bg relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Ambient lighting: orbs, grid and a soft vignette. Decorative,
            so it is hidden from assistive technology. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--brand-lit-3)] opacity-40 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[var(--brand-lit-2)] opacity-30 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-[var(--brand-lit-1)] opacity-25 blur-3xl" />
          <div className="absolute inset-0 auth-grid" />
        </div>

        <div className="auth-visual-in relative flex flex-col gap-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10" />
            <span className="text-lg font-semibold tracking-tight text-white">
              {PRODUCT_NAME}
            </span>
          </div>

          {/* Headline + supporting copy */}
          <div className="max-w-lg">
            <h1 className="text-4xl leading-[1.08] font-bold tracking-tighter text-white xl:text-[2.75rem]">
              Your Gym. Your People. Your Growth.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              One intelligent workspace to manage your fitness business, empower your
              team and deliver better member experiences.
            </p>
          </div>

          {/* Dashboard preview. Every number on it is illustrative, not
              live — the panel is decoration until you are signed in. The
              preview is hidden from assistive technology for the same
              reason: it repeats the headline rather than adding information. */}
          <div aria-hidden="true" className="pb-4">
            <DashboardPreview />
          </div>
        </div>
      </aside>

      {/* ——— Right auth panel ——— */}
      <div className="relative flex min-h-svh flex-col bg-background">
        {/* Compact colourful hero, mobile only */}
        <div className="px-5 pt-8 pb-2 lg:hidden">
          <div className="auth-form-in rounded-2xl bg-[linear-gradient(135deg,var(--brand-1)_0%,var(--brand-2)_55%,var(--brand-3)_100%)] p-5 text-white shadow-[0_18px_40px_-20px_rgba(79,70,229,0.45)]">
            <h1 className="text-xl leading-tight font-bold tracking-tight">
              Your Gym. Your People. Your Growth.
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">
              One intelligent workspace to manage your fitness business, empower your
              team and deliver better member experiences.
            </p>
          </div>
        </div>

        {/* Desktop brand mark, hidden on mobile (the hero carries it there) */}
        <div className="hidden shrink-0 items-center gap-3 px-8 pt-8 lg:flex xl:px-12">
          <BrandLogo className="h-9" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            {PRODUCT_NAME}
          </span>
        </div>

        {/* The form */}
        <div className="flex flex-1 items-center justify-center px-5 py-8 lg:px-8 lg:py-12 xl:px-12">
          <div className="auth-form-in w-full max-w-md">{children}</div>
        </div>

        {/* Trust line and legal links — real facts only, no invented
            numbers or certifications. */}
        <div className="shrink-0 space-y-2 px-5 pt-2 pb-6 lg:px-8 xl:px-12">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Secure &middot; Role-based access
          </p>
          <LegalFooter className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground" />
        </div>
      </div>
    </main>
  );
}

/**
 * The floating dashboard preview in the visual panel. Illustrative data
 * only — no live figures reach a visitor who is not signed in.
 */
function DashboardPreview() {
  return (
    <div className="relative">
      {/* The panel itself */}
      <div className="auth-float rounded-2xl border border-white/[0.08] bg-white/[0.06] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-5 py-3.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="ml-3 h-5 flex-1 rounded-md bg-white/[0.06]" />
        </div>

        <div className="p-5">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Members", value: "2,847", trend: "+12.5%", up: true },
              { label: "Revenue", value: "₹4.2L", trend: "+8.3%", up: true },
              { label: "Check-ins", value: "1,293", trend: "Today", up: false },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white/[0.05] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">
                  {kpi.label}
                </p>
                <p className="mt-1.5 text-2xl leading-none font-bold tracking-tighter text-white">
                  {kpi.value}
                </p>
                <p
                  className={
                    "mt-1 text-[11px] font-semibold " +
                    (kpi.up ? "text-emerald-300" : "font-medium text-white/35")
                  }
                >
                  {kpi.trend}
                </p>
              </div>
            ))}
          </div>

          {/* Weekly activity bars */}
          <div className="mt-5">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">
              Weekly activity
            </p>
            <div className="flex h-16 items-end gap-1.5">
              {[42, 68, 48, 82, 58, 92, 72].map((height, i) => (
                <div
                  key={i}
                  style={{ height: `${height}%` }}
                  className="flex-1 rounded-t-[4px] bg-gradient-to-t from-[var(--brand-lit-1)] to-[var(--brand-lit-3)] opacity-60"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat card */}
      <div className="auth-float-delayed absolute -top-5 right-0 rounded-xl border border-white/[0.08] bg-white/[0.08] px-4 py-3 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/35">
          Active now
        </p>
        <p className="text-lg leading-none font-bold tracking-tighter text-white">342</p>
      </div>

      {/* Floating activity note */}
      <div className="auth-float-slow absolute -bottom-3 left-0 rounded-xl border border-white/[0.08] bg-white/[0.08] px-4 py-3 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <p className="text-[11px] font-medium text-white/60">New member joined</p>
        </div>
      </div>
    </div>
  );
}
