import type { Appointment } from "@/lib/hooks/use-appointments";
import type { PtPackage } from "@/lib/hooks/use-pt-packages";
import type { Membership, MembershipPlan } from "@/lib/types/gym";

/**
 * Which actions a member's record allows right now, and on which row.
 *
 * Every rule here mirrors a guard the server already enforces (see
 * memberships.service.ts): the panel offers only what would succeed, so
 * a click never ends in "Only an active membership can be frozen". The
 * server stays the authority; this only keeps dead ends off the screen.
 */

export type MembershipActionId =
  | "activate"
  | "freeze"
  | "resume"
  | "extend"
  | "upgrade"
  | "downgrade"
  | "transfer"
  | "renew"
  | "cancel"
  | "cancel-renewal"
  | "sell";

export type TrainingActionId = "assign-coach" | "change-coach" | "add-pt-package" | "renew-pt" | "pt-history";

export type TrialActionId = "book-trial" | "trial-attended" | "trial-no-show" | "convert-trial";

export type MemberActionId = MembershipActionId | TrainingActionId | TrialActionId;

export interface MemberAction {
  id: MemberActionId;
  label: string;
  /** One line on what it will do, in this member's terms. */
  hint: string;
  /** The membership, package or appointment the action applies to. */
  targetId?: string;
  destructive?: boolean;
}

export interface MemberActionGroup {
  id: "membership" | "training" | "trial";
  title: string;
  /** Where the member stands, in one line. */
  status: string;
  actions: MemberAction[];
}

export interface MemberActionInput {
  now: number;
  memberships: Membership[];
  /** Active plans on sale. */
  plans: MembershipPlan[];
  ptPackages: PtPackage[];
  /** The member's TRIAL appointments. */
  trials: Appointment[];
  trainerName: string | null;
  can: (permission: string | string[]) => boolean;
}

const DAY = 86_400_000;

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const isLive = (m: Membership) => m.status === "ACTIVE" || m.status === "FROZEN";
const started = (m: Membership, now: number) => new Date(m.startDate).getTime() <= now;

/** The term running today, the one sold to follow it, and the rest. */
export function membershipTimeline(memberships: Membership[], now: number) {
  const live = memberships.filter(isLive);
  const current =
    [...live.filter((m) => started(m, now))].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
  const renewalOf = (term: Membership | null) =>
    term ? memberships.find((m) => m.previousMembershipId === term.id && m.status !== "CANCELLED") ?? null : null;
  const renewal = renewalOf(current);
  // A term sold to start later with nothing running today (bought ahead).
  const upcoming =
    current ? null : [...live].sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
  const pending = memberships.find((m) => m.status === "PENDING") ?? null;
  // What "Renew" restarts when nothing is live: the latest closed term
  // that nothing has replaced yet.
  const lastClosed =
    live.length === 0
      ? [...memberships]
          .filter((m) => (m.status === "EXPIRED" || m.status === "CANCELLED") && !renewalOf(m))
          .sort((a, b) => b.endDate.localeCompare(a.endDate))[0] ?? null
      : null;
  return { current, renewal, upcoming, pending, lastClosed };
}

