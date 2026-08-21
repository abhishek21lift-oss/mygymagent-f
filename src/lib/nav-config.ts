import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  UserCog,
  Building2,
  Sparkles,
  Wallet,
  Dumbbell,
  Salad,
  Package,
  Megaphone,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see this item; omit for anything an
   * authenticated user can always reach (e.g. the dashboard). */
  permission?: string;
  /** Marks a reserved-but-not-yet-built module (see backend module READMEs). */
  comingSoon?: boolean;
}

export const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Members", href: "/members", icon: Users, permission: "members.read" },
  {
    title: "Membership Plans",
    href: "/membership-plans",
    icon: CreditCard,
    permission: "membership_plans.read",
  },
  { title: "Attendance", href: "/attendance", icon: CalendarCheck, permission: "attendance.read" },
  { title: "Billing", href: "/billing", icon: Wallet, permission: "payments.read" },
  { title: "Workouts", href: "/workouts", icon: Dumbbell, permission: "workouts.read" },
  { title: "Leads / CRM", href: "/crm", icon: Megaphone, permission: "leads.read" },
  { title: "AI Assistant", href: "/ai", icon: Sparkles, permission: "ai.generate" },
  { title: "Staff", href: "/staff", icon: UserCog, permission: "users.read" },
  { title: "Branches", href: "/branches", icon: Building2, permission: "branches.read" },
];

export const comingSoonNav: NavItem[] = [
  { title: "Nutrition", href: "/nutrition", icon: Salad, permission: "nutrition.read", comingSoon: true },
  { title: "Inventory", href: "/inventory", icon: Package, permission: "inventory.read", comingSoon: true },
];

export const settingsNav: NavItem = {
  title: "Settings",
  href: "/settings",
  icon: Settings,
  permission: "organizations.read",
};
