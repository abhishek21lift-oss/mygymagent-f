import type { LucideIcon } from "lucide-react";
import {
  BarChart3, Bell, Brain, Building2, CalendarCheck, CalendarDays, CheckSquare,
  ClipboardList, CreditCard, Dumbbell, Gauge, HandCoins, Home,
  ListChecks, Megaphone, MessageCircle, MessagesSquare, MonitorSmartphone, Package,
  Receipt, Rocket, Salad, Search, Settings, ShieldCheck, ShoppingBag, Sparkles, Store,
  UserCog, UserPlus, Users, Wallet, Workflow,
} from "lucide-react";

import type { Accent } from "@/lib/section-accent";

export interface NavItem {
  title: string
  /** Where room is short (the rail's quick actions). */
  shortTitle?: string
  href: string
  icon: LucideIcon
  permission?: string | string[]
  /** Shown only to platform staff. Their access is decided by
   * `User.platformRole`, not by an RBAC grant, so no `permission` value
   * can express it. */
  platformOnly?: boolean
  /** A group: the row opens and closes its list instead of navigating.
   * `href` is then only an id and the fallback for the collapsed rail. */
  children?: NavItem[]
  accent?: "ai" | "default"
  /** A group's own hue. Unset, it takes the hue of its first page. */
  hue?: Accent
  /** Opens in a new tab: a full-screen surface outside the app shell. */
  external?: boolean
  comingSoon?: boolean
}

/** Exact-segment route match: `pathname.startsWith(href)` alone is wrong
 * whenever one route is a literal string prefix of an unrelated sibling
 * (e.g. "/membership-plans" and "/memberships" both start with "/members"). */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one child of `items` the current route belongs to. Nested routes
 * make several match -- on /inventory/sales both "Inventory" and
 * "Product sales" do -- and only the most specific should light up.
 */
