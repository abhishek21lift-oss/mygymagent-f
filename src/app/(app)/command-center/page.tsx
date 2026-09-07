"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  Check,
  CreditCard,
  Dumbbell,
  Package,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";

function money(value: string | undefined, currency: string) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : `${currency} 0`;
}

function timeAgo(iso: string | undefined) {
  if (!iso) return null;
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 90) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/* Stat band: one card, hairline dividers — not four competing tiles. */
/* ------------------------------------------------------------------ */

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 p-5 lg:p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <p className="text-[11px] font-medium uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="metric-number font-mono text-[28px] leading-none lg:text-3xl">
        {loading ? <span className="text-muted-foreground/40">—</span> : value}
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decision queue rows: mono index, severity tick, quiet hover.       */
/* ------------------------------------------------------------------ */

const severityTick: Record<string, string> = {
  risk: "bg-destructive",
  sales: "bg-info",
  stock: "bg-warning",
  ai: "bg-primary",
};

const severityText: Record<string, string> = {
  risk: "text-destructive",
  sales: "text-info",
  stock: "text-warning",
  ai: "text-primary",
};

function PriorityRow({
  index,
  href,
  icon: Icon,
  title,
  detail,
  action,
  severity,
}: {
  index: number;
  href: string;
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  action: string;
  severity: keyof typeof severityTick;
}) {
  return (
    <Link
      href={href}
      className="group/pri flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground/70">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className={`h-8 w-0.5 shrink-0 rounded-full ${severityTick[severity]}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <Icon className={`size-4 shrink-0 ${severityText[severity]}`} aria-hidden />
          <span className="truncate text-sm font-semibold">{title}</span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover/pri:text-foreground sm:flex">
        {action}
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/pri:translate-x-0.5" />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Quiet empty state.                                                  */
/* ------------------------------------------------------------------ */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Watchlist rows: label left, mono figure right, hairline between.    */
/* ------------------------------------------------------------------ */

function ListRow({
  primary,
  secondary,
  figure,
  figureTone = "default",
}: {
  primary: string;
  secondary?: string;
  figure: string;
  figureTone?: "default" | "warning" | "muted";
}) {
  const tone =
    figureTone === "warning"
      ? "bg-warning/10 text-warning-foreground"
      : figureTone === "muted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/[0.06] text-foreground";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{primary}</p>
        {secondary && <p className="mt-0.5 text-xs text-muted-foreground">{secondary}</p>}
      </div>
      <span className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-sm tabular-nums ${tone}`}>
        {figure}
      </span>
    </div>
  );
}

