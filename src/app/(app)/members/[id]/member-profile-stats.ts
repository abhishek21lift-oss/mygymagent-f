import type { Payment } from "@/lib/types/gym";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * What the member has actually paid: every charge that went through, less
 * what was given back.
 *
 * The previous figure summed `amount` across every row, so a refunded or
 * failed payment still counted as money in -- a member refunded in full read
 * as having paid twice what they had.
 */
export function netPaid(payments: readonly Payment[]): {
  amount: number;
  currency: string | null;
  completed: number;
  refunded: number;
} {
  let amount = 0;
  let completed = 0;
  let refunded = 0;
  for (const payment of payments) {
    if (payment.status === "FAILED") continue;
    const charged = Number(payment.amount) || 0;
    const refundedAmount = payment.refunds?.length
      ? payment.refunds.reduce((sum, refund) => sum + (Number(refund.amount) || 0), 0)
      : payment.status === "REFUNDED"
        ? charged
        : 0;
    amount += Math.max(0, charged - refundedAmount);
    if (payment.status === "COMPLETED") completed += 1;
    else refunded += 1;
  }
  return { amount, currency: payments[0]?.currency ?? null, completed, refunded };
}

/** Visits this calendar month and in the rolling last 30 days. */
export function visitSummary(checkIns: readonly string[], now: Date): { thisMonth: number; last30Days: number } {
  let thisMonth = 0;
  let last30Days = 0;
  for (const iso of checkIns) {
    const date = new Date(iso);
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) thisMonth += 1;
    const age = now.getTime() - date.getTime();
    if (age >= 0 && age <= 30 * DAY_MS) last30Days += 1;
  }
  return { thisMonth, last30Days };
}

/**
 * Consecutive days with a visit, ending today or yesterday -- a streak is
 * still alive the morning after, before the member has come in.
 */
export function visitStreak(checkIns: readonly string[], now: Date): number {
  const days = new Set(checkIns.map((iso) => startOfDay(new Date(iso))));
  let cursor = startOfDay(now);
  if (!days.has(cursor)) cursor = previousDay(cursor);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}

/** Local midnight, as a number. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** The midnight before. Via noon, not by subtracting 24h, which lands an
 * hour off midnight across a DST change. */
function previousDay(midnight: number): number {
  return startOfDay(new Date(midnight - DAY_MS / 2));
}

/** Share of the membership term already used, 0-1. */
export function termProgress(startIso: string, endIso: string, now: number): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export function initials(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const letters = `${firstName?.trim()[0] ?? ""}${lastName?.trim()[0] ?? ""}`.toUpperCase();
  return letters || "?";
}
