"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, ShieldCheck, X, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiActions, useApproveAiAction, useRejectAiAction } from "@/lib/hooks/use-ai-actions";
import { PageHero } from "@/components/shared/page-hero";

export default function AiActionsPage() {
 const actions = useAiActions("PENDING_APPROVAL");
 const approve = useApproveAiAction();
 const reject = useRejectAiAction();
 const count = actions.data?.items.length ?? 0;

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="aia-title"
 icon={ShieldCheck}
 title="AI actions"
 actions={
 <>
 <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-extrabold ring-1 ring-white/20">
 <Clock3 className="size-4 text-amber-300" aria-hidden="true" />
 {actions.isLoading ? "Syncing…" : `${count} pending`}
 </span>
 <Link
 href="/ai"
 className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-extrabold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 <Sparkles className="size-4" aria-hidden="true" />
 Ask AI
 </Link>
 </>
 }
 />

 {actions.isError ? (
 <Card className="overflow-hidden border-rose-200 bg-muted/40">
 <CardContent className="flex flex-col items-center gap-2 py-12 text-center" role="alert">
 <span className="flex size-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg"><ShieldCheck className="size-6" aria-hidden="true" /></span>
 <p className="text-sm font-extrabold text-stone-900">Approvals unavailable</p>
 <Button onClick={() => actions.refetch()} variant="outline" className="mt-2 min-h-11 rounded-lg">Retry</Button>
 </CardContent>
 </Card>
 ) : actions.isLoading ? (
 <div className="grid gap-4" aria-label="Loading proposals">
 {[1, 2, 3].map((i) => (
 <Card key={i} className="border-border bg-card"><CardContent className="py-10"><div className="h-6 w-2/3 animate-pulse rounded-full bg-stone-200" /><div className="mt-3 h-4 w-full animate-pulse rounded-full bg-stone-100" /></CardContent></Card>
 ))}
 </div>
 ) : actions.data?.items.length === 0 ? (
 <Card className="overflow-hidden border-border bg-card shadow-sm">
 <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
 <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
 <Check className="size-7" aria-hidden="true" />
 </span>
 <p className="mt-2 text-base font-semibold text-foreground">No pending AI actions</p>
 <Link href="/ai" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 Ask AI <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </CardContent>
 </Card>
 ) : (
 <section aria-labelledby="aia-queue">
 <div className="mb-4 flex items-center gap-3">
 <span className="flex size-11 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/25">
 <Zap className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 id="aia-queue" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Approval queue</h2>
 </div>
 </div>
 <div className="grid gap-4">
 {actions.data?.items.map((action) => (
 <Card key={action.id} className="group relative overflow-hidden border-border bg-card transition duration-300 hover:-translate-y-0.5">
 <span className="absolute inset-x-0 top-0 h-1.5 bg-violet-600" aria-hidden="true" />
 <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
 <div className="flex min-w-0 items-start gap-3">
 <div className="min-w-0">
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950">{action.type.replaceAll("_", " ")}</CardTitle>
 <p className="mt-1 text-sm font-medium leading-6 text-stone-600">{action.reasoning}</p>
 </div>
 </div>
 <Badge variant="secondary" className="shrink-0 rounded-full bg-amber-500/15 text-amber-800 ring-1 ring-amber-200/60"><Clock3 className="mr-1 size-3" aria-hidden="true" /> Pending</Badge>
 </CardHeader>
 <CardContent className="flex flex-col gap-2 sm:flex-row">
 <Button disabled={approve.isPending} onClick={() => approve.mutate(action.id)} className="btn-sheen min-h-11 rounded-lg bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Check className="mr-2 size-4" aria-hidden="true" /> Approve &amp; execute</Button>
 <Button variant="outline" disabled={reject.isPending} onClick={() => reject.mutate({ id: action.id })} className="min-h-11 rounded-lg border-stone-200 bg-card hover:border-border hover:bg-rose-50 hover:text-foreground"><X className="mr-2 size-4" aria-hidden="true" /> Reject</Button>
 </CardContent>
 </Card>
 ))}
 </div>
 </section>
 )}
 </div>
 </div>
 );
}
