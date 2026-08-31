import type { LucideIcon } from "lucide-react";
import { BarChart3, Building2, CalendarCheck, CheckSquare, CreditCard, Dumbbell, LayoutDashboard, Megaphone, Package, Salad, Settings, Sparkles, UserCog, Users, Wallet } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string | string[];
  children?: NavItem[];
  accent?: "ai" | "default";
  comingSoon?: boolean;
}

export const primaryNav: NavItem[] = [
  { title: "Command Center", href: "/command-center", icon: LayoutDashboard },
  { title: "Members", href: "/members", icon: Users, permission: ["members.read", "members.read_assigned"] },
  { title: "Sales", href: "/crm", icon: Megaphone, permission: "leads.read" },
  { title: "Training", href: "/pt-operations", icon: Dumbbell, permission: "workouts.read", children: [
    { title: "PT OS", href: "/pt-operations", icon: Dumbbell, permission: "workouts.read" },
    { title: "PT Sessions", href: "/pt-operations/sessions", icon: CalendarCheck, permission: "pt-sessions.read" },
    { title: "Today's Sessions", href: "/workout-sessions", icon: CalendarCheck, permission: "workouts.read" },
    { title: "Workouts", href: "/workouts", icon: Dumbbell, permission: "workouts.read" },
    { title: "Nutrition", href: "/nutrition", icon: Salad, permission: "nutrition.read" },
  ] },
  { title: "Finance", href: "/billing", icon: Wallet, permission: "payments.read", children: [
    { title: "Payments", href: "/billing", icon: Wallet, permission: "payments.read" },
    { title: "Membership Plans", href: "/membership-plans", icon: CreditCard, permission: "membership_plans.read" },
  ] },
  { title: "Operations", href: "/attendance", icon: CalendarCheck, permission: "attendance.read", children: [
    { title: "Attendance", href: "/attendance", icon: CalendarCheck, permission: "attendance.read" },
    { title: "Inventory", href: "/inventory", icon: Package, permission: "inventory.read" },
    { title: "Staff", href: "/staff", icon: UserCog, permission: "users.read" },
    { title: "Branches", href: "/branches", icon: Building2, permission: "branches.read" },
  ] },
  { title: "Insights", href: "/owner-os", icon: BarChart3, permission: "organizations.read" },
  { title: "AI Agent", href: "/ai", icon: Sparkles, permission: "ai.generate", accent: "ai", children: [
    { title: "AI Agent", href: "/ai", icon: Sparkles, permission: "ai.generate", accent: "ai" },
    { title: "Action Queue", href: "/ai-actions", icon: CheckSquare, permission: "ai.generate" },
  ] },
];

export const comingSoonNav: NavItem[] = [];
export const settingsNav: NavItem = { title: "Settings", href: "/settings", icon: Settings, permission: "organizations.read" };
