"use client";

import type { CSSProperties } from "react";
import {
  Apple,
  BadgeCheck,
  Briefcase,
  Calculator,
  Crown,
  Dumbbell,
  Handshake,
  KeyRound,
  MailCheck,
  Package,
  PauseCircle,
  Shield,
  Smartphone,
  UserRound,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";

import type { Accent } from "@/lib/section-accent";
import type { StaffAccessState } from "@/lib/types/gym";
import { cn } from "@/lib/utils";

/** A role's face on the staff screens. Unknown (custom) roles fall back
 * to a neutral briefcase in the section's own hue. */
const ROLE_LOOK: Record<string, { icon: LucideIcon; accent: Accent; blurb: string }> = {
  ORG_OWNER: { icon: Crown, accent: "amber", blurb: "Everything, every branch" },
  ORG_ADMIN: { icon: Shield, accent: "indigo", blurb: "Runs the gym and its staff" },
  BRANCH_MANAGER: { icon: Briefcase, accent: "blue", blurb: "Runs one branch day to day" },
  HEAD_TRAINER: { icon: BadgeCheck, accent: "emerald", blurb: "Leads the training team" },
  TRAINER: { icon: Dumbbell, accent: "emerald", blurb: "PT, workouts and classes" },
  NUTRITIONIST: { icon: Apple, accent: "orange", blurb: "Diet plans and check-ins" },
  RECEPTIONIST: { icon: Smartphone, accent: "cyan", blurb: "Front desk and check-ins" },
  SALES_EXECUTIVE: { icon: Handshake, accent: "rose", blurb: "Leads, trials and sales" },
  ACCOUNTANT: { icon: Calculator, accent: "amber", blurb: "Payments, invoices, payroll" },
  INVENTORY_MANAGER: { icon: Package, accent: "orange", blurb: "Stock and product sales" },
  STAFF: { icon: UserRound, accent: "violet", blurb: "Basic access" },
};

export function roleLook(key: string) {
  return ROLE_LOOK[key] ?? { icon: Briefcase, accent: "cyan" as Accent, blurb: "Custom role" };
}

/** The accent's variables under the section names, so one set of classes
 * paints any hue. */
export function accentVars(accent: Accent): CSSProperties {
  return {
    "--tone": `var(--a-${accent})`,
    "--tone-ink": `var(--a-${accent}-ink)`,
    "--tone-tint": `var(--a-${accent}-tint)`,
    "--tone-wash": `var(--a-${accent}-wash)`,
    "--tone-grad-1": `var(--a-${accent}-grad-1)`,
    "--tone-grad-2": `var(--a-${accent}-grad-2)`,
    "--tone-on": `var(--a-${accent}-on)`,
  } as CSSProperties;
}

const AVATAR_HUES: Accent[] = ["violet", "indigo", "blue", "cyan", "emerald", "amber", "orange", "rose"];

/** The same person always gets the same colour. */
export function avatarAccent(seed: string): Accent {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}

export function initials(firstName: string, lastName: string) {
  const letters = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return letters || "?";
}

export function StaffAvatar({
  firstName,
  lastName,
  seed,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  seed: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        ...accentVars(avatarAccent(seed)),
        backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))",
        color: "var(--tone-on)",
      }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold tracking-tight shadow-sm ring-2 ring-background",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-16 text-xl",
        className,
      )}
    >
      {initials(firstName, lastName)}
    </span>
  );
}

const ACCESS_LOOK: Record<StaffAccessState, { label: string; icon: LucideIcon; accent: Accent }> = {
  SIGNED_IN: { label: "Can sign in", icon: KeyRound, accent: "emerald" },
  INVITE_PENDING: { label: "Invite pending", icon: MailCheck, accent: "amber" },
  NO_ACCESS: { label: "No app access", icon: UserRoundX, accent: "violet" },
  OFF: { label: "Switched off", icon: PauseCircle, accent: "rose" },
};

export function AccessBadge({ state }: { state: StaffAccessState }) {
  const look = ACCESS_LOOK[state];
  const Icon = look.icon;
  return (
    <span
      style={{ ...accentVars(look.accent), background: "var(--tone-tint)", color: "var(--tone-ink)" }}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {look.label}
    </span>
  );
}

/** A role as a coloured pill. */
export function RolePill({ roleKey, name }: { roleKey: string; name: string }) {
  const look = roleLook(roleKey);
  const Icon = look.icon;
  return (
    <span
      style={{ ...accentVars(look.accent), background: "var(--tone-tint)", color: "var(--tone-ink)" }}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold"
    >
      <Icon className="size-3" aria-hidden="true" />
      {name}
    </span>
  );
}
