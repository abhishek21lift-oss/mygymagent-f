"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { useCreateMembership } from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import type { Membership } from "@/lib/types/gym";

export function SellMembershipDialog({
 memberId,
 trigger,
 open: controlledOpen,
 onOpenChange,
 onSold,
 title = "Sell a Membership",
}: {
 memberId: string;
 trigger?: React.ReactNode;
 /** Controlled from outside (the Actions panel) instead of by a trigger. */
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
 /** After the sale is saved, e.g. to close the trial it converts. */
 onSold?: (membership: Membership) => Promise<void> | void;
 title?: string;
}) {
 const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
 const open = controlledOpen ?? uncontrolledOpen;
 const setOpen = onOpenChange ?? setUncontrolledOpen;
 const [planId, setPlanId] = React.useState("");
 const [discount, setDiscount] = React.useState(0);
 const plansQuery = useMembershipPlans({ pageSize: 100 });
 const createMembership = useCreateMembership();

 const selectedPlan = plansQuery.data?.items.find((p) => p.id === planId);
 const finalPrice = selectedPlan ? Math.max(0, Number(selectedPlan.price) - discount) : null;
 // The server refuses a discount above the price or below zero; say so here.
 const discountError =
 selectedPlan && (discount < 0 || discount > Number(selectedPlan.price))
 ? `Discount must be between 0 and ${selectedPlan.price}.`
 : null;

 async function handleSell() {
 if (!planId) return;
 try {
 const sold = await createMembership.mutateAsync({
 memberId,
 membershipPlanId: planId,
 ...(discount > 0 ? { discount } : {}),
 });
 toast.success("Membership sold successfully");
 await onSold?.(sold);
 setOpen(false);
 setPlanId("");
 setDiscount(0);
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to sell membership");
 }
 }

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 {controlledOpen === undefined ? (
 <DialogTrigger asChild>
 {trigger ?? (
 <Button size="sm" className="btn-sheen min-h-11 rounded-lg bg-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Plus className="size-3.5" aria-hidden="true" />
 Sell Membership
 </Button>
 )}
 </DialogTrigger>
 ) : null}
 <DialogContent className="border-border bg-card">
 <DialogHeader>
 <DialogTitle>{title}</DialogTitle>
 </DialogHeader>
 <Select value={planId} onValueChange={setPlanId}>
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Select a plan" />
 </SelectTrigger>
 <SelectContent>
 {plansQuery.data?.items.filter((plan) => plan.isActive).map((plan) => (
 <SelectItem key={plan.id} value={plan.id}>
 {plan.name} — {plan.currency} {plan.price} / {plan.durationDays}d
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {selectedPlan && (
 <div className="space-y-2">
 <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
 <div className="flex-1">
 <p className="text-sm font-medium">Plan Price</p>
 <p className="text-lg font-bold">{selectedPlan.currency} {selectedPlan.price}</p>
 </div>
 <div className="flex items-center gap-2">
 <div className="text-right">
 <p className="text-sm font-medium text-stone-600">Discount</p>
 <p className="text-sm font-medium text-destructive">-{selectedPlan.currency} {discount}</p>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
 <div className="flex-1">
 <p className="text-sm font-medium text-stone-600">Final Amount</p>
 <p className="text-xl font-bold text-primary">{selectedPlan.currency} {finalPrice}</p>
 </div>
 </div>
 <div>
 <Label>Discount Amount</Label>
 <Input
 type="number"
 min="0"
 max={Number(selectedPlan.price)}
 step="1"
 value={discount}
 onChange={(e) => setDiscount(Number(e.target.value) || 0)}
 aria-invalid={discountError ? true : undefined}
 aria-describedby={discountError ? "sell-discount-error" : undefined}
 className="mt-1"
 />
 {discountError && (
 <p id="sell-discount-error" className="mt-1 text-xs font-medium text-destructive">
 {discountError}
 </p>
 )}
 </div>
 </div>
 )}
 <DialogFooter>
 <Button
 onClick={handleSell}
 disabled={!planId || Boolean(discountError) || createMembership.isPending}
 >
 {createMembership.isPending ? "Selling..." : "Confirm Sale"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
