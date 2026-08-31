"use client";

import Link from "next/link";
import { Check, Clock3, X, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiActions, useApproveAiAction, useRejectAiAction } from "@/lib/hooks/use-ai-actions";

const statusMeta = {
  PENDING_APPROVAL: { label: "Pending", icon: Clock3 },
  APPROVED: { label: "Approved", icon: ShieldCheck },
  EXECUTED: { label: "Executed", icon: Check },
  FAILED: { label: "Failed", icon: X },
} as const;

export default function AiActionsPage() {
  const actions = useAiActions("PENDING_APPROVAL");
  const approve = useApproveAiAction();
  const reject = useRejectAiAction();

  const items = actions.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Command Queue"
        description="Human-approved AI actions before they affect your gym."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending approval</p><p className="mt-2 text-3xl font-semibold">{items.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Safety gate</p><p className="mt-2 flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="size-5" /> Human approval</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Queue status</p><p className="mt-2 flex items-center gap-2 text-lg font-semibold"><span className="size-2 rounded-full bg-emerald-500" /> Operational</p></CardContent></Card>
      </div>

      {actions.isError ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You don&apos;t have access to AI approvals, or the service is unavailable.</CardContent></Card>
      ) : actions.isLoading ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading command queue…</CardContent></Card>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center"><Sparkles className="size-9 text-muted-foreground" /><p className="font-medium">Queue is clear</p><p className="text-sm text-muted-foreground">No AI actions are waiting for approval.</p><Link href="/ai" className="mt-2 text-sm font-medium text-primary">Open AI assistant</Link></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {items.map((action) => {
            const meta = statusMeta[action.status as keyof typeof statusMeta] ?? statusMeta.PENDING_APPROVAL;
            const StatusIcon = meta.icon;
            return (
              <Card key={action.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base capitalize">{action.type.replaceAll("_", " ").toLowerCase()}</CardTitle>
                      <Badge variant="secondary"><StatusIcon className="mr-1 size-3" /> {meta.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{action.reasoning}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 border-t pt-4">
                  <Button disabled={approve.isPending || reject.isPending} onClick={() => approve.mutate(action.id)}><Check className="mr-2 size-4" /> Approve & execute</Button>
                  <Button variant="outline" disabled={approve.isPending || reject.isPending} onClick={() => reject.mutate({ id: action.id })}><X className="mr-2 size-4" /> Reject</Button>
                  <Button variant="ghost" size="icon" aria-label="Refresh queue" onClick={() => actions.refetch()} disabled={actions.isFetching}><RefreshCw className={`size-4 ${actions.isFetching ? "animate-spin" : ""}`} /></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
