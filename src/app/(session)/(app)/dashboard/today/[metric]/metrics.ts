import { CalendarCheck, HandCoins, Megaphone, RefreshCw, UserPlus, type LucideIcon } from "lucide-react";

import type { Accent } from "@/lib/section-accent";

/** The Today figures that open a list, keyed by their URL segment. */
export const TODAY_METRICS = {
  "check-ins": { title: "Check-ins", icon: CalendarCheck, accent: "cyan", permission: ["attendance.read", "attendance.read_assigned"] },
  collection: { title: "Collection", icon: HandCoins, accent: "emerald", permission: "payments.read" },
  "new-members": { title: "New members", icon: UserPlus, accent: "violet", permission: ["members.read", "members.read_assigned"] },
  renewals: { title: "Renewals", icon: RefreshCw, accent: "amber", permission: ["memberships.read", "memberships.read_assigned"] },
  leads: { title: "Leads", icon: Megaphone, accent: "rose", permission: "leads.read" },
} as const satisfies Record<string, { title: string; icon: LucideIcon; accent: Accent; permission: string | readonly string[] }>;

export type TodayMetric = keyof typeof TODAY_METRICS;

/** The tile's link: the same day and branch the dashboard is showing. */
export function todayMetricHref(metric: TodayMetric, date: string, branchId?: string) {
  const query = new URLSearchParams({ date });
  if (branchId) query.set("branch", branchId);
  return `/dashboard/today/${metric}?${query.toString()}`;
}
