"use client";

import * as React from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useAssignTrainer, useAssignableTrainers } from "@/lib/hooks/use-members";
import { useCreatePayment } from "@/lib/hooks/use-payments";
import { useCreatePtPackage, type PtPackage } from "@/lib/hooks/use-pt-packages";
import { formatMoney } from "@/lib/money";

import {
 ActionDialog,
 Field,
 PAYMENT_METHODS,
 type PaymentMethodValue,
 addDays,
 errorMessage,
 formatDay,
 parseDays,
} from "./action-dialog";

const NO_COACH = "__none";

export function CoachDialog({
 memberId,
 branchId,
 currentTrainerId,
 onDone,
 onOpenChange,
}: {
 memberId: string;
 branchId: string;
 currentTrainerId: string | null;
 onDone: () => Promise<unknown>;
 onOpenChange: (open: boolean) => void;
}) {
 const trainers = useAssignableTrainers(branchId);
 const assign = useAssignTrainer(memberId);
 const [value, setValue] = React.useState("");
 const options = (trainers.data ?? []).filter((t) => t.id !== currentTrainerId);
 const chosen = trainers.data?.find((t) => t.id === value);
 const changing = Boolean(currentTrainerId);

 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title={changing ? "Change PT" : "Assign PT"}
 description="The coach sees this member in their client list, and the change is kept in the member's history."
 confirmLabel={value === NO_COACH ? "Remove coach" : changing ? "Change coach" : "Assign coach"}
 destructive={value === NO_COACH}
 canConfirm={value !== ""}
 onConfirm={async () => {
 await assign.mutateAsync(value === NO_COACH ? null : value);
 await onDone();
 return value === NO_COACH ? "Coach removed" : `${chosen?.firstName ?? "Coach"} is now their coach`;
 }}
 >
 <Field
 id="coach"
 label="Coach"
 error={trainers.isError ? "Couldn't load the trainers" : null}
 help={
 trainers.isSuccess && options.length === 0
 ? `No ${changing ? "other " : ""}trainer works at this member's branch. Mark a staff member as a trainer on the Staff page.`
 : "Trainers at this member's branch"
 }
 >
 <Select value={value} onValueChange={setValue} disabled={trainers.isLoading}>
 <SelectTrigger id="coach" className="min-h-11 w-full">
 <SelectValue placeholder={trainers.isLoading ? "Loading trainers…" : "Choose a trainer"} />
 </SelectTrigger>
 <SelectContent>
 {options.map((t) => (
 <SelectItem key={t.id} value={t.id}>
 {t.firstName} {t.lastName}
 </SelectItem>
 ))}
 {changing ? <SelectItem value={NO_COACH}>No coach</SelectItem> : null}
 </SelectContent>
 </Select>
 </Field>
 </ActionDialog>
 );
}

/**
 * Sell a block of PT sessions, or the same block again. A payment taken
 * with it is recorded against the member through the ordinary payments
 * route, with the package named in its note.
 */