export function activeChildHref(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null;
  for (const item of items) {
    if (isNavItemActive(pathname, item.href) && (!best || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

type Can = (permission: string | string[]) => boolean;

/**
 * The item as this user may see it, or null.
 *
 * A group is visible when any of its pages is, and shows only those. It
 * used to be gated on one permission of its own, so a group could hide
 * pages the user could open (an inventory manager, with no
 * `attendance.read`, never saw Operations and so never saw Inventory) or
 * show a heading over nothing.
 */
export function visibleNavItem(item: NavItem, can: Can, isPlatformStaff: boolean): NavItem | null {
  if (item.platformOnly && !isPlatformStaff) return null;
  if (item.children) {
    const children = item.children
      .map((child) => visibleNavItem(child, can, isPlatformStaff))
      .filter((child): child is NavItem => child !== null);
    if (children.length === 0) return null;
    return { ...item, children };
  }
  if (item.permission && !can(item.permission)) return null;
  return item;
}

/**
 * The work areas, in the order a gym is run: the members, winning new
 * ones and keeping in touch, their training, the money, the building and
 * the team.
 *
 * Every page reachable from a screen is also reachable from here. Gym
 * profile, WhatsApp, message templates, notification settings, security,
 * the subscription, the setup guide, product sales and the check-in kiosk
 * were each linked only from inside another page.
 */
export const primaryNav: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: Home },

  { title: "Members", href: "/members", icon: Users, hue: "violet", children: [
    { title: "All members", href: "/members", icon: Users, permission: ["members.read", "members.read_assigned"] },
    { title: "Add member", href: "/members/new", icon: UserPlus, permission: "members.create" },
    { title: "Memberships", href: "/memberships", icon: CreditCard, permission: ["memberships.read", "memberships.read_assigned"] },
  ] },

  { title: "Sales", href: "/crm", icon: Megaphone, hue: "rose", children: [
    { title: "Leads", href: "/crm", icon: Megaphone, permission: "leads.read" },
    { title: "Follow-ups", href: "/crm/follow-ups", icon: ListChecks, permission: "leads.read" },
    { title: "Sales analytics", href: "/crm/analytics", icon: BarChart3, permission: "reports.view" },
  ] },

  { title: "Engage", href: "/engage", icon: MessagesSquare, hue: "orange", children: [
    { title: "WhatsApp", href: "/settings/whatsapp", icon: MessageCircle, permission: ["whatsapp.read", "whatsapp.manage"] },
    { title: "Automations", href: "/automation", icon: Workflow, permission: "reports.view" },
    { title: "Message templates", href: "/settings/messages", icon: ClipboardList, permission: "notifications.manage" },
  ] },

  { title: "Training", href: "/pt-operations", icon: Dumbbell, hue: "emerald", children: [
    { title: "PT overview", href: "/pt-operations", icon: Dumbbell, permission: "workouts.read" },
    { title: "PT sessions", href: "/pt-operations/sessions", icon: CalendarCheck, permission: ["pt-sessions.read", "pt-sessions.read_assigned"] },
    { title: "Calendar", href: "/calendar", icon: CalendarDays, permission: ["appointments.read", "appointments.read_assigned"] },
    { title: "Classes", href: "/classes", icon: Users, permission: "classes.read" },
    { title: "Today's sessions", href: "/workout-sessions", icon: CalendarCheck, permission: ["workouts.read", "workouts.read_assigned"] },
    { title: "Workout plans", href: "/workouts", icon: Dumbbell, permission: ["workouts.read", "workouts.read_assigned"] },
    { title: "Nutrition", href: "/nutrition", icon: Salad, permission: "nutrition.read" },
  ] },

  { title: "Finance", href: "/billing", icon: Wallet, hue: "amber", children: [
    { title: "Payments & invoices", href: "/billing", icon: Receipt, permission: "payments.read" },
    { title: "Plans & pricing", href: "/membership-plans", icon: CreditCard, permission: "membership_plans.read" },
  ] },

  { title: "Operations", href: "/attendance", icon: Store, hue: "cyan", children: [
    { title: "Attendance", href: "/attendance", icon: CalendarCheck, permission: ["attendance.read", "attendance.read_assigned"] },
    { title: "Check-in kiosk", href: "/kiosk", icon: MonitorSmartphone, permission: ["kiosk.manage", "attendance.create"], external: true },
    { title: "Inventory", href: "/inventory", icon: Package, permission: "inventory.read" },
    { title: "Product sales", href: "/inventory/sales", icon: ShoppingBag, permission: "inventory.read" },
    { title: "Branches", href: "/branches", icon: Building2, permission: "branches.read" },
  ] },

  { title: "Team", href: "/staff", icon: UserCog, hue: "indigo", children: [
    { title: "Staff", href: "/staff", icon: UserCog, permission: "users.read" },
    // Two grants, one page. `/payroll` carries staff salary and leave
    // (`hr.read`) alongside trainer commissions (`payroll.read`); the
    // seeded BRANCH_MANAGER holds only the first, and is the role whose
    // job this is.
    { title: "Payroll & leave", href: "/payroll", icon: HandCoins, permission: ["hr.read", "payroll.read"] },
  ] },
];

/**
 * Tools rather than work areas: somewhere you go on purpose.
 */
export const secondaryNav: NavItem[] = [
  // Business health and the Command centre were second and third copies
  // of Home's figures under different definitions; Home is the one now,
  // and their addresses redirect there (next.config.ts).
  { title: "Insights", href: "/intelligence", icon: BarChart3, hue: "blue", children: [
    { title: "Member intelligence", href: "/intelligence", icon: Brain, permission: "reports.view" },
    { title: "Business OS", href: "/business-os", icon: Gauge, permission: "reports.view" },
  ] },
  { title: "AI agent", href: "/ai", icon: Sparkles, accent: "ai", children: [
    { title: "Ask the agent", href: "/ai", icon: Sparkles, permission: "ai.generate", accent: "ai" },
    { title: "Action queue", href: "/ai-actions", icon: CheckSquare, permission: "ai.generate", accent: "ai" },
  ] },
  { title: "Search", href: "/search", icon: Search, permission: "search.read" },
];

export const comingSoonNav: NavItem[] = [];

/**
 * Cross-tenant administration, for platform staff only. Not part of
 * running a gym, so nobody who signs in to one ever sees it.
 */
export const platformNav: NavItem[] = [
  { title: "Organizations", href: "/platform/organizations", icon: Building2, platformOnly: true },
];

export const settingsNav: NavItem = { title: "Settings", href: "/settings", icon: Settings, hue: "orange", children: [
  { title: "General", href: "/settings", icon: Settings, permission: "organizations.read" },
  { title: "Gym profile", href: "/settings/profile", icon: Store, permission: "organizations.read" },
  // Everyone's own alert preferences: no grant needed.
  { title: "My notifications", href: "/settings/notifications", icon: Bell },
  { title: "Security", href: "/settings/security", icon: ShieldCheck, permission: ["organizations.update", "audit.read"] },
  { title: "Subscription", href: "/settings/billing", icon: CreditCard, permission: "platform_billing.read" },
  { title: "Setup guide", href: "/onboarding", icon: Rocket, permission: "organizations.update" },
] };

/** One-tap actions at the top of the rail: the two things the front desk
 * does all day. */
export const quickActions: NavItem[] = [
  { title: "New member", shortTitle: "Member", href: "/members/new", icon: UserPlus, permission: "members.create", hue: "violet" },
  { title: "Check in", href: "/attendance", icon: CalendarCheck, permission: ["attendance.create", "attendance.create_assigned"], hue: "cyan" },
];
