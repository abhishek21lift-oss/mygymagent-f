"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
 ArrowLeftRight,
 BadgeCheck,
 CalendarCheck,
 CalendarPlus,
 CalendarX,
 CheckCircle2,
 ChevronRight,
 CircleArrowDown,
 CircleArrowUp,
 CreditCard,
 Dumbbell,
 History,
 PackagePlus,
 PlayCircle,
 Plus,
 RefreshCw,
 RotateCw,
 Snowflake,
 Sparkles,
 Sun,
 UserCog,
 UserPlus,
 UserX,
 XCircle,
 Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppointments, type Appointment } from "@/lib/hooks/use-appointments";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { useMemberships } from "@/lib/hooks/use-memberships";
import { usePtPackages } from "@/lib/hooks/use-pt-packages";
import type { Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";

import { GlyphBadge, accentVars, surfaceClass } from "../member-profile-parts";
import { SellMembershipDialog } from "../sell-membership-dialog";
import { useRefreshMember } from "./action-dialog";
import {
 memberActionGroups,
 type MemberAction,
 type MemberActionGroup,
 type MemberActionId,
} from "./member-action-state";
import { MembershipActionDialog } from "./membership-action-dialogs";
import { CoachDialog, PtPackageDialog } from "./training-action-dialogs";
import { BookTrialDialog, TrialOutcomeDialog, useCloseConvertedTrial } from "./trial-action-dialogs";

export interface ActionMember {
 id: string;
 firstName: string;
 lastName: string;
 primaryBranchId: string | null;
 assignedTrainerId: string | null;
 assignedTrainer: { id: string; firstName: string; lastName: string } | null;
}

const ICONS: Record<MemberActionId, LucideIcon> = {
 activate: PlayCircle,
 freeze: Snowflake,
 resume: Sun,
 extend: CalendarPlus,
 upgrade: CircleArrowUp,
 downgrade: CircleArrowDown,
 transfer: ArrowLeftRight,
 renew: RefreshCw,
 cancel: XCircle,
 "cancel-renewal": CalendarX,
 sell: Plus,
 "assign-coach": UserPlus,
 "change-coach": UserCog,
 "add-pt-package": PackagePlus,
 "renew-pt": RotateCw,
 "pt-history": History,
 "book-trial": CalendarCheck,
 "trial-attended": CheckCircle2,
 "trial-no-show": UserX,
 "convert-trial": BadgeCheck,
};

const GROUP_LOOK: Record<MemberActionGroup["id"], { icon: LucideIcon; accent: Accent; empty: string }> = {
 membership: { icon: CreditCard, accent: "emerald", empty: "Nothing to change on the membership right now." },
 training: { icon: Dumbbell, accent: "violet", empty: "No training actions for your role." },
 trial: { icon: Sparkles, accent: "rose", empty: "Trials are for people who haven't joined yet." },
};

function ActionRow({ action, onSelect }: { action: MemberAction; onSelect: () => void }) {
 const Icon = ICONS[action.id];
 return (
 <li>
 <button
 type="button"
 onClick={onSelect}
 className={cn(
 "group flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition",
 "hover:bg-[var(--t-tint)] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]",
 )}
 >
 <span
 aria-hidden="true"
 className={cn(
 "flex size-9 shrink-0 items-center justify-center rounded-xl transition",
 action.destructive
 ? "bg-[var(--a-rose-tint)] text-[var(--a-rose-ink)]"
 : "bg-[var(--t-tint)] text-[var(--t-ink)] group-hover:bg-[var(--t-fill)] group-hover:text-white",
 )}
 >
 <Icon className="size-[18px]" strokeWidth={2.1} />
 </span>
 <span className="min-w-0 flex-1">
 <span
 className={cn(
 "block text-[15px] font-medium leading-tight [overflow-wrap:anywhere]",
 action.destructive ? "text-[var(--a-rose-ink)]" : "text-foreground",
 )}
 >
 {action.label}
 </span>
 <span className="mt-0.5 block text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">{action.hint}</span>
 </span>
 <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5" />
 </button>
 </li>
 );
}

function GroupCard({
 group,
 loading,
 failed,
 onRetry,
 onSelect,
}: {
 group: MemberActionGroup;
 loading: boolean;
 failed: boolean;
 onRetry: () => void;
 onSelect: (action: MemberAction) => void;
}) {
 const look = GROUP_LOOK[group.id];
 const headingId = `actions-${group.id}`;
 return (
 <section
 aria-labelledby={headingId}
 style={accentVars(look.accent)}
 className="flex min-w-0 flex-col rounded-[22px] border border-border/60 bg-background/60 p-2"
 >
 <div className="flex items-start gap-2.5 px-2 pb-2 pt-2">
 <GlyphBadge icon={look.icon} />
 <div className="min-w-0 flex-1">
 <h3 id={headingId} className="text-[15px] font-semibold tracking-tight text-foreground">
 {group.title}
 </h3>
 {loading ? (
 <Skeleton className="mt-1.5 h-3 w-32 rounded" />
 ) : (
 <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{group.status}</p>
 )}
 </div>
 </div>
 {loading ? (
 <div className="flex flex-col gap-1.5 p-1" aria-busy="true">
 {[0, 1, 2].map((i) => (
 <Skeleton key={i} className="h-14 w-full rounded-2xl" />
 ))}
 </div>
 ) : failed ? (
 <div className="flex flex-col items-start gap-2 px-3 pb-3 pt-1">
 <p className="text-sm text-muted-foreground">Couldn&apos;t load what this member has.</p>
 <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl">
 Try again
 </Button>
 </div>
 ) : group.actions.length === 0 ? (
 <p className="px-3 pb-3 pt-1 text-sm text-muted-foreground">{look.empty}</p>
 ) : (
 <ul className="flex flex-col gap-0.5">
 {group.actions.map((action) => (
 <ActionRow key={`${action.id}-${action.targetId ?? ""}`} action={action} onSelect={() => onSelect(action)} />
 ))}
 </ul>
 )}
 </section>
 );
}

/**
 * Member 360's command centre: everything that can be done to this
 * member's membership, training and trial, offered only where it applies.
 * Every action posts to the endpoint that already owns it; the rules for
 * what shows live in member-action-state.ts.
 */
export function MemberActionsPanel({
 member,
 onOpenPtHistory,
}: {
 member: ActionMember;
 onOpenPtHistory: () => void;
}) {
 const { hasPermission } = useAuth();
 const [now, setNow] = React.useState(() => Date.now());
 const [open, setOpen] = React.useState<MemberAction | null>(null);
 const refresh = useRefreshMember(member.id);
 const closeTrial = useCloseConvertedTrial();

 const canReadMemberships = hasPermission(["memberships.read", "memberships.read_assigned"]);
 const canReadPackages = hasPermission("pt-packages.read");
 const canReadTrials = hasPermission(["appointments.read", "appointments.read_assigned"]);

 const memberships = useMemberships({ memberId: member.id, pageSize: 50 });
 const plans = useMembershipPlans({ pageSize: 100 });
 const packages = usePtPackages(member.id, { enabled: canReadPackages });
 const trials = useAppointments({ memberId: member.id, type: "TRIAL", pageSize: 20 }, { enabled: canReadTrials });

 const membershipItems = React.useMemo(() => memberships.data?.items ?? [], [memberships.data]);
 const trialItems = React.useMemo(() => trials.data?.items ?? [], [trials.data]);
 const packageItems = React.useMemo(() => packages.data ?? [], [packages.data]);

 const groups = memberActionGroups({
 now,
 memberships: membershipItems,
 plans: plans.data?.items ?? [],
 ptPackages: packageItems,
 trials: trialItems,
 trainerName: member.assignedTrainer
 ? `${member.assignedTrainer.firstName} ${member.assignedTrainer.lastName}`.trim()
 : null,
 can: hasPermission,
 });

 const done = React.useCallback(async () => {
 await refresh();
 setNow(Date.now());
 }, [refresh]);

 const loading: Record<MemberActionGroup["id"], boolean> = {
 membership: canReadMemberships && (memberships.isLoading || plans.isLoading),
 training: canReadPackages && packages.isLoading,
 trial: (canReadTrials && trials.isLoading) || (canReadMemberships && memberships.isLoading),
 };
 const failed: Record<MemberActionGroup["id"], boolean> = {
 membership: canReadMemberships && memberships.isError,
 training: canReadPackages && packages.isError,
 trial: (canReadTrials && trials.isError) || (canReadMemberships && memberships.isError),
 };
 const retry: Record<MemberActionGroup["id"], () => void> = {
 membership: () => void Promise.all([memberships.refetch(), plans.refetch()]),
 training: () => void packages.refetch(),
 trial: () => void Promise.all([trials.refetch(), memberships.refetch()]),
 };

 function select(action: MemberAction) {
 if (action.id === "pt-history") {
 onOpenPtHistory();
 return;
 }
 setOpen(action);
 }

 const close = (next: boolean) => {
 if (!next) setOpen(null);
 };
 const target = open?.targetId;
 const membership = target ? membershipItems.find((m) => m.id === target) : undefined;
 const trial: Appointment | null = target ? trialItems.find((t) => t.id === target) ?? null : null;
 const currency = membershipItems[0]?.currency ?? plans.data?.items[0]?.currency ?? "INR";
 const memberName = `${member.firstName} ${member.lastName}`.trim();
 const branchId = member.primaryBranchId ?? "";

 return (
 <section aria-labelledby="member-actions-title" className={cn(surfaceClass, "p-3 sm:p-5")}>
 <div className="mb-3 flex items-center gap-2.5 px-1 sm:mb-4">
 <span style={accentVars("indigo")}>
 <GlyphBadge icon={Zap} />
 </span>
 <div className="min-w-0 flex-1">
 <h2 id="member-actions-title" className="text-[17px] font-semibold tracking-tight text-foreground">
 Actions
 </h2>
 <p className="text-xs text-muted-foreground">Only what applies to {member.firstName} right now</p>
 </div>
 </div>

 <div className="grid gap-3 md:grid-cols-3">
 {groups.map((group) => (
 <GroupCard
 key={group.id}
 group={group}
 loading={loading[group.id]}
 failed={failed[group.id]}
 onRetry={retry[group.id]}
 onSelect={select}
 />
 ))}
 </div>

 {open && membership && open.id !== "sell" && open.id in MEMBERSHIP_DIALOGS ? (
 <MembershipActionDialog
 action={open.id as MembershipDialogId}
 membership={membership}
 memberId={member.id}
 plans={plans.data?.items ?? []}
 onDone={done}
 onOpenChange={close}
 />
 ) : null}

 {open?.id === "sell" || open?.id === "convert-trial" ? (
 <SellMembershipDialog
 memberId={member.id}
 open
 onOpenChange={close}
 title={open.id === "convert-trial" ? "Convert to membership" : "Sell a membership"}
 onSold={async () => {
 if (open.id === "convert-trial") await closeTrial(trial).catch(() => undefined);
 await done();
 }}
 />
 ) : null}

 {open?.id === "assign-coach" || open?.id === "change-coach" ? (
 <CoachDialog
 memberId={member.id}
 branchId={branchId}
 currentTrainerId={member.assignedTrainerId}
 onDone={done}
 onOpenChange={close}
 />
 ) : null}

 {open?.id === "add-pt-package" || open?.id === "renew-pt" ? (
 <PtPackageDialog
 memberId={member.id}
 branchId={branchId}
 currency={currency}
 renewing={open.id === "renew-pt" ? packageItems.find((p) => p.id === target) ?? null : null}
 onDone={done}
 onOpenChange={close}
 />
 ) : null}

 {open?.id === "book-trial" ? (
 <BookTrialDialog
 memberId={member.id}
 memberName={memberName}
 branchId={branchId}
 onDone={done}
 onOpenChange={close}
 />
 ) : null}

 {(open?.id === "trial-attended" || open?.id === "trial-no-show") && trial ? (
 <TrialOutcomeDialog
 trial={trial}
 outcome={open.id === "trial-attended" ? "attended" : "no-show"}
 onDone={done}
 onOpenChange={close}
 />
 ) : null}
 </section>
 );
}

const MEMBERSHIP_DIALOGS = {
 activate: true,
 freeze: true,
 resume: true,
 extend: true,
 upgrade: true,
 downgrade: true,
 transfer: true,
 renew: true,
 cancel: true,
 "cancel-renewal": true,
} as const;

type MembershipDialogId = keyof typeof MEMBERSHIP_DIALOGS;
