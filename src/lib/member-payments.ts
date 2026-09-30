/** Select value for "this payment is not for a membership". */
export const NOT_FOR_MEMBERSHIP = "none";

interface PayableMembership {
  id: string;
  status: string;
  startDate: string;
}

/**
 * The membership a desk payment is most likely for: the term running now,
 * else the next one due to start. Picking it by default matters because a
 * payment only settles a membership's invoice when it names the
 * membership -- left blank, the member stays "unpaid" on the invoice, gets
 * overdue reminders, and can be turned away at the check-in gate.
 */
export function defaultPaymentMembership(
  memberships: PayableMembership[],
  now: Date = new Date(),
): string {
  const active = memberships.filter(
    (m) => m.status === "ACTIVE" || m.status === "FROZEN",
  );
  const running = active.find((m) => new Date(m.startDate) <= now);
  if (running) return running.id;
  const upcoming = [...active].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )[0];
  return upcoming?.id ?? NOT_FOR_MEMBERSHIP;
}

/** The API's `membershipId` for a picked select value. */
export function membershipIdForPayment(value: string | undefined) {
  return value && value !== NOT_FOR_MEMBERSHIP ? value : undefined;
}
