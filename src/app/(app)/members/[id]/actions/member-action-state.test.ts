import type { Appointment } from "@/lib/hooks/use-appointments";
import type { PtPackage } from "@/lib/hooks/use-pt-packages";
import type { Membership, MembershipPlan } from "@/lib/types/gym";

import { editPayload } from "../edit-member-payload";
import { memberActionGroups, membershipTimeline, packageDueForRenewal, type MemberActionInput } from "./member-action-state";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 1, 10);
const iso = (offsetDays: number) => new Date(NOW + offsetDays * DAY).toISOString();

function plan(id: string, price: number, extra: Partial<MembershipPlan> = {}): MembershipPlan {
  return {
    id,
    organizationId: "org",
    branchId: null,
    name: `Plan ${id}`,
    code: null,
    category: null,
    description: null,
    durationDays: 30,
    price: String(price),
    currency: "INR",
    benefits: [],
    maxFreezeDays: 10,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    createdAt: iso(-100),
    updatedAt: iso(-100),
    ...extra,
  };
}

const BASIC = plan("basic", 1000);
const GOLD = plan("gold", 3000);
const LITE = plan("lite", 500);

function term(id: string, extra: Partial<Membership> = {}): Membership {
  return {
    id,
    organizationId: "org",
    branchId: "b1",
    memberId: "m1",
    membershipPlanId: BASIC.id,
    status: "ACTIVE",
    startDate: iso(-10),
    endDate: iso(20),
    freezeStartDate: null,
    freezeEndDate: null,
    totalFreezeDaysUsed: 0,
    price: "1000",
    currency: "INR",
    autoRenew: false,
    cancelledAt: null,
    cancellationReason: null,
    previousMembershipId: null,
    createdAt: iso(-10),
    updatedAt: iso(-10),
    membershipPlan: BASIC,
    ...extra,
  };
}

function trial(id: string, extra: Partial<Appointment> = {}): Appointment {
  return {
    id,
    organizationId: "org",
    branchId: "b1",
    staffId: null,
    memberId: "m1",
    leadId: null,
    type: "TRIAL",
    status: "BOOKED",
    title: "Free trial",
    startTime: iso(1),
    endTime: iso(1.05),
    notes: null,
    cancellationReason: null,
    clientName: null,
    clientEmail: null,
    clientPhone: null,
    remindersSent: 0,
    createdByUserId: null,
    createdAt: iso(-1),
    updatedAt: iso(-1),
    ...extra,
  };
}

function pack(id: string, extra: Partial<PtPackage> = {}): PtPackage {
  return {
    id,
    organizationId: "org",
    branchId: "b1",
    memberId: "m1",
    templateId: null,
    name: "10 sessions",
    totalSessions: 10,
    usedSessions: 2,
    remainingSessions: 8,
    startDate: iso(-10),
    endDate: iso(80),
    price: "5000",
    currency: "INR",
    status: "ACTIVE",
    createdAt: iso(-10),
    updatedAt: iso(-10),
    ...extra,
  };
}

function groups(over: Partial<MemberActionInput> = {}) {
  const input: MemberActionInput = {
    now: NOW,
    memberships: [],
    plans: [BASIC, GOLD, LITE],
    ptPackages: [],
    trials: [],
    trainerName: null,
    can: () => true,
    ...over,
  };
  const [membership, training, trialGroup] = memberActionGroups(input);
  const ids = (g: { actions: { id: string }[] }) => g.actions.map((a) => a.id);
  return { membership, training, trial: trialGroup, ids };
}

describe("membership actions", () => {
  it("offers the full set on a running term", () => {
    const { membership, ids } = groups({ memberships: [term("t1")] });
    expect(ids(membership)).toEqual(["freeze", "extend", "upgrade", "downgrade", "transfer", "renew", "cancel"]);
    expect(membership.actions.every((a) => a.targetId === "t1")).toBe(true);
    expect(membership.status).toBe("Plan basic · 20 days left");
  });

  it("swaps Freeze for Unfreeze on a frozen term, and never renews it", () => {
    const { membership, ids } = groups({ memberships: [term("t1", { status: "FROZEN", freezeEndDate: iso(5) })] });
    expect(ids(membership)).toContain("resume");
    expect(ids(membership)).not.toContain("freeze");
    expect(ids(membership)).not.toContain("renew");
  });

  it("hides Freeze once the plan's freeze days are spent", () => {
    const { membership, ids } = groups({ memberships: [term("t1", { totalFreezeDaysUsed: 10 })] });
    expect(ids(membership)).not.toContain("freeze");
  });

  it("only offers the plan-change direction a plan exists for", () => {
    const { membership, ids } = groups({ memberships: [term("t1")], plans: [BASIC, GOLD] });
    expect(ids(membership)).toContain("upgrade");
    expect(ids(membership)).not.toContain("downgrade");
  });

  it("with a renewal sold: no plan change, transfer or second renewal, but it can be cancelled", () => {
    const next = term("t2", { startDate: iso(20), endDate: iso(50), previousMembershipId: "t1" });
    const { membership, ids } = groups({ memberships: [term("t1"), next] });
    expect(ids(membership)).toEqual(["freeze", "extend", "cancel-renewal", "cancel"]);
    expect(membership.actions.find((a) => a.id === "cancel-renewal")?.targetId).toBe("t2");
    expect(membership.status).toMatch(/renewed to/);
  });

  it("treats a term that hasn't started as upcoming, not current", () => {
    const ahead = term("t1", { startDate: iso(3), endDate: iso(33) });
    const { membership, ids } = groups({ memberships: [ahead] });
    expect(ids(membership)).toEqual(["extend", "cancel"]);
    expect(membership.status).toMatch(/starts/);
  });

  it("renews the last closed term from today, and offers a new sale", () => {
    const old = term("t1", { status: "EXPIRED", startDate: iso(-60), endDate: iso(-30) });
    const { membership, ids } = groups({ memberships: [old] });
    expect(ids(membership)).toEqual(["renew", "sell"]);
    expect(membership.actions[0].targetId).toBe("t1");
  });

  it("activates a pending term", () => {
    const { membership, ids } = groups({ memberships: [term("t1", { status: "PENDING" })] });
    expect(ids(membership)).toContain("activate");
  });

  it("shows nothing a role can't do", () => {
    const { membership } = groups({ memberships: [term("t1")], can: (p) => p === "memberships.read" });
    expect(membership.actions).toEqual([]);
  });

  it("finds the running term among old and future ones", () => {
    const timeline = membershipTimeline(
      [
        term("old", { status: "CANCELLED", startDate: iso(-40), endDate: iso(-10) }),
        term("now"),
        term("next", { startDate: iso(20), endDate: iso(50), previousMembershipId: "now" }),
      ],
      NOW,
    );
    expect(timeline.current?.id).toBe("now");
    expect(timeline.renewal?.id).toBe("next");
    expect(timeline.lastClosed).toBeNull();
  });
});

