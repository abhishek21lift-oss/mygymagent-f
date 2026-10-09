"use client";

import * as React from "react";

import { MemberPicker } from "@/components/shared/member-picker";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
 useActivateMembership,
 useCancelMembership,
 useDowngradeMembership,
 useExtendMembership,
 useFreezeMembership,
 useRenewMembership,
 useResumeMembership,
 useTransferMembership,
 useUpgradeMembership,
} from "@/lib/hooks/use-memberships";
import { formatMoney } from "@/lib/money";
import type { Membership, MembershipPlan } from "@/lib/types/gym";

import {
 ActionDialog,
 Field,
 PAYMENT_METHODS,
 type PaymentMethodValue,
 addDays,
 formatDay,
 parseDays,
} from "./action-dialog";
import type { MembershipActionId } from "./member-action-state";

interface DialogProps {
 membership: Membership;
 memberId: string;
 onDone: () => Promise<unknown>;
 onOpenChange: (open: boolean) => void;
}

const planName = (m: Membership) => m.membershipPlan?.name ?? "this membership";

/** A money amount typed into a box: a non-negative number, or null. */
function parseAmount(value: string): number | null {
 if (value.trim() === "") return 0;
 const amount = Number(value);
 return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

function ConfirmDialog({
 membership,
 onDone,
 onOpenChange,
 kind,
}: DialogProps & { kind: "activate" | "resume" }) {
 const activate = useActivateMembership();
 const resume = useResumeMembership();
 const frozenSince = membership.freezeStartDate;
 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title={kind === "activate" ? "Activate membership" : "Unfreeze membership"}
 description={
 kind === "activate"
 ? `${planName(membership)} starts counting now.`
 : `The days frozen${frozenSince ? ` since ${formatDay(frozenSince)}` : ""} are added back to the end date, and any renewal moves with it.`
 }
 confirmLabel={kind === "activate" ? "Activate" : "Unfreeze"}
 onConfirm={async () => {
 if (kind === "activate") await activate.mutateAsync(membership.id);
 else await resume.mutateAsync(membership.id);
 await onDone();
 return kind === "activate" ? "Membership activated" : "Membership unfrozen";
 }}
 />
 );
}

function FreezeDialog({ membership, onDone, onOpenChange }: DialogProps) {
 const freeze = useFreezeMembership();
 const left = (membership.membershipPlan?.maxFreezeDays ?? 0) - membership.totalFreezeDaysUsed;
 const [value, setValue] = React.useState(String(Math.min(7, left)));
 const days = parseDays(value, 1, left);
 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title="Freeze membership"
 description="Pauses the term. Frozen days are added back to the end date on unfreeze."
 confirmLabel="Freeze"
 canConfirm={days !== null}
 onConfirm={async () => {
 await freeze.mutateAsync({ id: membership.id, days: days! });
 await onDone();
 return `Frozen for ${days} day${days === 1 ? "" : "s"}`;
 }}
 >
 <Field
 id="freeze-days"
 label="Days"
 error={days === null && value !== "" ? `Between 1 and ${left}` : null}
 help={`${left} of ${membership.membershipPlan?.maxFreezeDays ?? 0} freeze days left on this plan. Unfreezes on its own after ${days ?? "—"} days.`}
 >
 <Input id="freeze-days" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="min-h-11" autoFocus />
 </Field>
 </ActionDialog>
 );
}

function ExtendDialog({ membership, onDone, onOpenChange }: DialogProps) {
 const extend = useExtendMembership();
 const [value, setValue] = React.useState("7");
 const days = parseDays(value, 1, 365);
 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title="Extend membership"
 description="Adds free days to this term without changing the plan or the price. A renewal already sold moves back by the same days."
 confirmLabel="Extend"
 canConfirm={days !== null}
 onConfirm={async () => {
 await extend.mutateAsync({ id: membership.id, days: days! });
 await onDone();
 return `Extended by ${days} day${days === 1 ? "" : "s"}`;
 }}
 >
 <Field
 id="extend-days"
 label="Days to add"
 error={days === null && value !== "" ? "Between 1 and 365" : null}
 help={days ? `Ends ${formatDay(addDays(membership.endDate, days))} instead of ${formatDay(membership.endDate)}.` : undefined}
 >
 <Input id="extend-days" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="min-h-11" autoFocus />
 </Field>
 </ActionDialog>
 );
}

