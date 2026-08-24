"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Brain, CreditCard, Dumbbell, Sparkles, Users, Wallet, AlertTriangle, TrendingUp, Target, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/client";

type OwnerBriefing = { generatedAt: string; metrics: { members: number; activeMemberships: number; todayAttendance: number; todayRevenue: number; expiringSoon: number; outstandingPayments: number }; alerts: { id: string; severity: "high" | "medium" | "low"; title: string; detail: string; href?: string }[]; recommendations: { id: string; title: string; reason: string; href?: string }[] };
function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }

export default function OwnerOsPage() {
  const [data, setData] = React.useState<OwnerBriefing | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { let active = true; api.get<OwnerBriefing>("/owner-os/briefing").then(v => active && setData(v)).catch(e => active && setError(e instanceof ApiError ? e.message : "Unable to load owner briefing")); return () => { active = false; }; }, []);
  if (error) return <Card className="border-destructive/20"><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>;
  if (!data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Card className="h-32 animate-pulse" /><Card className="h-32 animate-pulse" /><Card className="h-32 animate-pulse" /></div>;

  const cards = [
    [Users, "Members", data.metrics.members.toLocaleString(), "cyan"],
    [CreditCard, "Active memberships", data.metrics.activeMemberships.toLocaleString(), "violet"],
    [Dumbbell, "Today's attendance", data.metrics.todayAttendance.toLocaleString(), "green"],
    [Wallet, "Today's revenue", money(data.metrics.todayRevenue), "green"],
    [AlertTriangle, "Expiring in 7 days", data.metrics.expiringSoon.toLocaleString(), "amber"],
    [CreditCard, "Outstanding payments", money(data.metrics.outstandingPayments), "coral"],
  ] as const;
  const tone = { cyan: "bg-cyan-500/10 text-cyan-600", violet: "bg-violet-500/10 text-violet-600", green: "bg-emerald-500/10 text-emerald-600", amber: "bg-amber-500/10 text-amber-600", coral: "bg-rose-500/10 text-rose-600" };

  return <div className="flex flex-col gap-7">
    <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.10] via-card to-card p-6 shadow-sm sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 size-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Executive intelligence</div><h1 className="text-3xl font-semibold tracking-tight">Owner OS</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A decision cockpit for your gym. Monitor business health, understand what changed, and move from insight to action.</p></div>
        <Button asChild className="rounded-xl"><Link href="/ai"><Brain className="size-4" /> Ask MyGymAgent</Link></Button>
      </div>
    </section>

    <section><div className="mb-3"><h2 className="text-base font-semibold">Business health</h2><p className="text-xs text-muted-foreground">Live operating signals from your gym.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([Icon,label,value,color])=><Card key={label} className="border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-4"><div className="flex items-start justify-between"><span className={`flex size-10 items-center justify-center rounded-xl ${tone[color]}`}><Icon className="size-4.5" /></span><span className="text-[11px] text-muted-foreground">Live</span></div><p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p></CardContent></Card>)}</div></section>

    <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/20"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Attention required</CardTitle><p className="mt-1 text-xs text-muted-foreground">Signals that deserve a decision.</p></div><Target className="size-4 text-primary" /></div></CardHeader><CardContent className="p-3 sm:p-4">{data.alerts.length === 0 ? <EmptyState text="No urgent issues detected." /> : <div className="space-y-2">{data.alerts.map(a => <div key={a.id} className="group flex items-start gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-muted/30"><span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${a.severity === "high" ? "bg-rose-500/10 text-rose-600" : a.severity === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}><AlertTriangle className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-sm">{a.title}</span><Badge variant={a.severity === "high" ? "destructive" : "secondary"}>{a.severity}</Badge></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{a.detail}</p></div>{a.href && <Button asChild variant="ghost" size="icon" className="shrink-0"><Link href={a.href} aria-label={`Open ${a.title}`}><ArrowRight className="size-4" /></Link></Button>}</div>)}</div>}</CardContent></Card>
      <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-card to-card shadow-sm ring-1 ring-primary/15"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> AI recommendations</CardTitle></CardHeader><CardContent className="space-y-3">{data.recommendations.length === 0 ? <EmptyState text="No recommendations yet." /> : data.recommendations.map(i => <div key={i.id} className="rounded-2xl border bg-background/50 p-4"><p className="font-semibold text-sm">{i.title}</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{i.reason}</p>{i.href && <Button asChild variant="link" className="mt-2 h-auto px-0 text-xs"><Link href={i.href}>Review recommendation <ArrowRight className="ml-1 size-3" /></Link></Button>}</div>)}</CardContent></Card>
    </section>

    <section className="grid gap-3 sm:grid-cols-3"><Insight icon={TrendingUp} title="Growth" description="Review revenue and conversion trends." href="/insights" /><Insight icon={Users} title="Member health" description="Explore retention and engagement signals." href="/members" /><Insight icon={Clock3} title="Today's execution" description="See attendance, sessions and follow-ups." href="/attendance" /></section>
    <p className="text-xs text-muted-foreground">Briefing generated {new Date(data.generatedAt).toLocaleString("en-IN")}. AI recommendations are advisory until an authorized user approves an action.</p>
  </div>;
}

function EmptyState({ text }: { text: string }) { return <div className="flex items-center gap-2 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground"><CheckCircleIcon />{text}</div>; }
function CheckCircleIcon() { return <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">✓</span>; }
function Insight({ icon: Icon, title, description, href }: { icon: typeof TrendingUp; title: string; description: string; href: string }) { return <Link href={href} className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-primary" />{title}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></Link>; }
