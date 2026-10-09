import type { Payment } from "@/lib/types/gym";
import { initials, netPaid, termProgress, visitStreak, visitSummary } from "./member-profile-stats";

function payment(overrides: Partial<Payment>): Payment {
  return {
    id: "p",
    organizationId: "o",
    branchId: "b",
    memberId: "m",
    membershipId: null,
    amount: "1000.00",
    currency: "INR",
    method: "CASH",
    status: "COMPLETED",
    note: null,
    recordedByUserId: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("netPaid", () => {
  it("counts what was kept: failed charges and refunds are not money in", () => {
    const result = netPaid([
      payment({ amount: "2000.00" }),
      payment({ amount: "1500.00", status: "FAILED" }),
      payment({
        amount: "1000.00",
        status: "PARTIALLY_REFUNDED",
        refunds: [{ id: "r", paymentId: "p", amount: "400.00", reason: null, recordedByUserId: null, createdAt: "" }],
      }),
      payment({ amount: "900.00", status: "REFUNDED" }),
    ]);
    expect(result).toEqual({ amount: 2600, currency: "INR", completed: 1, refunded: 2 });
  });

  it("has no currency when there are no payments", () => {
    expect(netPaid([])).toEqual({ amount: 0, currency: null, completed: 0, refunded: 0 });
  });
});

describe("visitSummary", () => {
  it("separates this calendar month from the rolling 30 days", () => {
    const now = new Date(2026, 8, 3, 12);
    const summary = visitSummary(
      [new Date(2026, 8, 2).toISOString(), new Date(2026, 7, 20).toISOString(), new Date(2026, 6, 1).toISOString()],
      now,
    );
    expect(summary).toEqual({ thisMonth: 1, last30Days: 2 });
  });
});

describe("visitStreak", () => {
  const now = new Date(2026, 8, 10, 9);
  const day = (d: number, h = 18) => new Date(2026, 8, d, h).toISOString();

  it("counts consecutive days ending today, with several visits in a day counting once", () => {
    expect(visitStreak([day(10, 7), day(9), day(9, 6), day(8), day(6)], now)).toBe(3);
  });

  it("is still alive the morning after, before today's visit", () => {
    expect(visitStreak([day(9), day(8)], now)).toBe(2);
  });

  it("is over after a missed day", () => {
    expect(visitStreak([day(8), day(7)], now)).toBe(0);
  });
});

describe("termProgress", () => {
  it("is the share of the term used, clamped to 0-1", () => {
    expect(termProgress("2026-09-01T00:00:00Z", "2026-09-11T00:00:00Z", Date.parse("2026-09-06T00:00:00Z"))).toBe(0.5);
    expect(termProgress("2026-09-01T00:00:00Z", "2026-09-11T00:00:00Z", Date.parse("2026-12-01T00:00:00Z"))).toBe(1);
    expect(termProgress("2026-09-01T00:00:00Z", "2026-09-11T00:00:00Z", Date.parse("2026-08-01T00:00:00Z"))).toBe(0);
  });
});

describe("initials", () => {
  it("uses first and last initials, with a fallback for a blank name", () => {
    expect(initials("alex", "Adams")).toBe("AA");
    expect(initials("  ", null)).toBe("?");
  });
});
