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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="aia-title"
          variant="dark"
          accent="violet"
          icon={ShieldCheck}
          title="AI Action Center"
          actions={
            <>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-extrabold ring-1 ring-white/20 backdrop-blur">
                <Clock3 className="size-4 text-amber-300" aria-hidden="true" />
                {actions.isLoading ? "Syncing…" : `${count} pending`}
              </span>
              <Link
                href="/ai"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Ask AI
              </Link>
            </>
          }
        />

        {actions.isError ? (
          <Card className="overflow-hidden border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center" role="alert">
              <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg"><ShieldCheck className="size-6" aria-hidden="true" /></span>
              <p className="text-sm font-extrabold text-stone-900">Approvals unavailable</p>
              <Button onClick={() => actions.refetch()} variant="outline" className="mt-2 min-h-11 rounded-2xl">Retry</Button>
            </CardContent>
          </Card>
        ) : actions.isLoading ? (
          <div className="grid gap-4" aria-label="Loading proposals">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-white/90 bg-white/70"><CardContent className="py-10"><div className="h-6 w-2/3 animate-pulse rounded-full bg-stone-200" /><div className="mt-3 h-4 w-full animate-pulse rounded-full bg-stone-100" /></CardContent></Card>
            ))}
          </div>
        ) : actions.data?.items.length === 0 ? (
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl backdrop-blur-xl">
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <Check className="size-7" aria-hidden="true" />
              </span>
              <p className="mt-2 font-serif text-xl font-semibold text-stone-950">No pending AI actions</p>
              <Link href="/ai" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-stone-950 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">
                Ask AI <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <section aria-labelledby="aia-queue">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
                <Zap className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="aia-queue" className="font-serif text-2xl font-semibold tracking-tight text-stone-950">Approval queue</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {actions.data?.items.map((action) => (
                <Card key={action.id} className="group relative overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5">
                  <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600" aria-hidden="true" />
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25">
                        <Sparkles className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-extrabold tracking-tight text-stone-950">{action.type.replaceAll("_", " ")}</CardTitle>
                        <p className="mt-1 text-sm font-medium leading-6 text-stone-600">{action.reasoning}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 rounded-full bg-amber-500/15 text-amber-800 ring-1 ring-amber-200/60"><Clock3 className="mr-1 size-3" aria-hidden="true" /> Pending</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 sm:flex-row">
                    <Button disabled={approve.isPending} onClick={() => approve.mutate(action.id)} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488)] shadow-lg shadow-emerald-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><Check className="mr-2 size-4" aria-hidden="true" /> Approve &amp; execute</Button>
                    <Button variant="outline" disabled={reject.isPending} onClick={() => reject.mutate({ id: action.id })} className="min-h-11 rounded-2xl border-stone-200 bg-white/80 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><X className="mr-2 size-4" aria-hidden="true" /> Reject</Button>
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