function WatchlistCard({
  title,
  caption,
  href,
  actionLabel,
  children,
  footer,
}: {
  title: string;
  caption: string;
  href: string;
  actionLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="gap-0">
      <CardContent className="flex h-full flex-col gap-0 p-0">
        <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
          </div>
        </div>
        <div className="flex-1 px-5">{children}</div>
        {footer && <div className="px-5 pb-2 pt-3 text-[11px] text-muted-foreground">{footer}</div>}
        <div className="px-5 pb-5 pt-3">
          <Link
            href={href}
            className="group/wl inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {actionLabel}
            <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/wl:-translate-y-0.5 group-hover/wl:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Shortcut tiles: icon + label only — depth of one glance.            */
/* ------------------------------------------------------------------ */

function Shortcut({
  href,
  icon: Icon,
  label,
  sublabel,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  sublabel: string;
}) {
  return (
    <Link
      href={href}
      className="group/sc flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5"
    >
      <Icon className="size-5 text-muted-foreground transition-colors group-hover/sc:text-primary" aria-hidden />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{sublabel}</span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CommandCenterPage() {
  const { hasPermission } = useAuth();
  const briefing = useDailyBriefing();
  const data = briefing.data;
  const currency = data?.revenue.revenue[0]?.currency ?? "INR";
  const revenue = data?.revenue.revenue.find((item) => item.currency === currency);
  const outstanding = data?.revenue.outstanding.find((item) => item.currency === currency);
  const updatedAgo = timeAgo(data?.generatedAt);

  type Priority = Omit<Parameters<typeof PriorityRow>[0], "index"> & { key: string };
  const priorities: Priority[] = data
    ? (
        [
          data.atRiskMembers.count > 0 && {
            key: "risk",
            severity: "risk" as const,
            href: "/members",
            icon: AlertTriangle,
            title: `${data.atRiskMembers.count} members need attention`,
            detail: "Retention risk detected from recent activity.",
            action: "Review members",
          },
          data.salesFunnel.followUps.total > 0 && {
            key: "sales",
            severity: "sales" as const,
            href: "/crm",
            icon: TrendingUp,
            title: `${data.salesFunnel.followUps.total} follow-ups in the pipeline`,
            detail: `${data.salesFunnel.followUps.completionRatePct}% completed so far.`,
            action: "Open Sales",
          },
          data.lowStock.count > 0 && {
            key: "stock",
            severity: "stock" as const,
            href: "/inventory",
            icon: Package,
            title: `${data.lowStock.count} products below reorder level`,
            detail: "Protect availability before the next stockout.",
            action: "Review stock",
          },
          data.pendingAiActions > 0 && {
            key: "ai",
            severity: "ai" as const,
            href: "/ai-actions",
            icon: Sparkles,
            title: `${data.pendingAiActions} AI actions await approval`,
            detail: "Review before anything is executed.",
            action: "Review actions",
          },
        ].filter(Boolean) as Priority[]
      )
    : [];

  return (
    <div className="flex flex-col gap-8">
      {/* ------------------------------------------------ Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Command Center</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Your business pulse, decision queue, and growth engine — all in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {updatedAgo && (
            <span className="mr-1 hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Updated {updatedAgo}
            </span>
          )}
          <Link
            href="/owner-os"
            className="inline-flex h-10 items-center gap-2 rounded-[0.78rem] border border-border bg-card/70 px-4 text-sm font-medium shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
          >
            <BarChart3 className="size-4 text-primary" aria-hidden />
            Insights
          </Link>
          <Link
            href="/ai"
            className="inline-flex h-10 items-center gap-2 rounded-[0.78rem] bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            <Sparkles className="size-4" aria-hidden />
            Ask MyGymAgent
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------ Stat band */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CardContent className="grid grid-cols-1 divide-y divide-border/60 p-0 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          <Stat
            icon={CalendarCheck}
            label="Check-ins today"
            value={String(data?.today.checkIns ?? 0)}
            hint="Real-time attendance"
            loading={briefing.isLoading}
          />
          <Stat
            icon={Wallet}
            label="Net revenue"
            value={money(revenue?.netRevenue, currency)}
            hint="Current period"
            loading={briefing.isLoading}
          />
          <Stat
            icon={Users}
            label="Members at risk"
            value={String(data?.atRiskMembers.count ?? 0)}
            hint="14+ days inactive"
            loading={briefing.isLoading}
          />
          <Stat
            icon={Sparkles}
            label="Pending AI actions"
            value={String(data?.pendingAiActions ?? 0)}
            hint="Needs approval"
            loading={briefing.isLoading}
          />
        </CardContent>
      </Card>

      {/* ------------------------------------------------ Decision queue + Sales health */}
      <section className="grid animate-in fade-in slide-in-from-bottom-2 gap-6 duration-500 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="gap-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-6">
              <div>
                <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
                  <Zap className="size-4 text-primary" aria-hidden />
                  Decision queue
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  The highest-value things that deserve attention right now.
                </p>
              </div>
              {data && priorities.length > 0 && (
                <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs tabular-nums text-muted-foreground">
                  {priorities.length}
                </span>
              )}
            </div>
            <div className="px-3 pb-4">
              {briefing.isLoading ? (
                <div className="space-y-2 px-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-xl bg-muted/50" />
                  ))}
                </div>
              ) : priorities.length ? (
                <div className="divide-y divide-border/40">
                  {priorities.map(({ key, ...item }, index) => (
                    <PriorityRow key={key} {...item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-success/30 bg-success/[0.04] px-5 py-10 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="size-5" aria-hidden />
                  </span>
                  <p className="text-sm font-semibold">All caught up</p>
                  <p className="text-xs text-muted-foreground">
                    No priority items need attention right now.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ink panel — the one inverted contrast moment on the page. */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms]">
          <div className="flex h-full flex-col rounded-[1.15rem] bg-foreground text-background shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-background/15 px-6 pb-4 pt-6">
              <div>
                <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
                  <TrendingUp className="size-4" aria-hidden />
                  Sales health
                </h2>
                <p className="mt-1 text-xs text-background/60">
                  Pipeline momentum and follow-up discipline.
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-5 px-6 py-6">
              <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                {(
                  [
                    ["Total leads", data ? String(data.salesFunnel.totalLeads) : "—", "pipeline"],
                    ["Won leads", data ? String(data.salesFunnel.wonLeads) : "—", "pipeline"],
                    ["Conversion", data ? `${data.salesFunnel.conversionRatePct}%` : "—", "rate"],
                    [
                      "Follow-ups done",
                      data ? `${data.salesFunnel.followUps.completionRatePct}%` : "—",
                      "rate",
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-background/50">
                      {label}
                    </p>
                    <p className="font-mono text-3xl leading-none tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/crm"
                className="group/ink mt-auto inline-flex items-center justify-center gap-2 rounded-[0.78rem] bg-background px-5 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Open Sales OS
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover/ink:translate-x-1"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Money movement */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms]">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
              <CreditCard className="size-4 text-primary" aria-hidden />
              Money movement
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {data
                ? `${new Date(data.revenue.period.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(data.revenue.period.to).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                : "Current period"}
            </p>
          </div>
          <Link
            href="/billing"
            className="group/mm inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Open billing
            <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/mm:-translate-y-0.5 group-hover/mm:translate-x-0.5" />
          </Link>
        </div>
        <Card className="gap-0">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {(
                  [
                    {
                      label: "Net revenue",
                      value: money(revenue?.netRevenue, currency),
                      hint: revenue ? `${revenue.paymentCount} payments` : "—",
                    },
                    {
                      label: "Membership revenue",
                      value: money(revenue?.membershipRevenue, currency),
                      hint: "Recurring core",
                    },
                    {
                      label: "Outstanding",
                      value: money(outstanding?.outstandingBalance, currency),
                      hint: outstanding
                        ? `${outstanding.membershipsWithBalance} memberships with balance`
                        : "—",
                    },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="flex flex-col gap-2 p-5 lg:px-6 lg:py-7">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="metric-number font-mono text-[28px] leading-none lg:text-3xl">
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/billing"
                className="group/collect flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 lg:px-6"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning-foreground">
                  <CreditCard className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Keep collections moving</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Review outstanding memberships and keep cash flow healthy.
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/collect:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ------------------------------------------------ Watchlists */}
      <section className="grid animate-in fade-in slide-in-from-bottom-2 gap-5 duration-500 [animation-delay:200ms] lg:grid-cols-3">
        <WatchlistCard
          title="At-risk members"
          caption="Retention watchlist"
          href="/members"
          actionLabel="View all members"
          footer={data ? `${data.atRiskMembers.count} total on watchlist` : undefined}
        >
          {data?.atRiskMembers.top.length ? (
            data.atRiskMembers.top.map((member) => (
              <ListRow
                key={member.id}
                primary={`${member.firstName} ${member.lastName}`}
                secondary={
                  member.neverCheckedIn
                    ? "Never checked in"
                    : `${member.daysSinceLastVisit} days since visit`
                }
                figure="Risk"
                figureTone="warning"
              />
            ))
          ) : (
            <EmptyState text="No at-risk members returned." />
          )}
        </WatchlistCard>

        <WatchlistCard
          title="Low stock"
          caption="Inventory watchlist"
          href="/inventory"
          actionLabel="Open inventory"
          footer={data ? `${data.lowStock.count} products below reorder level` : undefined}
        >
          {data?.lowStock.top.length ? (
            data.lowStock.top.map((product) => (
              <ListRow
                key={product.productId}
                primary={product.name}
                secondary={`${product.sku} · reorder at ${product.reorderLevel}`}
                figure={String(product.quantityOnHand)}
                figureTone="warning"
              />
            ))
          ) : (
            <EmptyState text="Inventory levels look healthy." />
          )}
        </WatchlistCard>

        <WatchlistCard
          title="Trainer workload"
          caption="People + programming activity"
          href="/staff"
          actionLabel="Open staff"
          footer={
            data
              ? `${data.trainerWorkload.trainerCount} trainers · plans assigned last 30 days`
              : undefined
          }
        >
          {data?.trainerWorkload.top.length ? (
            data.trainerWorkload.top.map((trainer) => (
              <ListRow
                key={trainer.userId}
                primary={`${trainer.firstName} ${trainer.lastName}`}
                secondary={`${trainer.assignedMemberCount} assigned members`}
                figure={`${trainer.workoutPlansAssignedLast30Days + trainer.dietPlansAssignedLast30Days} plans`}
                figureTone="muted"
              />
            ))
          ) : (
            <EmptyState text="No trainer workload data returned." />
          )}
        </WatchlistCard>
      </section>

      {/* ------------------------------------------------ Shortcuts (one section, not two) */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:250ms]">
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">Move faster</h2>
          <p className="mt-1 text-xs text-muted-foreground">Jump straight into an operating surface.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {hasPermission("attendance.read") && (
            <Shortcut href="/attendance" icon={CalendarCheck} label="Attendance" sublabel="Check-ins" />
          )}
          {hasPermission("members.read") && (
            <Shortcut href="/members" icon={Users} label="Members" sublabel="Member 360" />
          )}
          {hasPermission("payments.read") && (
            <Shortcut href="/billing" icon={Wallet} label="Billing" sublabel="Collections" />
          )}
          {hasPermission("workouts.edit") && (
            <Shortcut href="/workouts" icon={Dumbbell} label="Workout OS" sublabel="Programs" />
          )}
          <Shortcut href="/owner-os" icon={BarChart3} label="Owner Insights" sublabel="Deep dive" />
          <Shortcut href="/crm" icon={TrendingUp} label="Sales OS" sublabel="Pipeline" />
          <Shortcut href="/inventory" icon={Package} label="Inventory OS" sublabel="Stock" />
          <Shortcut href="/ai" icon={Sparkles} label="MyGymAgent AI" sublabel="Ask anything" />
        </div>
      </section>

      {data && (
        <p className="text-[11px] text-muted-foreground">
          Briefing generated {new Date(data.generatedAt).toLocaleString("en-IN")}.
        </p>
      )}
    </div>
  );
}