function ChangePlanDialog({
 membership,
 onDone,
 onOpenChange,
 plans,
 direction,
}: DialogProps & { plans: MembershipPlan[]; direction: "upgrade" | "downgrade" }) {
 const upgrade = useUpgradeMembership();
 const downgrade = useDowngradeMembership();
 const currentPrice = Number(membership.membershipPlan?.price ?? 0);
 const options = plans
 .filter((p) => p.isActive && p.id !== membership.membershipPlanId)
 .filter((p) => (direction === "upgrade" ? Number(p.price) > currentPrice : Number(p.price) < currentPrice))
 .sort((a, b) => Number(a.price) - Number(b.price));
 const [planId, setPlanId] = React.useState(options[0]?.id ?? "");
 const [paid, setPaid] = React.useState("");
 const [method, setMethod] = React.useState<PaymentMethodValue>("CASH");
 const plan = options.find((p) => p.id === planId);
 const amount = parseAmount(paid);
 const title = direction === "upgrade" ? "Upgrade plan" : "Downgrade plan";

 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title={title}
 description={`${planName(membership)} ends today and the new plan starts now. What's left of the amount paid on the old term is credited against the new one.`}
 confirmLabel={direction === "upgrade" ? "Upgrade" : "Downgrade"}
 canConfirm={Boolean(plan) && amount !== null}
 onConfirm={async () => {
 const mutate = direction === "upgrade" ? upgrade : downgrade;
 const result = await mutate.mutateAsync({
 id: membership.id,
 membershipPlanId: planId,
 ...(amount ? { initialPayment: amount, paymentMethod: method } : {}),
 });
 await onDone();
 const currency = plan?.currency ?? membership.currency;
 return `Moved to ${plan?.name}: ${formatMoney(result.credit, currency)} credited, ${formatMoney(result.amountDue, currency)} due`;
 }}
 >
 <Field id="change-plan" label="New plan">
 <Select value={planId} onValueChange={setPlanId}>
 <SelectTrigger id="change-plan" className="min-h-11 w-full">
 <SelectValue placeholder="Choose a plan" />
 </SelectTrigger>
 <SelectContent>
 {options.map((p) => (
 <SelectItem key={p.id} value={p.id}>
 {p.name} · {formatMoney(p.price, p.currency)} / {p.durationDays}d
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>
 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
 <Field id="change-paid" label="Collected now" error={amount === null ? "Enter an amount" : null} help="Optional">
 <Input id="change-paid" inputMode="decimal" placeholder="0" value={paid} onChange={(e) => setPaid(e.target.value)} className="min-h-11" />
 </Field>
 <Field id="change-method" label="Method">
 <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethodValue)} disabled={!amount}>
 <SelectTrigger id="change-method" className="min-h-11 w-full">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {PAYMENT_METHODS.map((m) => (
 <SelectItem key={m.value} value={m.value}>
 {m.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>
 </div>
 </ActionDialog>
 );
}

function TransferDialog({ membership, memberId, onDone, onOpenChange }: DialogProps) {
 const transfer = useTransferMembership();
 const [target, setTarget] = React.useState<{ id: string; label: string } | null>(null);
 const [reason, setReason] = React.useState("");
 const self = target?.id === memberId;
 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title="Transfer membership"
 description={`${planName(membership)} and its remaining days, to ${formatDay(membership.endDate)}, move to the member you choose. Payments already taken stay on this member's record.`}
 confirmLabel="Transfer"
 canConfirm={Boolean(target) && !self}
 onConfirm={async () => {
 await transfer.mutateAsync({ id: membership.id, toMemberId: target!.id, reason: reason.trim() || undefined });
 await onDone();
 return `Transferred to ${target!.label}`;
 }}
 >
 <Field id="transfer-member" label="Transfer to" error={self ? "Choose a different member" : null}>
 <MemberPicker value={target} onChange={setTarget} />
 </Field>
 <Field id="transfer-reason" label="Reason" help="Optional, kept in the audit log">
 <Textarea id="transfer-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
 </Field>
 </ActionDialog>
 );
}

function RenewDialog({ membership, onDone, onOpenChange }: DialogProps) {
 const renew = useRenewMembership();
 const plan = membership.membershipPlan;
 const [discountValue, setDiscountValue] = React.useState("");
 const discount = parseAmount(discountValue);
 const price = Number(plan?.price ?? 0);
 const tooMuch = discount !== null && discount > price;
 const closed = membership.status === "EXPIRED" || membership.status === "CANCELLED";
 const start = closed ? new Date() : new Date(membership.endDate);
 const end = addDays(start.getTime(), plan?.durationDays ?? 0);
 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title="Renew membership"
 description={`Another ${plan?.durationDays ?? ""}-day term of ${planName(membership)}, from ${formatDay(start)} to ${formatDay(end)}. An invoice is raised for it.`}
 confirmLabel="Renew"
 canConfirm={discount !== null && !tooMuch}
 onConfirm={async () => {
 await renew.mutateAsync({ id: membership.id, ...(discount ? { discount } : {}) });
 await onDone();
 return `Renewed to ${formatDay(end)}`;
 }}
 >
 <Field
 id="renew-discount"
 label="Discount"
 error={discount === null ? "Enter an amount" : tooMuch ? `At most ${formatMoney(price, plan?.currency ?? membership.currency)}` : null}
 help={plan ? `Plan price ${formatMoney(plan.price, plan.currency)}. Optional.` : "Optional"}
 >
 <Input id="renew-discount" inputMode="decimal" placeholder="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="min-h-11" />
 </Field>
 </ActionDialog>
 );
}

function CancelDialog({ membership, onDone, onOpenChange, renewal }: DialogProps & { renewal: boolean }) {
 const cancel = useCancelMembership();
 const [reason, setReason] = React.useState("");
 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 destructive
 title={renewal ? "Cancel renewal" : "Cancel membership"}
 description={
 renewal
 ? `The term from ${formatDay(membership.startDate)} won't start. The running term is unchanged.`
 : `${planName(membership)} ends now. This can't be undone; payments are kept and can be refunded from Payments.`
 }
 confirmLabel={renewal ? "Cancel renewal" : "Cancel membership"}
 onConfirm={async () => {
 await cancel.mutateAsync({ id: membership.id, reason: reason.trim() || undefined });
 await onDone();
 return renewal ? "Renewal cancelled" : "Membership cancelled";
 }}
 >
 <Field id="cancel-reason" label="Reason" help="Optional, kept on the record">
 <Textarea id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} autoFocus />
 </Field>
 </ActionDialog>
 );
}

/** The dialog for one membership action, already open. */
export function MembershipActionDialog({
 action,
 plans,
 ...props
}: DialogProps & { action: Exclude<MembershipActionId, "sell">; plans: MembershipPlan[] }) {
 switch (action) {
 case "activate":
 case "resume":
 return <ConfirmDialog {...props} kind={action} />;
 case "freeze":
 return <FreezeDialog {...props} />;
 case "extend":
 return <ExtendDialog {...props} />;
 case "upgrade":
 case "downgrade":
 return <ChangePlanDialog {...props} plans={plans} direction={action} />;
 case "transfer":
 return <TransferDialog {...props} />;
 case "renew":
 return <RenewDialog {...props} />;
 case "cancel":
 case "cancel-renewal":
 return <CancelDialog {...props} renewal={action === "cancel-renewal"} />;
 }
}
