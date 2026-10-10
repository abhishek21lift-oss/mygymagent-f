"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
 BadgeCheck,
 CalendarCheck,
 Flame,
 HeartPulse,
 MessageCircle,
 MessageSquareText,
 Dumbbell,
 Phone,
 Plus,
 TrendingUp,
 Wallet,
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
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMember, useDeleteMember } from "@/lib/hooks/use-members";
import { useMemberWorkoutHistory } from "@/lib/hooks/use-workout-history";
import { useMemberAttendance } from "@/lib/hooks/use-member-attendance";
import { useMemberPayments } from "@/lib/hooks/use-member-payments";
import { useMemberMeasurements } from "@/lib/hooks/use-member-assessments";
import { useMemberGoals } from "@/lib/hooks/use-member-goals";
import { useMemberScreenings } from "@/lib/hooks/use-member-screenings";
import { Member360Tabs } from "./member-360-tabs";
import { useProfilePhotoUrl } from "./edit/profile-photo-section";
import { SellMembershipDialog } from "./sell-membership-dialog";
import { MemberActionsPanel } from "./actions/member-actions-panel";
import { MemberAiProgress } from "./member-ai-progress";
import { EntryAccessCard } from "./entry-access-card";
import { PortalAccessCard } from "./portal-access-card";
import { ApiError } from "@/lib/api/client";
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

export interface MemberWithMemberships {
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
 const photoUrl = useProfilePhotoUrl(member.id);
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
 {photoUrl ? (
 // eslint-disable-next-line @next/next/no-img-element -- signed document URL
 <img
 src={photoUrl}
 alt={`${member.firstName} ${member.lastName}`}
 className="size-24 rounded-full object-cover shadow-lg shadow-black/15 ring-4 ring-card"
 />
 ) : (
 <div
 className="flex size-24 items-center justify-center rounded-full text-[34px] font-semibold tracking-tight text-white shadow-lg shadow-black/15 ring-4 ring-card"
 style={{ backgroundImage: "linear-gradient(160deg, var(--t), var(--t-g1))" }}
 aria-hidden="true"
 >
 {initials(member.firstName, member.lastName)}
 </div>
 )}
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
 <QuickAction accent="amber" icon={Pencil} label="Edit" href={`/members/${member.id}/edit`} />
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
 </>
 ) : (
 <div className="text-center">
 <p className="font-medium text-foreground">No active membership</p>
 <p className="mt-1 text-sm text-muted-foreground">
 {lastEnded
 ? `${lastEnded.membershipPlan?.name ?? "Last plan"} ended ${formatDate(lastEnded.endDate)}.`
 : "Sell a plan to get them started."}
 </p>
 {/* Selling is under Actions, with renewing the last plan. */}
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
 const [recordsTab, setRecordsTab] = React.useState("overview");
 const recordsRef = React.useRef<HTMLElement>(null);
 const openPtHistory = React.useCallback(() => {
 setRecordsTab("pt-sessions");
 recordsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
 }, []);

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

 <MemberActionsPanel member={member} onOpenPtHistory={openPtHistory} />

 <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:gap-6">
 <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:gap-6">
 <MembershipCard member={member} activeMembership={activeMembership} daysLeft={daysLeft} now={now} />
 {/* Every credential that opens the door, in one place */}
 <EntryAccessCard
 memberId={memberId}
 memberName={`${member.firstName} ${member.lastName}`.trim()}
 branchId={member.primaryBranchId}
 />
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

 <section ref={recordsRef} aria-label="Member records" className={cn(surfaceClass, "scroll-mt-4 p-3 sm:p-6")}>
 <Member360Tabs memberId={memberId} value={recordsTab} onValueChange={setRecordsTab} />
 </section>
 </div>
 );
}
