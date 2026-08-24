"use client";

import Link from "next/link";
import { Check, Clock3, X, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiActions, useApproveAiAction, useRejectAiAction } from "@/lib/hooks/use-ai-actions";

export default function AiActionsPage() {
  const actions = useAiActions("PENDING_APPROVAL");
  const approve = useApproveAiAction();
  const reject = useRejectAiAction();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Action Center" description="Review AI-proposed changes before they affect your gym." />
      {actions.isError ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You don't have access to AI approvals, or the service is unavailable.</CardContent></Card>
      ) : actions.isLoading ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading proposals…</CardContent></Card>
      ) : actions.data?.items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center"><Sparkles className="size-8 text-muted-foreground" /><p className="font-medium">No pending AI actions</p><p className="text-sm text-muted-foreground">You're all caught up.</p><Link href="/ai" className="mt-2 text-sm font-medium text-primary">Ask the AI assistant</Link></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {actions.data?.items.map((action) => (
            <Card key={action.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div><CardTitle className="text-base">{action.type.replaceAll("_", " ")}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{action.reasoning}</p></div>
                <Badge variant="secondary"><Clock3 className="mr-1 size-3" /> Pending</Badge>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button disabled={approve.isPending} onClick={() => approve.mutate(action.id)}><Check className="mr-2 size-4" /> Approve & execute</Button>
                <Button variant="outline" disabled={reject.isPending} onClick={() => reject.mutate({ id: action.id })}><X className="mr-2 size-4" /> Reject</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