describe("training actions", () => {
  it("assigns a coach when there is none, changes it when there is", () => {
    expect(groups().ids(groups().training)).toEqual(["assign-coach", "add-pt-package", "pt-history"]);
    const withCoach = groups({ trainerName: "Ravi K" });
    expect(withCoach.ids(withCoach.training)[0]).toBe("change-coach");
    expect(withCoach.training.status).toBe("Coach Ravi K · No active PT package");
  });

  it("lets a head trainer (assign_trainer only) change the coach", () => {
    const { training, ids } = groups({ can: (p) => (Array.isArray(p) ? p.includes("members.assign_trainer") : false) });
    expect(ids(training)).toEqual(["assign-coach"]);
  });

  it("suggests renewing a package only when it is running out", () => {
    expect(packageDueForRenewal([pack("p1")], NOW)).toBeNull();
    expect(packageDueForRenewal([pack("p1", { remainingSessions: 1, usedSessions: 9 })], NOW)?.id).toBe("p1");
    expect(packageDueForRenewal([pack("p1", { endDate: iso(5) })], NOW)?.id).toBe("p1");
    expect(packageDueForRenewal([pack("p1", { status: "COMPLETED", remainingSessions: 0 })], NOW)?.id).toBe("p1");
    // A healthy second package means there is nothing to renew yet.
    expect(packageDueForRenewal([pack("p1", { status: "COMPLETED", remainingSessions: 0 }), pack("p2")], NOW)).toBeNull();
  });

  it("counts the sessions left across active packages", () => {
    const { training } = groups({ ptPackages: [pack("p1"), pack("p2", { remainingSessions: 3 })] });
    expect(training.status).toBe("No coach · 11 PT sessions left");
  });
});

describe("trial actions", () => {
  it("books a free trial for someone who never joined", () => {
    const { trial, ids } = groups();
    expect(ids(trial)).toEqual(["book-trial"]);
    expect(trial.status).toBe("No trial yet");
  });

  it("offers no trial to a member who has bought a plan", () => {
    const { trial } = groups({ memberships: [term("t1")] });
    expect(trial.actions).toEqual([]);
    expect(trial.status).toBe("Already a paying member");
  });

  it("before the trial: convert only; after it: attended, no-show, convert", () => {
    const ahead = groups({ trials: [trial("a1")] });
    expect(ahead.ids(ahead.trial)).toEqual(["convert-trial"]);
    expect(ahead.trial.status).toMatch(/^Trial booked for/);

    const due = groups({ trials: [trial("a1", { startTime: iso(-0.1), endTime: iso(-0.05) })] });
    expect(due.ids(due.trial)).toEqual(["trial-attended", "trial-no-show", "convert-trial"]);
    expect(due.trial.actions.every((a) => a.targetId === "a1")).toBe(true);
  });

  it("after an attended trial: convert or book another", () => {
    const done = groups({ trials: [trial("a1", { status: "COMPLETED", startTime: iso(-2) })] });
    expect(done.ids(done.trial)).toEqual(["book-trial", "convert-trial"]);
    expect(done.trial.actions[0].label).toBe("Book another trial");
  });
});

describe("editPayload", () => {
  it("leaves out boxes that were blank, clears ones the user emptied", () => {
    expect(
      editPayload(
        { firstName: "Asha", email: "", phone: "", notes: "", assignedTrainerId: "", primaryBranchId: "b1" },
        { firstName: "Asha", email: "", phone: "98", notes: "", assignedTrainerId: "", primaryBranchId: "b1" },
      ),
    ).toEqual({ firstName: "Asha", phone: null, primaryBranchId: "b1" });
  });

  it("never clears the branch or the coach", () => {
    expect(editPayload({ primaryBranchId: "", assignedTrainerId: "" }, { primaryBranchId: "b1", assignedTrainerId: "u1" })).toEqual({});
  });
});

describe("trial status after joining", () => {
  it("remembers the trial, even one called off because they joined first", () => {
    const joined = groups({
      memberships: [term("t1")],
      trials: [trial("a1", { status: "CANCELLED", cancellationReason: "Joined before the trial" })],
    });
    expect(joined.trial.status).toBe("Joined after a trial");
    expect(joined.trial.actions).toEqual([]);
  });
});