function membershipGroup(input: MemberActionInput): MemberActionGroup {
  const { now, memberships, plans, can } = input;
  const { current, renewal, upcoming, pending, lastClosed } = membershipTimeline(memberships, now);
  const actions: MemberAction[] = [];
  const update = can("memberships.update");

  if (pending && update) {
    actions.push({ id: "activate", label: "Activate", hint: "Start the term waiting on payment", targetId: pending.id });
  }

  if (current && update) {
    const plan = current.membershipPlan;
    const freezeLeft = plan ? plan.maxFreezeDays - current.totalFreezeDaysUsed : 0;
    if (current.status === "ACTIVE" && freezeLeft > 0) {
      actions.push({
        id: "freeze",
        label: "Freeze",
        hint: `${freezeLeft} freeze day${freezeLeft === 1 ? "" : "s"} left on this plan`,
        targetId: current.id,
      });
    }
    if (current.status === "FROZEN") {
      actions.push({
        id: "resume",
        label: "Unfreeze",
        hint: "Resume now and add the frozen days back",
        targetId: current.id,
      });
    }
    actions.push({ id: "extend", label: "Extend", hint: `Add free days after ${dateLabel(current.endDate)}`, targetId: current.id });

    // A plan change starts the new plan today; with a renewal already
    // sold the two would overlap, so the server refuses it.
    if (!renewal && plan) {
      const price = Number(plan.price);
      const others = plans.filter((p) => p.isActive && p.id !== plan.id);
      if (others.some((p) => Number(p.price) > price)) {
        actions.push({ id: "upgrade", label: "Upgrade", hint: "Move to a bigger plan, unused days credited", targetId: current.id });
      }
      if (others.some((p) => Number(p.price) < price)) {
        actions.push({ id: "downgrade", label: "Downgrade", hint: "Move to a smaller plan, unused days credited", targetId: current.id });
      }
      actions.push({ id: "transfer", label: "Transfer", hint: "Hand this term to another member", targetId: current.id });
    }

    if (!renewal && current.status === "ACTIVE") {
      actions.push({ id: "renew", label: "Renew", hint: `Next term starts ${dateLabel(current.endDate)}`, targetId: current.id });
    }
    if (renewal) {
      actions.push({
        id: "cancel-renewal",
        label: "Cancel renewal",
        hint: `The term from ${dateLabel(renewal.startDate)}`,
        targetId: renewal.id,
        destructive: true,
      });
    }
    actions.push({ id: "cancel", label: "Cancel", hint: "End this term now", targetId: current.id, destructive: true });
  } else if (upcoming && update) {
    actions.push({ id: "extend", label: "Extend", hint: `Add free days after ${dateLabel(upcoming.endDate)}`, targetId: upcoming.id });
    actions.push({ id: "cancel", label: "Cancel", hint: `The term from ${dateLabel(upcoming.startDate)}`, targetId: upcoming.id, destructive: true });
  }

  if (!current && !upcoming) {
    if (lastClosed && update && lastClosed.membershipPlan?.isActive !== false) {
      actions.push({
        id: "renew",
        label: "Renew",
        hint: `${lastClosed.membershipPlan?.name ?? "Last plan"} again, from today`,
        targetId: lastClosed.id,
      });
    }
    if (can("memberships.create")) {
      actions.push({ id: "sell", label: "New membership", hint: "Sell any plan" });
    }
  }

  let status: string;
  if (current) {
    const daysLeft = Math.max(0, Math.ceil((new Date(current.endDate).getTime() - now) / DAY));
    const name = current.membershipPlan?.name ?? "Membership";
    status =
      current.status === "FROZEN"
        ? `${name} · frozen${current.freezeEndDate ? ` until ${dateLabel(current.freezeEndDate)}` : ""}`
        : `${name} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
    if (renewal) status += ` · renewed to ${dateLabel(renewal.endDate)}`;
  } else if (upcoming) {
    status = `${upcoming.membershipPlan?.name ?? "Membership"} starts ${dateLabel(upcoming.startDate)}`;
  } else if (pending) {
    status = "Waiting on payment to start";
  } else if (lastClosed) {
    status = `${lastClosed.membershipPlan?.name ?? "Last plan"} ended ${dateLabel(lastClosed.endDate)}`;
  } else {
    status = "No membership yet";
  }

  return { id: "membership", title: "Membership", status, actions };
}

/** The package worth renewing: the latest, once it is used up, lapsed or nearly so. */
export function packageDueForRenewal(packages: PtPackage[], now: number): PtPackage | null {
  const latest = [...packages]
    .filter((p) => p.status !== "CANCELLED")
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  if (!latest) return null;
  const healthy = packages.some(
    (p) => p.status === "ACTIVE" && p.remainingSessions > 2 && new Date(p.endDate).getTime() - now > 14 * DAY,
  );
  return healthy ? null : latest;
}

function trainingGroup(input: MemberActionInput): MemberActionGroup {
  const { now, ptPackages, trainerName, can } = input;
  const actions: MemberAction[] = [];
  const assign = can(["members.assign_trainer", "members.update"]);

  if (assign) {
    actions.push(
      trainerName
        ? { id: "change-coach", label: "Change PT", hint: `Now with ${trainerName}` }
        : { id: "assign-coach", label: "Assign PT", hint: "Give this member a coach" },
    );
  }
  if (can("pt-packages.create")) {
    actions.push({ id: "add-pt-package", label: "Add PT package", hint: "Sell a block of sessions" });
    const due = packageDueForRenewal(ptPackages, now);
    if (due) {
      actions.push({
        id: "renew-pt",
        label: "Renew PT",
        hint: `${due.name} again`,
        targetId: due.id,
      });
    }
  }
  if (can("pt-sessions.read")) {
    actions.push({ id: "pt-history", label: "PT session history", hint: "Every session, booked and done" });
  }

  const active = ptPackages.filter((p) => p.status === "ACTIVE");
  const left = active.reduce((sum, p) => sum + p.remainingSessions, 0);
  const status = [
    trainerName ? `Coach ${trainerName}` : "No coach",
    active.length ? `${left} PT session${left === 1 ? "" : "s"} left` : "No active PT package",
  ].join(" · ");

  return { id: "training", title: "Personal training", status, actions };
}

function trialGroup(input: MemberActionInput): MemberActionGroup {
  const { now, memberships, trials, can } = input;
  const actions: MemberAction[] = [];
  // A free trial is for someone who has never bought a plan.
  const everJoined = memberships.length > 0;
  const hasLive = memberships.some((m) => isLive(m) || m.status === "PENDING");
  const sorted = [...trials].sort((a, b) => b.startTime.localeCompare(a.startTime));
  const booked = sorted.find((t) => t.status === "BOOKED") ?? null;
  const attended = sorted.find((t) => t.status === "COMPLETED") ?? null;
  const latest = sorted.find((t) => t.status !== "CANCELLED") ?? null;

  if (!everJoined && !booked && can("appointments.create")) {
    actions.push({
      id: "book-trial",
      label: latest ? "Book another trial" : "Book free trial",
      hint: "A session to try the gym",
    });
  }
  if (booked && new Date(booked.startTime).getTime() <= now && can("appointments.update")) {
    actions.push({ id: "trial-attended", label: "Trial attended", hint: "They came: mark it done", targetId: booked.id });
    actions.push({ id: "trial-no-show", label: "No-show", hint: "They didn't come", targetId: booked.id, destructive: true });
  }
  if (latest && !hasLive && can("memberships.create")) {
    actions.push({
      id: "convert-trial",
      label: "Convert to membership",
      hint: "Sell a plan and close the trial",
      targetId: booked?.id,
    });
  }

  let status: string;
  if (booked) {
    status = `Trial ${new Date(booked.startTime).getTime() > now ? "booked for" : "was due"} ${dateLabel(booked.startTime)}`;
  } else if (hasLive && sorted.length > 0) {
    status = "Joined after a trial";
  } else if (attended) {
    status = `Trial attended ${dateLabel(attended.startTime)}`;
  } else if (latest?.status === "NO_SHOW") {
    status = `Missed the trial on ${dateLabel(latest.startTime)}`;
  } else if (everJoined) {
    status = "Already a paying member";
  } else {
    status = "No trial yet";
  }

  return { id: "trial", title: "Trial & conversion", status, actions };
}

export function memberActionGroups(input: MemberActionInput): MemberActionGroup[] {
  return [membershipGroup(input), trainingGroup(input), trialGroup(input)];
}
