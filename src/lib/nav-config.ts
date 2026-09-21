import type { LucideIcon } from "lucide-react";
import { BarChart3, Brain, Building2, CalendarCheck, CalendarDays, CheckSquare, CreditCard, Dumbbell, LayoutDashboard, ListChecks, Megaphone, Package, Salad, Settings, Sparkles, UserCog, Users, Wallet, HandCoins, Search } from "lucide-react";

export interface NavItem { title: string; href: string; icon: LucideIcon; permission?: string | string[]; children?: NavItem[]; accent?: "ai" | "default"; comingSoon?: boolean }

/** Exact-segment route match: `pathname.startsWith(href)` alone is wrong
 * whenever one route is a literal string prefix of an unrelated sibling
 * (e.g. "/membership-plans" and "/memberships" both start with "/members"). */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const primaryNav: NavItem[] = [
  { title: "Command Center", href: "/command-center", icon: LayoutDashboard },
  { title: "Members", href: "/members", icon: Users, permission: ["members.read", "members.read_assigned"] },
  { title: "Sales", href: "/crm", icon: Megaphone, permission: "leads.read", children: [
    { title: "Sales OS", href: "/crm", icon: Megaphone, permission: "leads.read" },
    { title: "Follow-ups", href: "/crm/follow-ups", icon: ListChecks, permission: "leads.read" },
    { title: "Sales Intelligence", href: "/crm/analytics", icon: BarChart3, permission: "reports.view" },
  ] },
  { title: "Training", href: "/pt-operations", icon: Dumbbell, permission: "workouts.read", children: [
    { title: "PT OS", href: "/pt-operations", icon: Dumbbell, permission: "workouts.read" },
    { title: "PT Sessions", href: "/pt-operations/sessions", icon: CalendarCheck, permission: "pt-sessions.read" },
    { title: "Calendar", href: "/calendar", icon: CalendarDays, permission: ["appointments.read", "appointments.read_assigned"] },
    { title: "Group Training", href: "/classes", icon: Users, permission: "classes.read" },
    { title: "Today's Sessions", href: "/workout-sessions", icon: CalendarCheck, permission: "workouts.read" },
    { title: "Workouts", href: "/workouts", icon: Dumbbell, permission: "workouts.read" },
    { title: "Nutrition", href: "/nutrition", icon: Salad, permission: "nutrition.read" },
  ] },
  { title: "Finance", href: "/billing", icon: Wallet, permission: "payments.read", children: [
    { title: "Payments", href: "/billing", icon: Wallet, permission: "payments.read" },
    { title: "Membership Lifecycle", href: "/memberships", icon: CreditCard, permission: "memberships.read" },
    { title: "Membership Plans", href: "/membership-plans", icon: CreditCard, permission: "membership_plans.read" },
    { title: "Payroll", href: "/payroll", icon: HandCoins, permission: "payroll.read" },
  ] },
  { title: "Operations", href: "/attendance", icon: CalendarCheck, permission: "attendance.read", children: [
    { title: "Attendance", href: "/attendance", icon: CalendarCheck, permission: "attendance.read" },
    { title: "Inventory", href: "/inventory", icon: Package, permission: "inventory.read" },
    { title: "Staff", href: "/staff", icon: UserCog, permission: "users.read" },
    { title: "Branches", href: "/branches", icon: Building2, permission: "branches.read" },
  ] },
  { title: "Insights", href: "/owner-os", icon: BarChart3, permission: "reports.view" },
  { title: "Search", href: "/search", icon: Search, permission: "search.read" },
  { title: "Intelligence", href: "/intelligence", icon: Brain, permission: "reports.view", accent: "ai" },
  { title: "AI Agent", href: "/ai", icon: Sparkles, permission: "ai.generate", accent: "ai", children: [
    { title: "AI Agent", href: "/ai", icon: Sparkles, permission: "ai.generate", accent: "ai" },
    { title: "Action Queue", href: "/ai-actions", icon: CheckSquare, permission: "ai.generate" },
  ] },
];

export const comingSoonNav: NavItem[] = [];
export const settingsNav: NavItem = { title: "Settings", href: "/settings", icon: Settings, permission: "organizations.read" };
