"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  Dumbbell,
  FileText,
  MapPin,
  Receipt,
  Salad,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/shared/panel";
import { CheckInCode } from "@/components/portal/check-in-code";
import { usePortalMe, usePortalVisits } from "@/lib/hooks/use-portal";
import { cn } from "@/lib/utils";

function daysLeft(endDate: string) {
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

const SHORTCUTS = [
  {
    href: "/portal/plan",
    label: "My Training Plan",
    sub: "Workouts & exercises",
    icon: Dumbbell,
    tone: "from-emerald-500 to-teal-600 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  {
    href: "/portal/nutrition",
    label: "Nutrition & Diet",
    sub: "Meal plans & macros",
    icon: Salad,
    tone: "from-amber-500 to-orange-600 text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  {
    href: "/portal/progress",
    label: "Goals & Progress",
    sub: "Body metrics & PRs",
    icon: TrendingUp,
    tone: "from-violet-500 to-indigo-600 text-violet-600 dark:text-violet-400 bg-violet-500/10",
  },
  {
    href: "/portal/billing",
    label: "Invoices & Payments",
    sub: "Receipts & subscriptions",
    icon: Receipt,
    tone: "from-cyan-500 to-blue-600 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
  },
  {
    href: "/portal/documents",
    label: "Member Documents",
    sub: "Waivers & agreements",
    icon: FileText,
    tone: "from-indigo-500 to-purple-600 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
  },
] as const;

export default function PortalHome() {
  const me = usePortalMe();
  const visits = usePortalVisits(5);

  const membership = me.data?.activeMembership;
  const remaining = membership ? daysLeft(membership.endDate) : null;
  const member = me.data?.member;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <PageHero
        icon={User}
        title={member?.firstName ? `Hello, ${member.firstName}` : "Member Portal"}
        description="Your fitness dashboard, active membership, and club access pass"
      />

      {/* Apple Fitness Style Membership Status Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-indigo-50/20 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <Sparkles className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Membership Tier
                </span>
                {membership && (
                  <Badge variant="outline" className="rounded-full font-mono text-[10px]">
                    Active
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-black text-foreground">
                {membership?.membershipPlan?.name ?? "No Active Plan"}
              </h2>
              {membership && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Valid until {new Date(membership.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {remaining !== null && (
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3.5 py-2">
                <div className="text-right">
                  <p className="font-mono text-lg font-black leading-none text-foreground">
                    {Math.max(0, remaining)}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Days left
                  </p>
                </div>
              </div>
            )}
            <Link
              href="/portal/renew"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Wallet className="size-4" />
              {membership && remaining !== null && remaining <= 14
                ? "Renew Now"
                : "Explore Plans"}
            </Link>
          </div>
        </div>

        {member?.assignedTrainer && (
          <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            <User className="size-3.5 text-muted-foreground" />
            <span>
              Personal Coach:{" "}
              <strong className="text-foreground">
                {member.assignedTrainer.firstName} {member.assignedTrainer.lastName ?? ""}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Digital Access Pass (QR) */}
      <CheckInCode />

      {/* Apple Fitness Activity Shortcuts Grid */}
      <section aria-labelledby="portal-features-title">
        <h3 id="portal-features-title" className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Fitness & Account Hub
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map(({ href, label, sub, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between rounded-3xl border border-border/80 bg-card/90 p-4 shadow-xs backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", tone)}>
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground group-hover:text-primary">
                    {label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {sub}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Visits / Check-in Feed */}
      <Panel
        title="Recent Club Visits"
        titleId="portal-recent-visits"
        actions={
          <Link
            href="/portal/visits"
            className="flex items-center gap-1 text-xs font-bold text-primary underline-offset-2 hover:underline"
          >
            Full History <ArrowRight className="size-3" />
          </Link>
        }
        flush
      >
        <div className="p-4 sm:p-5">
          <DataState
            isLoading={visits.isPending}
            isError={visits.isError}
            onRetry={() => void visits.refetch()}
            errorMessage="Your visits could not be loaded."
            isEmpty={(visits.data?.items ?? []).length === 0}
            emptyIcon={CalendarCheck}
            emptyTitle="No visits yet"
            emptyDescription="Your club check-ins and session workouts will appear here."
            skeletonRows={3}
          >
            <div className="divide-y divide-border/60">
              {(visits.data?.items ?? []).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <CalendarCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {new Date(v.checkInAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })} · {new Date(v.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {v.branch?.name ?? "Main Club Floor"}
                      </p>
                    </div>
                  </div>

                  <div>
                    {v.deniedReason ? (
                      <Badge variant="destructive" className="rounded-full text-[10px]">
                        Entry Denied
                      </Badge>
                    ) : (
                      <Badge variant="success" className="rounded-full text-[10px]">
                        Checked In
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DataState>
        </div>
      </Panel>
    </div>
  );
}
