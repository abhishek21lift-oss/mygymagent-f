"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, CalendarCheck, CreditCard, Dumbbell, Megaphone, Sparkles, UserPlus, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

const QUICK_ACTIONS = [
  ["Add a member", "Register a new client", "/members/new", UserPlus, "members.create"],
  ["Record a payment", "Log cash, card, or UPI", "/billing", Wallet, "payments.create"],
  ["Check in a member", "Record attendance", "/attendance", CalendarCheck, "attendance.create"],
  ["Build a workout", "Create or assign a plan", "/workouts", Dumbbell, "workouts.create"],
  ["Add a lead", "Track a new prospect", "/crm", Megaphone, "leads.manage"],
  ["Ask the AI assistant", "Draft plans, look up members", "/ai", Sparkles, "ai.generate"],
] as const;

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const briefing = useDailyBriefing();
  const data = briefing.data;
  const currency = data?.revenue.revenue[0]?.currency ?? "INR";
  const revenue = data?.revenue.revenue.find((r) => r.currency === currency)?.netRevenue ?? "0.00";
  const outstanding = data?.revenue.outstanding.find((r) => r.currency === currency)?.outstandingBalance ?? "0.00";
  const visibleActions = QUICK_ACTIONS.filter(([, , , , permission]) => hasPermission(permission));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Welcome back, ${user?.firstName ?? ""}`} description={todayLabel()} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's check-ins" icon={CalendarCheck} value={data?.today.checkIns} isLoading={briefing.isLoading} />
        <StatCard title="Net revenue" icon={Wallet} value={data ? `${currency} ${revenue}` : undefined} isLoading={briefing.isLoading} tone="success" hint="Current period" />
        <StatCard title="Members at risk" icon={AlertTriangle} value={data?.atRiskMembers.count} isLoading={briefing.isLoading} tone="warning" hint="14+ days inactive" />
        <StatCard title="Pending AI actions" icon={Sparkles} value={data?.pendingAiActions} isLoading={briefing.isLoading} tone="primary" hint="Awaiting approval" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Attention center</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link href="/members" className="rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm">
              <p className="text-sm font-medium">At-risk members</p><p className="mt-1 text-2xl font-semibold tabular-nums">{data?.atRiskMembers.count ?? 0}</p><p className="text-xs text-muted-foreground">Review members before they churn</p>
            </Link>
            <Link href="/billing" className="rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm">
              <p className="text-sm font-medium">Outstanding balances</p><p className="mt-1 text-2xl font-semibold tabular-nums">{currency} {outstanding}</p><p className="text-xs text-muted-foreground">Membership balances currently due</p>
            </Link>
            <Link href="/crm" className="rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm">
              <p className="text-sm font-medium">Lead follow-ups</p><p className="mt-1 text-2xl font-semibold tabular-nums">{data?.salesFunnel.followUps.total ?? 0}</p><p className="text-xs text-muted-foreground">{data?.salesFunnel.followUps.completionRatePct ?? "0.00"}% completed</p>
            </Link>
            <Link href="/inventory" className="rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm">
              <p className="text-sm font-medium">Low-stock products</p><p className="mt-1 text-2xl font-semibold tabular-nums">{data?.lowStock.count ?? 0}</p><p className="text-xs text-muted-foreground">At or below reorder level</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">AI briefing</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{data ? `Today: ${data.today.checkIns} check-ins, ${data.atRiskMembers.count} members need attention, and ${data.pendingAiActions} AI proposals await decisions.` : "Loading today's operational briefing…"}</p>
            <Link href="/ai" className="inline-flex items-center gap-2 font-medium text-primary">Open AI assistant <ArrowRight className="size-4" /></Link>
          </CardContent>
        </Card>
      </div>

      {visibleActions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleActions.map(([title, description, href, Icon]) => (
              <Link key={href} href={href}><Card className="group gap-0 py-4 transition-all hover:border-primary/40 hover:shadow-md"><CardContent className="flex items-center gap-3 px-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div><div className="flex min-w-0 flex-1 flex-col"><span className="text-sm font-medium">{title}</span><span className="truncate text-xs text-muted-foreground">{description}</span></div><ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></CardContent></Card></Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