export function PtPackageDialog({
 memberId,
 branchId,
 currency,
 renewing,
 onDone,
 onOpenChange,
}: {
 memberId: string;
 branchId: string;
 currency: string;
 renewing: PtPackage | null;
 onDone: () => Promise<unknown>;
 onOpenChange: (open: boolean) => void;
}) {
 const create = useCreatePtPackage();
 const createPayment = useCreatePayment();
 const previousDays = renewing
 ? Math.max(1, Math.round((new Date(renewing.endDate).getTime() - new Date(renewing.startDate).getTime()) / 86_400_000))
 : 90;
 const [name, setName] = React.useState(renewing?.name ?? "10-session PT pack");
 const [sessionsValue, setSessionsValue] = React.useState(String(renewing?.totalSessions ?? 10));
 const [validityValue, setValidityValue] = React.useState(String(previousDays));
 const [priceValue, setPriceValue] = React.useState(renewing ? String(Number(renewing.price)) : "");
 const [paidValue, setPaidValue] = React.useState("");
 const [method, setMethod] = React.useState<PaymentMethodValue>("CASH");

 const sessions = parseDays(sessionsValue, 1, 500);
 const validity = parseDays(validityValue, 1, 730);
 const price = priceValue.trim() === "" ? null : Number(priceValue);
 const priceOk = price !== null && Number.isFinite(price) && price >= 0;
 const paid = paidValue.trim() === "" ? 0 : Number(paidValue);
 const paidOk = Number.isFinite(paid) && paid >= 0 && (!priceOk || paid <= price!);
 const start = new Date();
 const end = validity ? addDays(start.getTime(), validity) : null;
 const pkgCurrency = renewing?.currency ?? currency;

 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title={renewing ? "Renew PT package" : "Add PT package"}
 description={
 renewing
 ? `${renewing.name}: ${renewing.usedSessions} of ${renewing.totalSessions} sessions used, ends ${formatDay(renewing.endDate)}. The new block starts today.`
 : "Completed PT sessions draw from the package that expires first."
 }
 confirmLabel={renewing ? "Renew package" : "Add package"}
 canConfirm={name.trim() !== "" && sessions !== null && validity !== null && priceOk && paidOk}
 onConfirm={async () => {
 const pkg = await create.mutateAsync({
 memberId,
 branchId,
 ...(renewing?.templateId ? { templateId: renewing.templateId } : {}),
 name: name.trim(),
 totalSessions: sessions!,
 startDate: start.toISOString(),
 endDate: end!.toISOString(),
 price: price!,
 currency: pkgCurrency,
 });
 if (paid > 0) {
 try {
 await createPayment.mutateAsync({
 memberId,
 amount: paid,
 method,
 note: `PT package: ${pkg.name}`,
 });
 } catch (error) {
 // The package is sold either way; say plainly that the money
 // still has to be recorded, rather than failing the whole sale.
 await onDone();
 toast.error(`Package added, but the payment wasn't recorded: ${errorMessage(error, "try Collect")}`);
 return `${pkg.name} added`;
 }
 }
 await onDone();
 return paid > 0
 ? `${pkg.name} added and ${formatMoney(paid, pkgCurrency)} collected`
 : `${pkg.name} added`;
 }}
 >
 <Field id="pt-name" label="Package name">
 <Input id="pt-name" value={name} onChange={(e) => setName(e.target.value)} className="min-h-11" />
 </Field>
 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
 <Field id="pt-sessions" label="Sessions" error={sessions === null ? "1 to 500" : null}>
 <Input id="pt-sessions" inputMode="numeric" value={sessionsValue} onChange={(e) => setSessionsValue(e.target.value)} className="min-h-11" />
 </Field>
 <Field
 id="pt-validity"
 label="Valid for (days)"
 error={validity === null ? "1 to 730" : null}
 help={end ? `Until ${formatDay(end)}` : undefined}
 >
 <Input id="pt-validity" inputMode="numeric" value={validityValue} onChange={(e) => setValidityValue(e.target.value)} className="min-h-11" />
 </Field>
 </div>
 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
 <Field id="pt-price" label={`Price (${pkgCurrency})`} error={priceValue !== "" && !priceOk ? "Enter a price" : null}>
 <Input id="pt-price" inputMode="decimal" placeholder="0" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} className="min-h-11" />
 </Field>
 <Field id="pt-paid" label="Collected now" error={paidOk ? null : "Up to the price"} help="Optional">
 <Input id="pt-paid" inputMode="decimal" placeholder="0" value={paidValue} onChange={(e) => setPaidValue(e.target.value)} className="min-h-11" />
 </Field>
 </div>
 {paid > 0 ? (
 <Field id="pt-method" label="Payment method">
 <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethodValue)}>
 <SelectTrigger id="pt-method" className="min-h-11 w-full">
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
 ) : null}
 </ActionDialog>
 );
}
