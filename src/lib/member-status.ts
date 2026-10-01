/**
 * What `/analytics/members/status-breakdown` reports, in words.
 *
 * The API derives these from each member's membership terms (a term
 * covering today, a frozen one, one not yet started, none left, never
 * bought), not from `Member.status`, which stays ACTIVE after a
 * membership lapses. INACTIVE is the one manual status staff can set.
 */
export const MEMBER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  FROZEN: "Frozen",
  UPCOMING: "Starting soon",
  EXPIRED: "Lapsed",
  NO_MEMBERSHIP: "No membership",
  INACTIVE: "Inactive",
}

export function memberStatusLabel(status: string): string {
  return MEMBER_STATUS_LABEL[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")
}
