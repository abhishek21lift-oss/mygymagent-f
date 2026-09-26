"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import {
 useAiAction,
 useApproveAiAction,
 useRejectAiAction,
 type AiAction,
} from "@/lib/hooks/use-ai-actions";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function ReviewBody({ actionId, onDone }: { actionId: string; onDone: () => void }) {
 // Re-read rather than trust the list, which is cached for 15 seconds:
 // approving a row that has already been decided elsewhere, or whose
 // arguments have moved, is the rubber stamp this screen exists to avoid.
 const detail = useAiAction(actionId);
 const approve = useApproveAiAction();
 const reject = useRejectAiAction();
 const [reason, setReason] = React.useState("");

 if (detail.isPending) return <div className="grid gap-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-32 w-full" /></div>;
 if (detail.isError || !detail.data) {
  return (
   <div className="grid gap-3">
    <p role="alert" className="text-sm font-semibold text-destructive">Could not load this proposal.</p>
    <Button type="button" variant="outline" onClick={() => void detail.refetch()}>Try again</Button>
   </div>
  );
 }

 const action = detail.data;
 const decided = action.status !== "PENDING_APPROVAL";

 async function run(kind: "approve" | "reject") {
  try {
   if (kind === "approve") {
    await approve.mutateAsync(actionId);
    toast.success("Approved and executed");
   } else {
    await reject.mutateAsync({ id: actionId, reason: reason.trim() || undefined });
    toast.success("Proposal rejected");
   }
   onDone();
  } catch (error) {
   toast.error(error instanceof ApiError ? error.message : "Could not record that decision.");
  }
 }

 return (
  <div className="grid gap-4">
   <div className="grid gap-1.5">
    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Why</p>
    <p className="text-sm">{action.reasoning || "No reasoning recorded."}</p>
   </div>

   {/* The arguments this would run with. Approving without seeing them is
       approving a description of a change, not the change. */}
   <div className="grid gap-1.5">
    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
     What would run
    </p>
    <pre className="max-h-60 overflow-auto rounded-lg bg-muted/60 p-3 text-xs leading-5">
     {JSON.stringify(action.payload ?? {}, null, 2)}
    </pre>
   </div>

   {decided ? (
    <p className="rounded-lg bg-muted/50 p-3 text-sm font-medium">
     Already {action.status.toLowerCase().replaceAll("_", " ")}
     {action.rejectionReason ? ` — ${action.rejectionReason}` : ""}.
    </p>
   ) : (
    <>
     <div className="grid gap-1.5">
      <Label htmlFor="reject-reason">Reason, if rejecting</Label>
      <Input
       id="reject-reason"
       value={reason}
       onChange={(event) => setReason(event.target.value)}
       placeholder="Optional"
      />
     </div>
     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       disabled={reject.isPending || approve.isPending}
       onClick={() => void run("reject")}
      >
       <X className="mr-2 size-4" aria-hidden="true" />
       {reject.isPending ? "Rejecting..." : "Reject"}
      </Button>
      <Button
       type="button"
       disabled={approve.isPending || reject.isPending}
       aria-busy={approve.isPending}
       onClick={() => void run("approve")}
      >
       <Check className="mr-2 size-4" aria-hidden="true" />
       {approve.isPending ? "Running..." : "Approve & execute"}
      </Button>
     </DialogFooter>
    </>
   )}
  </div>
 );
}

/**
 * Review a proposal before deciding on it.
 *
 * The queue offered a one-click "Approve & execute" beside the model's
 * own summary of what it wanted to do. The arguments it would actually
 * run with were never shown -- which is the rubber stamp the approval
 * step exists to prevent.
 */
export function AiActionReviewDialog({ action }: { action: AiAction }) {
 const [open, setOpen] = React.useState(false);
 return (
  <>
   <Button
    type="button"
    onClick={() => setOpen(true)}
    className="btn-sheen min-h-11 rounded-lg bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
   >
    <Check className="mr-2 size-4" aria-hidden="true" /> Review &amp; decide
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-lg">
     <DialogHeader>
      <DialogTitle>{action.type.replaceAll("_", " ")}</DialogTitle>
      <DialogDescription>
       Proposed {new Date(action.createdAt).toLocaleString()}
      </DialogDescription>
     </DialogHeader>
     {open ? <ReviewBody actionId={action.id} onDone={() => setOpen(false)} /> : null}
    </DialogContent>
   </Dialog>
  </>
 );
}
