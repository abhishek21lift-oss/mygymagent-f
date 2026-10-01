"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
 BadgeCheck,
 CalendarCheck,
 Flame,
 HeartPulse,
 MessageCircle,
 MessageSquareText,
 Dumbbell,
 Phone,
 PlayCircle,
 Plus,
 Snowflake,
 Sparkles,
 TrendingUp,
 Wallet,
 XCircle,
 Activity,
 CheckCircle2,
 Pencil,
 IndianRupee,
 MoreHorizontal,
 Copy,
 Mail,
 Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { ExerciseHistoryPanel } from "./exercise-history-panel";
import { RiskRecommendationsPanel } from "./risk-recommendations-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 Tabs,
 TabsContent,
 TabsList,
 TabsTrigger,
} from "@/components/ui/tabs";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useMember, useUpdateMember, useDeleteMember } from "@/lib/hooks/use-members";
import { useMemberWorkoutHistory } from "@/lib/hooks/use-workout-history";
import { useMemberAttendance } from "@/lib/hooks/use-member-attendance";
import { useMemberPayments } from "@/lib/hooks/use-member-payments";
import { useMemberMeasurements } from "@/lib/hooks/use-member-assessments";
import { useMemberGoals } from "@/lib/hooks/use-member-goals";
import { useMemberScreenings } from "@/lib/hooks/use-member-screenings";
import { Member360Tabs } from "./member-360-tabs";
import { MemberAiProgress } from "./member-ai-progress";
import { EntryAccessCard } from "./entry-access-card";
import { PortalAccessCard } from "./portal-access-card";
import {
 useCreateMembership,
 useFreezeMembership,
 useResumeMembership,
 useCancelMembership,
 useRenewMembership,
} from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { ApiError } from "@/lib/api/client";
import type { MembershipStatus } from "@/lib/types/gym";
import { useCreatePayment } from "@/lib/hooks/use-payments";
import {
 defaultPaymentMembership,
 membershipIdForPayment,
 NOT_FOR_MEMBERSHIP,
} from "@/lib/member-payments";
import { useQueryClient } from "@tanstack/react-query";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validation/gym";
import { formatMoney } from "@/lib/money";
import type { Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";
import {
 GlanceTile,
 ProfileSection,
 QuickAction,
 StatusPill,
 TermRing,
 accentVars,
 surfaceClass,
} from "./member-profile-parts";
import { initials, netPaid, termProgress, visitStreak, visitSummary } from "./member-profile-stats";
import { useBranches } from "@/lib/hooks/use-branches";
import { whatsappDrafts, whatsappLink, whatsappNumber } from "@/lib/whatsapp-link";

function SellMembershipDialog({ memberId, trigger }: { memberId: string; trigger?: React.ReactNode }) {
 const [open, setOpen] = React.useState(false);
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
 await createMembership.mutateAsync({
 memberId,
 membershipPlanId: planId,
 ...(discount > 0 ? { discount } : {}),
 });
 toast.success("Membership sold successfully");
 setOpen(false);
 setPlanId("");
 setDiscount(0);
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to sell membership");
 }
 }

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 {trigger ?? (
 <Button size="sm" className="btn-sheen min-h-11 rounded-lg bg-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Plus className="size-3.5" aria-hidden="true" />
 Sell Membership
 </Button>
 )}
 </DialogTrigger>
 <DialogContent className="border-border bg-card">
 <DialogHeader>
 <DialogTitle>Sell a Membership</DialogTitle>
 </DialogHeader>
 <Select value={planId} onValueChange={setPlanId}>
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Select a plan" />
 </SelectTrigger>
 <SelectContent>
 {plansQuery.data?.items.map((plan) => (
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

function CollectPaymentDialog({
 memberId,
 memberships,
 trigger,
}: {
 memberId: string;
 trigger?: React.ReactNode;
 memberships: Array<{
 id: string;
 status: string;
 startDate: string;
 endDate: string;
 membershipPlan?: { id: string; name: string; price: string };
 }>;
}) {
 const [open, setOpen] = React.useState(false);
 const queryClient = useQueryClient();
 const createPayment = useCreatePayment();
 const activeMemberships = memberships.filter(
 (m) => m.status === "ACTIVE" || m.status === "FROZEN"
 );

 const form = useForm<Omit<CreatePaymentInput, "memberId">>({
 resolver: zodResolver(createPaymentSchema.omit({ memberId: true })),
 defaultValues: {
 amount: 0,
 method: "CASH",
 membershipId: "",
 note: "",
 },
 });

 async function onSubmit(values: Omit<CreatePaymentInput, "memberId">) {
 try {
 await createPayment.mutateAsync({
 ...values,
 memberId,
 membershipId: membershipIdForPayment(values.membershipId),
 });
 toast.success("Payment collected successfully");
 setOpen(false);
 form.reset();
 queryClient.invalidateQueries({ queryKey: ["member-payments", memberId] });
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to collect payment");
 }
 }

 return (
 <Dialog
 open={open}
 onOpenChange={(next) => {
 setOpen(next);
 // Each opening starts on the membership the payment is most likely for.
 if (next) {
 form.reset({
 amount: 0,
 method: "CASH",
 membershipId: defaultPaymentMembership(activeMemberships),
 note: "",
 });
 } else {
 form.reset();
 }
 }}
 >
 <DialogTrigger asChild>
 {trigger ?? (
 <Button size="sm" className="min-h-11 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <IndianRupee className="size-3.5" aria-hidden="true" />
 Collect Payment
 </Button>
 )}
 </DialogTrigger>
 <DialogContent className="border-border bg-card">
 <DialogHeader>
 <DialogTitle>Collect Payment</DialogTitle>
 </DialogHeader>
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
 <FormField
 control={form.control}
 name="amount"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Amount</FormLabel>
 <FormControl>
 <Input
 type="number"
 step="0.01"
 placeholder="0.00"
 {...field}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="method"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Payment Method</FormLabel>
 <Select value={field.value} onValueChange={field.onChange}>
 <FormControl>
 <SelectTrigger className="w-full">
 <SelectValue />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="CASH">Cash</SelectItem>
 <SelectItem value="CARD">Card</SelectItem>
 <SelectItem value="UPI">UPI</SelectItem>
 <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
 <SelectItem value="OTHER">Other</SelectItem>
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />
 {activeMemberships.length > 0 && (
 <FormField
 control={form.control}
 name="membershipId"
 render={({ field }) => (
 <FormItem>
 <FormLabel>For</FormLabel>
 <Select value={field.value || NOT_FOR_MEMBERSHIP} onValueChange={field.onChange}>
 <FormControl>
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Select a membership" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 {activeMemberships.map((m) => (
 <SelectItem key={m.id} value={m.id}>
 {m.membershipPlan?.name || "Membership"} —{" "}
 {m.membershipPlan?.price || "—"}
 </SelectItem>
 ))}
 <SelectItem value={NOT_FOR_MEMBERSHIP}>
 Not a membership (PT, product, other)
 </SelectItem>
 </SelectContent>
 </Select>
 <FormDescription>
 A membership payment settles that membership&apos;s invoice.
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />
 )}
 <FormField
 control={form.control}
 name="note"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Note (optional)</FormLabel>
 <FormControl>
 <Input placeholder="PT session, product sale, ..." {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <DialogFooter>
 <Button
 type="submit"
 disabled={createPayment.isPending || !form.formState.isValid}
 >
 {createPayment.isPending ? "Collecting..." : "Collect Payment"}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}

function MembershipActions({
 membershipId,
 status,
}: {
 membershipId: string;
 status: MembershipStatus;
}) {
 const freeze = useFreezeMembership();
 const resume = useResumeMembership();
 const cancel = useCancelMembership();
 const renew = useRenewMembership();

 const [freezeOpen, setFreezeOpen] = React.useState(false);
 const [freezeDays, setFreezeDays] = React.useState(7);
 const [cancelOpen, setCancelOpen] = React.useState(false);
 const [cancelReason, setCancelReason] = React.useState("");

 const handle = (promise: Promise<unknown>, successMsg: string, close?: () => void) =>
 promise
 .then(() => {
 toast.success(successMsg);
 close?.();
 })
 .catch((e) => toast.error(e instanceof ApiError ? e.message : "Action failed"));

 // Only freeze/resume/renew/cancel have real backend support today
 // (see memberships.service.ts). Activate/Pause/Extend/Upgrade-Downgrade/
 // Transfer/Payment-failure were removed here because they called
 // endpoints that don't exist server-side; PAUSED is also not a status
 // the backend's MembershipStatus enum defines.
 const live = status === "ACTIVE" || status === "FROZEN";

 return (
 <div className="grid auto-cols-fr grid-flow-col gap-2">
 {status === "ACTIVE" && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => setFreezeOpen(true)}
 className="min-h-11 rounded-2xl"
 >
 <Snowflake className="size-3.5" />
 Freeze
 </Button>
 )}

 {status === "FROZEN" && (
 <Button
 variant="outline"
 size="sm"
 disabled={resume.isPending}
 onClick={() => handle(resume.mutateAsync(membershipId), "Membership resumed")}
 className="min-h-11 rounded-2xl"
 >
 <PlayCircle className="size-3.5" />
 Resume
 </Button>
 )}

 {live && (
 <>
 <Button
 variant="outline"
 size="sm"
 disabled={renew.isPending}
 onClick={() => handle(renew.mutateAsync({ id: membershipId }), "Membership renewed")}
 className="min-h-11 rounded-2xl"
 >
 <Sparkles className="size-3.5" />
 Renew
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setCancelOpen(true)}
 className="min-h-11 rounded-2xl text-destructive hover:text-destructive"
 >
 <XCircle className="size-3.5" />
 Cancel
 </Button>
 </>
 )}

 {/* Freeze dialog */}
 <Dialog open={freezeOpen} onOpenChange={setFreezeOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Freeze Membership</DialogTitle>
 </DialogHeader>
 <div className="space-y-3">
 <div>
 <Label>Freeze Days</Label>
 <Input
 type="number"
 min={1}
 value={freezeDays}
 onChange={(e) => setFreezeDays(Math.max(1, Number(e.target.value) || 1))}
 className="mt-1"
 />
 <p className="mt-1 text-xs text-stone-600">
 Frozen days are added back to the end date on resume. Counts against the plan freeze quota.
 </p>
 </div>
 </div>
 <DialogFooter>
 <Button
 disabled={freeze.isPending}
 onClick={() =>
 handle(
 freeze.mutateAsync({ id: membershipId, days: freezeDays }),
 `Membership frozen for ${freezeDays} days`,
 () => setFreezeOpen(false)
 )
 }
 >
 {freeze.isPending ? "Freezing..." : "Freeze"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Cancel dialog */}
 <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Cancel Membership</DialogTitle>
 </DialogHeader>
 <div className="space-y-3">
 <div>
 <Label>Reason (optional)</Label>
 <Textarea
 value={cancelReason}
 onChange={(e) => setCancelReason(e.target.value)}
 placeholder="Why is this membership being cancelled?"
 className="mt-1"
 />
 </div>
 </div>
 <DialogFooter>
 <Button
 variant="destructive"
 disabled={cancel.isPending}
 onClick={() =>
 handle(
 cancel.mutateAsync({ id: membershipId, reason: cancelReason || undefined }), "Membership cancelled",
 () => {
 setCancelOpen(false);
 setCancelReason("");
 }
 )
 }
 >
 {cancel.isPending ? "Cancelling..." : "Cancel Membership"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}

function WorkoutProgress({ memberId }: { memberId: string }) {
 const history = useMemberWorkoutHistory(memberId, 12);
 const sessions = history.data ?? [];
 const completed = sessions.filter((session) => session.status === "COMPLETED");
 const totalVolume = completed.reduce(
 (sum, session) => sum + Number(session.volumeKg ?? 0),
 0
 );
 const last = completed[0];

 if (history.isLoading)
 return (
 <div className="grid gap-3 sm:grid-cols-3">
 {[1, 2, 3].map((item) => (
 <Skeleton key={item} className="h-20 rounded-lg" />
 ))}
 </div>
 );

 if (history.isError)
 return (
 <ErrorState
 message="Unable to load workout history."
 onRetry={() => history.refetch()}
 />
 );

 if (!sessions.length)
 return (
 <EmptyState
 title="No workout history yet"
 />
 );

 return (
 // A container query, not a viewport breakpoint. These three sit inside
 // a card in a four-across grid, so at a 1512px viewport the card itself is
 // only ~180px wide — but `sm:grid-cols-3` keys off the viewport and fired
 // anyway, squeezing the labels to "Compl… Sessi…" and "Logg… Volur". A stat
 // is unreadable at that width, and the part that survived was the number,
 // which is the part that means nothing alone. `@lg` (32rem) is the first
 // container width where three across is actually comfortable.
 <div className="@container">
 <div className="grid gap-3 @lg:grid-cols-3">
 <ProgressStat
 icon={CheckCircle2}
 label="Completed Sessions"
 value={String(completed.length)}
 color="text-emerald-500"
 />
 <ProgressStat
 icon={TrendingUp}
 label="Logged Volume"
 value={
 totalVolume > 0
 ? `${Math.round(totalVolume).toLocaleString()} kg`
 : "—"
 }
 color="text-blue-500"
 />
 <ProgressStat
 icon={Activity}
 label="Last Workout"
 value={last ? new Date(last.sessionDate).toLocaleDateString() : "—"}
 color="text-violet-500"
 />
 </div>
 </div>
 );
}

function ProgressStat({
 icon: Icon,
 label,
 value,
 color = "text-primary",
}: {
 icon: typeof Activity;
 label: string;
 value: string;
 color?: string;
}) {
 return (
 <div className="rounded-2xl bg-muted/50 p-4">
 <div>
 <Icon className={`size-5 ${color}`} aria-hidden="true" />
 <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
 <p className="mt-0.5 text-xs font-medium text-muted-foreground">
 {label}
 </p>
 </div>
 </div>
 );
}

const editMemberSchema = z.object({
 firstName: z.string().min(1, "First name is required"),
 lastName: z.string().min(1, "Last name is required"),
 email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
 phone: z.string().optional().or(z.literal("")),
 dateOfBirth: z.string().optional().or(z.literal("")),
 gender: z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]).optional(),
 memberType: z.enum(["GYM", "PT", "GYM_PT"]).optional(),
 addressLine1: z.string().optional(),
 addressLine2: z.string().optional(),
 city: z.string().optional(),
 state: z.string().optional(),
 postalCode: z.string().optional(),
 country: z.string().optional(),
 emergencyContactName: z.string().optional(),
 emergencyContactPhone: z.string().optional(),
 emergencyContactRelationship: z.string().optional(),
 fitnessGoal: z.string().optional(),
 injuries: z.string().optional(),
 allergies: z.string().optional(),
 medicalNotes: z.string().optional(),
 notes: z.string().optional(),
 assignedTrainerId: z.string().optional(),
 primaryBranchId: z.string().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

function EditMemberDialog({
 member,
 children,
}: {
 member: MemberWithMemberships;
 children: React.ReactNode;
}) {
 const [open, setOpen] = React.useState(false);
 const updateMember = useUpdateMember(member.id);

 const form = useForm<EditMemberFormData>({
 resolver: zodResolver(editMemberSchema),
 defaultValues: {
 firstName: member.firstName,
 lastName: member.lastName,
 email: member.email ?? "",
 phone: member.phone ?? "",
 dateOfBirth: member.dateOfBirth ?? "",
 gender: (member.gender as EditMemberFormData["gender"]) ?? undefined,
 memberType: (member.memberType as EditMemberFormData["memberType"]) ?? undefined,
 addressLine1: member.addressLine1 ?? "",
 addressLine2: member.addressLine2 ?? "",
 city: member.city ?? "",
 state: member.state ?? "",
 postalCode: member.postalCode ?? "",
 country: member.country ?? "",
 emergencyContactName: member.emergencyContactName ?? "",
 emergencyContactPhone: member.emergencyContactPhone ?? "",
 emergencyContactRelationship: member.emergencyContactRelationship ?? "",
 fitnessGoal: member.fitnessGoal ?? "",
 injuries: member.injuries ?? "",
 allergies: member.allergies ?? "",
 medicalNotes: member.medicalNotes ?? "",
 notes: member.notes ?? "",
 assignedTrainerId: member.assignedTrainerId ?? "",
 primaryBranchId: member.primaryBranchId ?? "",
 },
 });

 async function onSubmit(values: EditMemberFormData) {
 try {
 await updateMember.mutateAsync(values);
 toast.success("Member updated successfully");
 setOpen(false);
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to update member");
 }
 }

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>{children}</DialogTrigger>
 <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card">
 <DialogHeader>
 <DialogTitle className="font-semibold text-xl tracking-tight">Edit Member</DialogTitle>
 </DialogHeader>
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
 <Tabs defaultValue="personal" className="w-full">
 <TabsList className="grid h-auto w-full grid-cols-5 rounded-lg border border-violet-100/70 bg-muted/40 p-1.5">
 <TabsTrigger value="personal" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Personal</TabsTrigger>
 <TabsTrigger value="address" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Address</TabsTrigger>
 <TabsTrigger value="emergency" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Emergency</TabsTrigger>
 <TabsTrigger value="fitness" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Fitness</TabsTrigger>
 <TabsTrigger value="assignment" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Assignment</TabsTrigger>
 </TabsList>

 <TabsContent value="personal" className="space-y-4 pt-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="firstName"
 render={({ field }) => (
 <FormItem>
 <FormLabel>First Name *</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="lastName"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Last Name *</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="email"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Email</FormLabel>
 <FormControl>
 <Input type="email" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="phone"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Phone</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="dateOfBirth"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Date of Birth</FormLabel>
 <FormControl>
 <Input type="date" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="gender"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Gender</FormLabel>
 <Select
 value={field.value ?? ""}
 onValueChange={field.onChange}
 >
 <FormControl>
 <SelectTrigger>
 <SelectValue placeholder="Select gender" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="MALE">Male</SelectItem>
 <SelectItem value="FEMALE">Female</SelectItem>
 <SelectItem value="OTHER">Other</SelectItem>
 <SelectItem value="UNDISCLOSED">Prefer not to say</SelectItem>
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 <FormField
 control={form.control}
 name="memberType"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Member Type</FormLabel>
 <Select
 value={field.value ?? ""}
 onValueChange={field.onChange}
 >
 <FormControl>
 <SelectTrigger>
 <SelectValue placeholder="Select member type" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="GYM">Gym</SelectItem>
 <SelectItem value="PT">Personal Training</SelectItem>
 <SelectItem value="GYM_PT">Gym + PT</SelectItem>
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />
 </TabsContent>

 <TabsContent value="address" className="space-y-4 pt-4">
 <FormField
 control={form.control}
 name="addressLine1"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Address Line 1</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="addressLine2"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Address Line 2</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="city"
 render={({ field }) => (
 <FormItem>
 <FormLabel>City</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="state"
 render={({ field }) => (
 <FormItem>
 <FormLabel>State</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="postalCode"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Postal Code</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="country"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Country</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 </TabsContent>

 <TabsContent value="emergency" className="space-y-4 pt-4">
 <FormField
 control={form.control}
 name="emergencyContactName"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Emergency Contact Name</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="emergencyContactPhone"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Emergency Contact Phone</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="emergencyContactRelationship"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Relationship</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </TabsContent>

 <TabsContent value="fitness" className="space-y-4 pt-4">
 <FormField
 control={form.control}
 name="fitnessGoal"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Fitness Goal</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="injuries"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Injuries</FormLabel>
 <FormControl>
 <Textarea {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="allergies"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Allergies</FormLabel>
 <FormControl>
 <Textarea {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="medicalNotes"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Medical Notes</FormLabel>
 <FormControl>
 <Textarea {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </TabsContent>

 <TabsContent value="assignment" className="space-y-4 pt-4">
 <FormField
 control={form.control}
 name="assignedTrainerId"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Assigned Trainer ID</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="primaryBranchId"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Primary Branch ID</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="notes"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Notes</FormLabel>
 <FormControl>
 <Textarea {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </TabsContent>
 </Tabs>
 <DialogFooter>
 <Button
 type="submit"
 className="w-full sm:w-auto"
 disabled={updateMember.isPending}
 >
 {updateMember.isPending ? "Saving..." : "Save Changes"}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}

interface MemberWithMemberships {
 id: string;
 firstName: string;
 lastName: string;
 memberCode: string;
 status: string;
 memberType: string | null;
 email: string | null;
 phone: string | null;
 joinedAt: string;
 dateOfBirth: string | null;
 gender: string | null;
 addressLine1: string | null;
 addressLine2: string | null;
 city: string | null;
 state: string | null;
 postalCode: string | null;
 country: string | null;
 emergencyContactName: string | null;
 emergencyContactPhone: string | null;
 emergencyContactRelationship: string | null;
 fitnessGoal: string | null;
 injuries: string | null;
 allergies: string | null;
 medicalNotes: string | null;
 notes: string | null;
 assignedTrainerId: string | null;
 primaryBranchId: string | null;
 assignedTrainer: { id: string; firstName: string; lastName: string } | null;
 memberships: Array<{
 id: string;
 status: string;
 startDate: string;
 endDate: string;
 membershipPlan?: { id: string; name: string; price: string };
 }>;
 /** The member's portal login, when one has been granted. */
 user?: {
 id: string;
 email: string;
 status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
 } | null;
}


type MembershipSummary = MemberWithMemberships["memberships"][number];

const HUES: readonly Accent[] = ["blue", "violet", "rose", "emerald", "amber", "cyan", "indigo", "orange"];

/** A colour of the member's own, as iOS gives each contact -- stable for a
 * given member, so the same person always wears the same hue. */
function memberHue(id: string): Accent {
 let hash = 0;
 for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
 return HUES[Math.abs(hash) % HUES.length];
}

function statusAccent(status: string): Accent {
 if (status === "ACTIVE") return "emerald";
 if (status === "FROZEN") return "cyan";
 if (status === "INACTIVE" || status === "PENDING") return "amber";
 return "rose";
}

function membershipAccent(membership: MembershipSummary, daysLeft: number | null): Accent {
 if (membership.status === "FROZEN") return "cyan";
 if (daysLeft === null || daysLeft > 7) return "emerald";
 return daysLeft > 0 ? "amber" : "rose";
}

function titleCase(value: string): string {
 return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatDate(iso: string, withYear = true): string {
 return new Date(iso).toLocaleDateString(undefined, {
 day: "numeric",
 month: "short",
 ...(withYear ? { year: "numeric" } : {}),
 });
}

function MemberHero({
 member,
 activeMembership,
 daysLeft,
}: {
 member: MemberWithMemberships;
 activeMembership: MembershipSummary | undefined;
 daysLeft: number | null;
}) {
 const router = useRouter();
 const { hasPermission, user } = useAuth();
 const deleteMember = useDeleteMember();
 const [deleteOpen, setDeleteOpen] = React.useState(false);
 const branches = useBranches({ pageSize: 100 });
 const branch = branches.data?.items.find((b) => b.id === member.primaryBranchId);

 async function handleDelete() {
 try {
 await deleteMember.mutateAsync(member.id);
 toast.success(`${member.firstName} ${member.lastName} has been deleted`);
 setDeleteOpen(false);
 router.push("/members");
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to delete member");
 }
 }

 const hue = memberHue(member.id);
 const phone = member.phone?.trim() || null;
 const waNumber = whatsappNumber(phone, branch?.country);
 const drafts = whatsappDrafts({
 firstName: member.firstName,
 staffFirstName: user?.firstName,
 branchName: branch?.name,
 planName: activeMembership?.membershipPlan?.name,
 endDate: activeMembership?.endDate,
 daysLeft,
 });
 const email = member.email?.trim() || null;
 const meta = [
 `#${member.memberCode}`,
 `Joined ${new Date(member.joinedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`,
 member.assignedTrainer ? `Coach ${member.assignedTrainer.firstName}` : null,
 ].filter(Boolean);

 return (
 <section
 aria-labelledby="member-title"
 style={accentVars(hue)}
 className={cn(surfaceClass, "relative isolate overflow-hidden")}
 >
 {/* The member's colour, as a band across the top of the card. The
 highlight is what makes it read as glass rather than a flat fill. */}
 <div
 aria-hidden="true"
 className="h-24 sm:h-28"
 style={{ backgroundImage: "radial-gradient(90% 160% at 100% 0%, var(--t) 0%, transparent 60%), linear-gradient(135deg, var(--t-g1), var(--t-g2))" }}
 >
 <div className="size-full bg-[radial-gradient(70%_130%_at_15%_0%,rgb(255_255_255/0.32),transparent_60%)]" />
 </div>

 <div className="px-4 pb-5 sm:px-6 sm:pb-6">
 <div className="-mt-12 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
 <div className="relative shrink-0">
 <div
 className="flex size-24 items-center justify-center rounded-full text-[34px] font-semibold tracking-tight text-white shadow-lg shadow-black/15 ring-4 ring-card"
 style={{ backgroundImage: "linear-gradient(160deg, var(--t), var(--t-g1))" }}
 aria-hidden="true"
 >
 {initials(member.firstName, member.lastName)}
 </div>
 <span
 aria-hidden="true"
 style={accentVars(statusAccent(member.status))}
 className="absolute bottom-1 right-1 size-5 rounded-full bg-[var(--t)] ring-[3px] ring-card"
 />
 </div>
 <div className="min-w-0 flex-1 sm:pt-[3.75rem]">
 <h1 id="member-title" className="text-balance text-[26px] font-semibold leading-tight tracking-tight text-foreground sm:text-[30px] [overflow-wrap:anywhere]">
 {member.firstName} {member.lastName}
 </h1>
 <p className="mt-1 text-sm text-muted-foreground">{meta.join(" · ")}</p>
 <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
 <StatusPill accent={statusAccent(member.status)}>{titleCase(member.status)}</StatusPill>
 {activeMembership ? (
 <StatusPill accent={membershipAccent(activeMembership, daysLeft)}>
 {activeMembership.membershipPlan?.name ?? "Membership"}
 {daysLeft !== null ? ` · ${daysLeft}d left` : null}
 </StatusPill>
 ) : (
 <StatusPill accent="amber">No active membership</StatusPill>
 )}
 </div>
 </div>
 </div>

 <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex justify-center gap-1 sm:justify-start" role="group" aria-label="Contact and manage">
 <QuickAction
 accent="cyan"
 icon={Phone}
 label="Call"
 href={phone ? `tel:${phone}` : undefined}
 disabled={!phone}
 disabledReason="no phone number"
 />
 {/* Click-to-chat: opens WhatsApp on this device with a message
 typed, for the staff member to send themselves. Free, and none of
 the ban risk of automating a number. */}
 {waNumber ? (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <QuickAction accent="emerald" icon={MessageCircle} label="WhatsApp" aria-label="WhatsApp" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="center" className="w-56">
 <DropdownMenuLabel>Open WhatsApp with…</DropdownMenuLabel>
 <DropdownMenuSeparator />
 {drafts.map((draft) => (
 <DropdownMenuItem key={draft.id} asChild>
 <a href={whatsappLink(waNumber, draft.text)} target="_blank" rel="noopener noreferrer">
 {draft.label}
 </a>
 </DropdownMenuItem>
 ))}
 <DropdownMenuItem asChild>
 <a href={whatsappLink(waNumber)} target="_blank" rel="noopener noreferrer">
 A blank message
 </a>
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 ) : (
 <QuickAction
 accent="emerald"
 icon={MessageCircle}
 label="WhatsApp"
 disabled
 disabledReason={phone ? "save the number with its country code" : "no phone number"}
 />
 )}
 <QuickAction
 accent="violet"
 icon={Mail}
 label="Email"
 href={email ? `mailto:${email}` : undefined}
 disabled={!email}
 disabledReason="no email address"
 />
 <EditMemberDialog member={member}>
 <QuickAction accent="amber" icon={Pencil} label="Edit" />
 </EditMemberDialog>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <QuickAction accent="indigo" icon={MoreHorizontal} label="More" aria-label="More actions" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuLabel>Member actions</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={async () => {
 try {
 await navigator.clipboard.writeText(member.memberCode);
 toast.success("Member code copied");
 } catch {
 toast.error("Couldn't copy -- your browser blocked clipboard access");
 }
 }}
 >
 <Copy className="mr-2 size-3.5" />
 Copy member code
 </DropdownMenuItem>
 {phone ? (
 <DropdownMenuItem asChild>
 <a href={`sms:${phone}`}>
 <MessageSquareText className="mr-2 size-3.5" />
 Send an SMS
 </a>
 </DropdownMenuItem>
 ) : null}
 {hasPermission("members.delete") && (
 <>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={() => setDeleteOpen(true)}
 className="text-destructive focus:text-destructive"
 >
 <Trash2 className="mr-2 size-3.5" />
 Delete member
 </DropdownMenuItem>
 </>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 <div className="grid grid-cols-2 gap-2 sm:flex">
 <CollectPaymentDialog
 memberId={member.id}
 memberships={member.memberships}
 trigger={
 <Button
 style={accentVars("emerald")}
 className="h-12 rounded-2xl px-5 text-[15px] font-semibold text-white shadow-md shadow-emerald-900/10 transition active:scale-[0.98] [background-image:linear-gradient(135deg,var(--t-g1),var(--t-g2))] hover:brightness-110"
 >
 <IndianRupee className="size-4" aria-hidden="true" />
 Collect
 </Button>
 }
 />
 <SellMembershipDialog
 memberId={member.id}
 trigger={
 <Button className="h-12 rounded-2xl px-5 text-[15px] font-semibold shadow-md shadow-primary/15 transition active:scale-[0.98]">
 <Plus className="size-4" aria-hidden="true" />
 Sell plan
 </Button>
 }
 />
 </div>
 </div>
 </div>

 <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Delete member</DialogTitle>
 </DialogHeader>
 <p className="text-sm text-muted-foreground">
 {member.firstName} {member.lastName} will be marked inactive and removed from active
 member views. Their membership, payment, and activity history is preserved and this
 can be reversed by support if needed.
 </p>
 <DialogFooter>
 <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteMember.isPending}>
 Cancel
 </Button>
 <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleteMember.isPending}>
 {deleteMember.isPending ? "Deleting..." : "Delete member"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </section>
 );
}

function MembershipCard({
 member,
 activeMembership,
 daysLeft,
 now,
}: {
 member: MemberWithMemberships;
 activeMembership: MembershipSummary | undefined;
 daysLeft: number | null;
 now: number;
}) {
 const lastEnded = activeMembership
 ? undefined
 : [...member.memberships].sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
 const accent = activeMembership ? membershipAccent(activeMembership, daysLeft) : "amber";

 return (
 <ProfileSection
 id="membership-title"
 title="Membership"
 icon={BadgeCheck}
 accent={accent}
 action={
 activeMembership ? (
 <StatusPill accent={accent}>{titleCase(activeMembership.status)}</StatusPill>
 ) : null
 }
 >
 {activeMembership ? (
 <>
 <div className="flex items-center gap-5">
 <TermRing
 accent={accent}
 daysLeft={daysLeft ?? 0}
 remaining={1 - termProgress(activeMembership.startDate, activeMembership.endDate, now)}
 />
 <div className="min-w-0 flex-1">
 <p className="text-lg font-semibold tracking-tight text-foreground [overflow-wrap:anywhere]">
 {activeMembership.membershipPlan?.name ?? "Membership"}
 </p>
 <dl className="mt-2 space-y-1 text-sm">
 <div className="flex justify-between gap-3">
 <dt className="text-muted-foreground">Started</dt>
 <dd className="font-medium tabular-nums text-foreground">{formatDate(activeMembership.startDate)}</dd>
 </div>
 <div className="flex justify-between gap-3">
 <dt className="text-muted-foreground">Ends</dt>
 <dd className="font-medium tabular-nums text-foreground">{formatDate(activeMembership.endDate)}</dd>
 </div>
 </dl>
 </div>
 </div>
 <div className="mt-5">
 <MembershipActions
 membershipId={activeMembership.id}
 status={activeMembership.status as MembershipStatus}
 />
 </div>
 </>
 ) : (
 <div className="text-center">
 <p className="font-medium text-foreground">No active membership</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {lastEnded
 ? `${lastEnded.membershipPlan?.name ?? "Last plan"} ended ${formatDate(lastEnded.endDate)}.`
 : "Sell a plan to get them started."}
 </p>
 <div className="mt-4">
 <SellMembershipDialog
 memberId={member.id}
 trigger={
 <Button className="h-11 w-full rounded-2xl font-semibold">
 <Plus className="size-4" aria-hidden="true" />
 Sell a plan
 </Button>
 }
 />
 </div>
 </div>
 )}
 {member.memberships.length > 1 ? (
 <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
 {member.memberships.length} memberships on record -- see the Memberships tab below.
 </p>
 ) : null}
 </ProfileSection>
 );
}

function GlanceRow({ memberId }: { memberId: string }) {
 const attendance = useMemberAttendance(memberId);
 const payments = useMemberPayments(memberId);
 const screenings = useMemberScreenings(memberId);
 const measurements = useMemberMeasurements(memberId);
 const goals = useMemberGoals(memberId);
 const [now] = React.useState(() => new Date());

 const checkIns = (attendance.data ?? []).map((row) => row.checkInAt);
 const visits = visitSummary(checkIns, now);
 const streak = visitStreak(checkIns, now);
 const lastVisit = checkIns.reduce<string | null>((latest, iso) => (!latest || iso > latest ? iso : latest), null);
 const paid = netPaid(payments.data ?? []);

 const latestScreening = screenings.data?.[0];
 const flagged = latestScreening
 ? latestScreening.flaggedForMedicalClearance ||
 Object.values(latestScreening.responses ?? {}).some((answer) => answer === true)
 : false;
 const latestWeight = [...(measurements.data ?? [])]
 .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
 .find((row) => row.weightKg != null)?.weightKg;
 const activeGoals = goals.data?.filter((goal) => goal.status === "ACTIVE").length ?? 0;
 const healthCaption = [
 latestWeight != null ? `${latestWeight} kg` : null,
 activeGoals ? `${activeGoals} active goal${activeGoals === 1 ? "" : "s"}` : null,
 ].filter(Boolean).join(" · ");

 return (
 <section aria-label="At a glance" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
 <GlanceTile
 accent="cyan"
 icon={CalendarCheck}
 label="Visits"
 isLoading={attendance.isLoading}
 value={attendance.isError ? "—" : visits.thisMonth}
 caption={attendance.isError ? "Couldn't load visits" : `This month · ${visits.last30Days} in 30 days`}
 />
 <GlanceTile
 accent="orange"
 icon={Flame}
 label="Streak"
 isLoading={attendance.isLoading}
 value={attendance.isError ? "—" : `${streak} ${streak === 1 ? "day" : "days"}`}
 caption={
 attendance.isError
 ? "Couldn't load visits"
 : lastVisit
 ? `Last visit ${formatDate(lastVisit, false)}`
 : "No visits yet"
 }
 />
 <GlanceTile
 accent="emerald"
 icon={Wallet}
 label="Paid"
 isLoading={payments.isLoading}
 value={payments.isError ? "—" : paid.currency ? formatMoney(paid.amount, paid.currency, { whole: true }) : "—"}
 caption={
 payments.isError
 ? "Couldn't load payments"
 : paid.completed + paid.refunded === 0
 ? "No payments yet"
 : [
 `${paid.completed} payment${paid.completed === 1 ? "" : "s"}`,
 paid.refunded ? `${paid.refunded} refunded` : null,
 ].filter(Boolean).join(" · ")
 }
 />
 <GlanceTile
 accent={flagged ? "rose" : "blue"}
 icon={HeartPulse}
 label="Health"
 isLoading={screenings.isLoading || measurements.isLoading || goals.isLoading}
 value={screenings.isError || !latestScreening ? "—" : flagged ? "Flagged" : "Cleared"}
 caption={
 screenings.isError
 ? "Couldn't load screening"
 : !latestScreening
 ? "Not screened yet"
 : healthCaption || (flagged ? "Needs medical clearance" : `Screened ${formatDate(latestScreening.completedAt, false)}`)
 }
 />
 </section>
 );
}

export function MemberDetailView({ memberId }: { memberId: string }) {
 const memberQuery = useMember(memberId);
 const [now] = React.useState(() => Date.now());

 if (memberQuery.isLoading)
 return (
 <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading member">
 <Skeleton className="h-[292px] w-full rounded-3xl sm:h-[236px]" />
 <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
 {[0, 1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-[122px] rounded-3xl" />
 ))}
 </div>
 <Skeleton className="h-64 w-full rounded-3xl" />
 </div>
 );

 if (memberQuery.isError || !memberQuery.data)
 return (
 <ErrorState
 message="Member not found or you don't have access."
 onRetry={() => memberQuery.refetch()}
 />
 );

 const member = memberQuery.data as unknown as MemberWithMemberships;
 const activeMembership = member.memberships.find(
 (m) => m.status === "ACTIVE" || m.status === "FROZEN"
 );
 const daysLeft = activeMembership
 ? Math.max(0, Math.ceil((new Date(activeMembership.endDate).getTime() - now) / 86400000))
 : null;

 return (
 // Mobile first: one column, in the order a front desk needs it -- who,
 // how they're doing, their plan, then the detail. From lg the plan and
 // access cards move into a side column beside training.
 <div className="flex flex-col gap-4 pt-2 sm:gap-5 lg:gap-6">
 <MemberHero member={member} activeMembership={activeMembership} daysLeft={daysLeft} />

 <GlanceRow memberId={memberId} />

 <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:gap-6">
 <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-6">
 <MembershipCard member={member} activeMembership={activeMembership} daysLeft={daysLeft} now={now} />
 {/* Every credential that opens the door, in one place */}
 <EntryAccessCard memberId={memberId} branchId={member.primaryBranchId} />
 {/* Whether this member can sign in to the app at all */}
 <PortalAccessCard member={member} />
 </div>

 <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-6">
 <ProfileSection id="training-title" title="Training" icon={Dumbbell} accent="violet">
 <WorkoutProgress memberId={memberId} />
 {/* Directly under the session totals: those say how much work was
 done, this says whether it is getting heavier. */}
 <div className="mt-4">
 <ExerciseHistoryPanel memberId={memberId} />
 </div>
 </ProfileSection>
 {/* The engine's risk score, its reasons, and the actions it proposes. */}
 <RiskRecommendationsPanel memberId={memberId} />
 <MemberAiProgress memberId={memberId} />
 </div>
 </div>

 <section aria-label="Member records" className={cn(surfaceClass, "p-3 sm:p-6")}>
 <Member360Tabs memberId={memberId} />
 </section>
 </div>
 );
}
