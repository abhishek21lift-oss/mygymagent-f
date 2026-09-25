import type { LucideIcon } from "lucide-react";
import {
  BarChart3, Brain, Building2, CalendarCheck, CalendarDays, CheckSquare,
  CreditCard, Dumbbell, Gauge, HandCoins, Home, LayoutDashboard, ListChecks,
  Megaphone, Package, Salad, Search, Settings, Sparkles, UserCog, Users, Wallet,
} from "lucide-react";

export interface NavItem { title: string; href: string; icon: LucideIcon; permission?: string | string[]; children?: NavItem[]; accent?: "ai" | "default"; comingSoon?: boolean }

/** Exact-segment route match: `pathname.startsWith(href)` alone is wrong
 * whenever one route is a literal string prefix of an unrelated sibling
 * (e.g. "/membership-plans" and "/memberships" both start with "/members"). */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Six work areas, in the order a gym is actually run: who is in the
 * building, who might join, what they train, what they pay, what keeps
 * the place open.
 *
 * This replaces ten top-level groups, five of which were competing
 * answers to "how is my gym doing?" — Dashboard, Command Center, Owner
 * OS, Business OS and Intelligence all sat at the same level with no
 * indication of which to open. Home is now the daily overview; the four
 * analytical surfaces moved under Insights below, where they read as
 * places you go to dig rather than places you might have missed. No
 * route was removed, so every existing link and bookmark still resolves.
 */
export const primaryNav: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: Home },

  { title: "Members", href: "/members", icon: Users, permission: ["members.read", "members.read_assigned"] },

  { title: "Sales", href: "/crm", icon: Megaphone, permission: "leads.read", children: [
    { title: "Leads", href: "/crm", icon: Megaphone, permission: "leads.read" },
    { title: "Follow-ups", href: "/crm/follow-ups", icon: ListChecks, permission: "leads.read" },
    { title: "Sales analytics", href: "/crm/analytics", icon: BarChart3, permission: "reports.view" },
  ] },

  { title: "Training", href: "/pt-operations", icon: Dumbbell, permission: "workouts.read", children: [
    { title: "PT overview", href: "/pt-operations", icon: Dumbbell, permission: "workouts.read" },
    { title: "PT sessions", href: "/pt-operations/sessions", icon: CalendarCheck, permission: "pt-sessions.read" },
    { title: "Calendar", href: "/calendar", icon: CalendarDays, permission: ["appointments.read", "appointments.read_assigned"] },
    { title: "Classes", href: "/classes", icon: Users, permission: "classes.read" },
    { title: "Today's sessions", href: "/workout-sessions", icon: CalendarCheck, permission: "workouts.read" },
    { title: "Workout plans", href: "/workouts", icon: Dumbbell, permission: "workouts.read" },
    { title: "Nutrition", href: "/nutrition", icon: Salad, permission: "nutrition.read" },
  ] },

  { title: "Finance", href: "/billing", icon: Wallet, permission: "payments.read", children: [
    { title: "Payments", href: "/billing", icon: Wallet, permission: "payments.read" },
    { title: "Memberships", href: "/memberships", icon: CreditCard, permission: "memberships.read" },
    { title: "Plans", href: "/membership-plans", icon: CreditCard, permission: "membership_plans.read" },
    // Two grants, one page. `/payroll` carries staff salary and leave
    // (`hr.read`) alongside trainer commissions (`payroll.read`), and
    // gating the item on `payroll.read` alone hid it from the seeded
    // BRANCH_MANAGER -- which holds `hr.read` and `hr.manage` and no
    // `payroll.*` at all, so the one role whose job this is could not
    // reach it. Either grant opens the page; the page renders the half
    // the reader is entitled to.
    { title: "Payroll", href: "/payroll", icon: HandCoins, permission: ["hr.read", "payroll.read"] },
  ] },

  { title: "Operations", href: "/attendance", icon: CalendarCheck, permission: "attendance.read", children: [
    { title: "Attendance", href: "/attendance", icon: CalendarCheck, permission: "attendance.read" },
    { title: "Inventory", href: "/inventory", icon: Package, permission: "inventory.read" },
    { title: "Staff", href: "/staff", icon: UserCog, permission: "users.read" },
    { title: "Branches", href: "/branches", icon: Building2, permission: "branches.read" },
  ] },
];

/**
 * Tools rather than work areas. Kept below a rule so the six above read
 * as the shape of the job and these read as somewhere you go on purpose.
 */
export const secondaryNav: NavItem[] = [
  { title: "Insights", href: "/owner-os", icon: BarChart3, permission: "reports.view", children: [
    { title: "Business health", href: "/owner-os", icon: BarChart3, permission: "reports.view" },
    { title: "Command centre", href: "/command-center", icon: LayoutDashboard },
    { title: "Member intelligence", href: "/intelligence", icon: Brain, permission: "reports.view" },
    { title: "Business OS", href: "/business-os", icon: Gauge, permission: "reports.view" },
  ] },
  { title: "AI agent", href: "/ai", icon: Sparkles, permission: "ai.generate", accent: "ai", children: [
    { title: "Ask the agent", href: "/ai", icon: Sparkles, permission: "ai.generate", accent: "ai" },
    { title: "Action queue", href: "/ai-actions", icon: CheckSquare, permission: "ai.generate" },
  ] },
  { title: "Search", href: "/search", icon: Search, permission: "search.read" },
];

export const comingSoonNav: NavItem[] = [];
export const settingsNav: NavItem = { title: "Settings", href: "/settings", icon: Settings, permission: "organizations.read" };
