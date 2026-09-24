export type Accent =
  | "indigo"
  | "violet"
  | "rose"
  | "emerald"
  | "amber"
  | "cyan"
  | "blue"
  | "orange";

/**
 * Which hue a route wears.
 *
 * Ordered longest-prefix-first, because `/crm/analytics` must not be
 * caught by a shorter rule that happens to sit above it.
 *
 * The mapping follows the sidebar's own six work areas plus the two
 * tool groups, so the colour on a page's masthead is the same colour as
 * the section that got you there. That is the whole point: a hue that
 * tracks location tells you something, where a hue chosen per page
 * tells you only that someone liked it. It is also why this is derived
 * rather than typed at each call site -- 14 of the 32 pages that passed
 * an accent had all picked violet, which by definition distinguishes
 * nothing.
 */
const ROUTE_ACCENTS: ReadonlyArray<readonly [string, Accent]> = [
  // Tools
  ["/settings", "orange"],
  ["/owner-os", "blue"],
  ["/command-center", "blue"],
  ["/intelligence", "blue"],
  ["/business-os", "blue"],
  ["/ai-actions", "blue"],
  ["/ai", "blue"],
  ["/search", "blue"],
  // Operations
  ["/attendance", "cyan"],
  ["/inventory", "cyan"],
  ["/staff", "cyan"],
  ["/branches", "cyan"],
  ["/onboarding", "cyan"],
  // Finance
  ["/billing", "amber"],
  ["/membership-plans", "amber"],
  ["/memberships", "amber"],
  ["/payroll", "amber"],
  // Training
  ["/pt-operations", "emerald"],
  ["/workout-sessions", "emerald"],
  ["/workouts", "emerald"],
  ["/nutrition", "emerald"],
  ["/classes", "emerald"],
  ["/calendar", "emerald"],
  // Sales
  ["/crm", "rose"],
  // Members
  ["/members", "violet"],
  // Home
  ["/dashboard", "indigo"],
  // The member's own app. One hue throughout: a member has no sections
  // to tell apart, and four colours in a four-tab app is noise.
  ["/portal", "violet"],
];

export function accentForPath(pathname: string | null | undefined): Accent {
  if (!pathname) return "indigo";
  for (const [prefix, accent] of ROUTE_ACCENTS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return accent;
  }
  return "indigo";
}

/**
 * The section a route belongs to, for the masthead's eyebrow.
 *
 * Same list, same order, same longest-prefix rule. It is separate from
 * the accent map only because a few routes share a hue but not a name
 * ("Insights" and "AI" are both blue), and collapsing them would print
 * the wrong word above the title.
 */
const ROUTE_SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ["/settings", "Settings"],
  ["/owner-os", "Insights"],
  ["/command-center", "Insights"],
  ["/intelligence", "Insights"],
  ["/business-os", "Insights"],
  ["/ai-actions", "AI agent"],
  ["/ai", "AI agent"],
  ["/search", "Search"],
  ["/attendance", "Operations"],
  ["/inventory", "Operations"],
  ["/staff", "Operations"],
  ["/branches", "Operations"],
  ["/onboarding", "Operations"],
  ["/billing", "Finance"],
  ["/membership-plans", "Finance"],
  ["/memberships", "Finance"],
  ["/payroll", "Finance"],
  ["/pt-operations", "Training"],
  ["/workout-sessions", "Training"],
  ["/workouts", "Training"],
  ["/nutrition", "Training"],
  ["/classes", "Training"],
  ["/calendar", "Training"],
  ["/crm", "Sales"],
  ["/members", "Members"],
  ["/dashboard", "Home"],
];

export function sectionForPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  for (const [prefix, section] of ROUTE_SECTIONS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return section;
  }
  return null;
}
