"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Brain, CreditCard, Dumbbell, Sparkles, Users, Wallet, AlertTriangle, Target, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";

type OwnerBriefing = { generatedAt: string; metrics: { members: number; activeMemberships: number; todayAttendance: number; todayRevenue: number; expiringSoon: number; outstandingPayments: number }; alerts: { id: string; severity: "high" | "medium" | "low"; title: string; detail: string; href?: string }[]; recommendations: { id: string; title: string; reason: string; href?: string }[] };
function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }

const CARD_TONES = [
 { bar: "bg-cyan-400", tile: "bg-cyan-500 shadow-cyan-500/30", ring: "hover:border-cyan-200" },
 { bar: "bg-violet-600", tile: "bg-violet-600 shadow-violet-500/30", ring: "hover:border-violet-200" },
 { bar: "bg-emerald-400", tile: "bg-emerald-500 shadow-emerald-500/30", ring: "hover:border-emerald-200" },
 { bar: "bg-amber-400", tile: "bg-emerald-500 shadow-emerald-500/30", ring: "hover:border-amber-200" },
 { bar: "bg-amber-400", tile: "bg-amber-500 shadow-amber-500/30", ring: "hover:border-amber-200" },
 { bar: "bg-rose-500", tile: "bg-rose-500 shadow-rose-500/30", ring: "hover:border-rose-200" },
] as const;

export default function OwnerOsPage() {
 const [data, setData] = React.useState<OwnerBriefing | null>(null);
 const [error, setError] = React.useState<string | null>(null);
 React.useEffect(() => { let active = true; api.get<OwnerBriefing>("/owner-os/briefing").then(v => active && setData(v)).catch(e => active && setError(e instanceof ApiError ? e.message : "Unable to load owner briefing")); return () => { active = false; }; }, []);
 if (error) return <div className="pb-4">
 <div className="flex flex-col gap-5"><Card className="border-rose-200 bg-muted/40"><CardContent className="p-6 text-sm font-bold text-rose-700" role="alert">{error}</CardContent></Card></div></div>;
 if (!data) return <div className="pb-4">
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-6"><Card className="h-32 animate-pulse border-border bg-card" /><Card className="h-32 animate-pulse border-border bg-card" /><Card className="h-32 animate-pulse border-border bg-card" /></div></div>;

 const cards = [
 [Users, "Members", data.metrics.members.toLocaleString()],
 [CreditCard, "Active memberships", data.metrics.activeMemberships.toLocaleString()],
 [Dumbbell, "Today's attendance", data.metrics.todayAttendance.toLocaleString()],
 [Wallet, "Today's revenue", money(data.metrics.todayRevenue)],
 [AlertTriangle, "Expiring in 7 days", data.metrics.expiringSoon.toLocaleString()],
 [CreditCard, "Outstanding payments", money(data.metrics.outstandingPayments)],
 ] as const;

 return <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="owner-title"
 icon={Sparkles}
 title="Business health"
 actions={
 <>
 <Button asChild className="min-h-10 rounded-xl"><Link href="/ai"><Brain className="size-4" aria-hidden="true" /> Ask THE CULT CLIENT</Link></Button>
 <Button asChild variant="outline" className="min-h-10 rounded-xl"><Link href="/intelligence">Intelligence <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
 </>
 }
 />

 <section aria-labelledby="owner-health"><div className="mb-4"><h2 id="owner-health" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Business health</h2></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([Icon,label,value], i)=>{ const t = CARD_TONES[i % CARD_TONES.length]; return <Card key={label} className={`group relative overflow-hidden border-border bg-card shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] transition duration-300 hover:-translate-y-1 ${t.ring}`}><span className={`absolute inset-x-0 top-0 h-1.5 ${t.bar}`} aria-hidden="true" /><CardContent className="relative p-5 lg:p-6"><div className="flex items-start justify-between gap-3"><span className={`flex size-14 shrink-0 items-center justify-center rounded-lg text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.tile}`}><Icon className="size-6" aria-hidden="true" /></span></div><p className="mt-4 text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p><p className="mt-1 text-xs font-black uppercase tracking-[.18em] text-stone-500">{label}</p></CardContent></Card>;})}</div></section>

 <section aria-label="Attention and recommendations" className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
 <Card className="overflow-hidden border-border bg-card"><CardHeader className="border-b border-border bg-card px-5 py-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-lg bg-rose-500 text-white shadow-lg shadow-rose-500/25"><Target className="size-5" aria-hidden="true" /></span><div><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950">Attention required</CardTitle></div></div>{data.alerts.length > 0 && <span className="rounded-full bg-rose-500 px-3 py-1 font-mono text-xs font-black text-white tabular-nums shadow-md">{data.alerts.length}</span>}</div></CardHeader><CardContent className="p-3 sm:p-4">{data.alerts.length === 0 ? <EmptyState text="No urgent issues detected." /> : <div className="flex flex-col gap-1">{data.alerts.map(a => <div key={a.id} className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-3.5 transition hover:-translate-y-px hover:border-rose-200 hover:bg-rose-50/60 hover:shadow-md"><span className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg text-white shadow-md ${a.severity === "high" ? "bg-rose-500 shadow-rose-500/25" : a.severity === "medium" ? "bg-amber-500 shadow-amber-500/25" : "bg-stone-400"}`}><AlertTriangle className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-extrabold text-stone-900">{a.title}</span><Badge variant={a.severity === "high" ? "destructive" : "secondary"} className="rounded-full">{a.severity}</Badge></div><p className="mt-1 text-xs font-medium leading-5 text-stone-600">{a.detail}</p></div>{a.href && <Button asChild variant="ghost" size="icon" className="min-h-11 min-w-11 shrink-0 rounded-xl hover:bg-foreground hover:text-background"><Link href={a.href} aria-label={`Open ${a.title}`}><ArrowRight className="size-4" aria-hidden="true" /></Link></Button>}</div>)}</div>}</CardContent></Card>
 <Card className="overflow-hidden border-border bg-muted/40"><CardHeader className="px-5 py-5"><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-3 tracking-tight text-stone-950"><span className="flex size-11 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/25"><Sparkles className="size-5" aria-hidden="true" /></span> AI recommendations</CardTitle></CardHeader><CardContent className="space-y-3 px-5 pb-5">{data.recommendations.length === 0 ? <EmptyState text="No recommendations yet." /> : data.recommendations.map(i => <div key={i.id} className="rounded-xl border border-violet-100/80 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-sm font-extrabold text-stone-900">{i.title}</p><p className="mt-1.5 text-xs font-medium leading-5 text-stone-600">{i.reason}</p>{i.href && <Button asChild variant="link" className="mt-2 h-auto min-h-11 px-0 text-xs font-extrabold text-violet-700"><Link href={i.href}>Review <ArrowRight className="ml-1 size-3" aria-hidden="true" /></Link></Button>}</div>)}</CardContent></Card>
 </section>

 <p className="text-xs font-medium text-stone-500">Briefing generated {new Date(data.generatedAt).toLocaleString("en-IN")}.</p>
 </div></div>;
}

function EmptyState({ text }: { text: string }) { return <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-200 bg-muted/40 px-5 py-10 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"><CheckCircle2 className="size-6" aria-hidden="true" /></span><p className="text-sm font-extrabold text-stone-900">All clear</p><p className="text-xs font-medium text-stone-600">{text}</p></div>; }
