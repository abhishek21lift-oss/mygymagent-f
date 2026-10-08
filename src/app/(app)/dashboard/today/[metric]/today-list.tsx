"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useAttendance } from "@/lib/hooks/use-attendance";
import { useBranches } from "@/lib/hooks/use-branches";
import { useLeads } from "@/lib/hooks/use-leads";
import { useMembers } from "@/lib/hooks/use-members";
import { useMemberships } from "@/lib/hooks/use-memberships";
import { useOrganization } from "@/lib/hooks/use-organization";
import { usePayments } from "@/lib/hooks/use-payments";
import { memberStatusLabel } from "@/lib/member-status";
import type { Paginated } from "@/lib/types/pagination";
import { displayCurrencyAmount } from "@/lib/utils";

import { addDays, shortDay, useGymToday } from "../../gym-day";
import { TODAY_METRICS, todayMetricHref, type TodayMetric } from "./metrics";

/** The API's largest page. A gym's day almost always fits in one. */
const PAGE_SIZE = 100;

type BodyProps = { date: string; branchId?: string; timeZone?: string | null; currency: string };

/**
 * The list behind one Today figure. Every list asks the same endpoint,
 * with the same day and branch, as the tile it was opened from -- so the
 * count here and the number on the dashboard are the same records.
 */
export function TodayList({ metric, date, branchId }: { metric: TodayMetric; date?: string; branchId?: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canReadOrg = hasPermission("organizations.read");
  const organization = useOrganization({ enabled: canReadOrg });
  const timeZone = organization.data?.timezone;
  const today = useGymToday(timeZone);
  // Until the gym's timezone is known, "today" could be the wrong day.
  const ready = Boolean(date) || !canReadOrg || organization.isFetched;
  const day = date ?? today;
  const currency = organization.data?.currency ?? "INR";

  const branches = useBranches({ pageSize: 100 }, { enabled: Boolean(branchId) && hasPermission("branches.read") });
  const branchName = branchId ? branches.data?.items.find((b) => b.id === branchId)?.name : undefined;

  const meta = TODAY_METRICS[metric];
  const goTo = (nextDay: string) => router.replace(todayMetricHref(metric, nextDay, branchId));
  const isToday = day === today;

  const props: BodyProps = { date: day, branchId, timeZone, currency };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>

      <PageHero
        eyebrow="Today"
        icon={meta.icon}
        accent={meta.accent}
        title={meta.title}
        description={`${longDay(day)} · ${branchId ? (branchName ?? "One branch") : "All branches"}`}
        actions={
          <div className="flex items-center gap-1.5" role="group" aria-label="Day">
            <Button type="button" variant="outline" size="icon" className="size-11 rounded-full" onClick={() => goTo(addDays(day, -1))} aria-label="Previous day">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="min-h-11 rounded-full px-4" onClick={() => goTo(today)} disabled={isToday}>
              Today
            </Button>
            <Button type="button" variant="outline" size="icon" className="size-11 rounded-full" onClick={() => goTo(addDays(day, 1))} disabled={day >= today} aria-label="Next day">
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        }
      />

      {!ready ? (
        <Skeleton className="h-40 w-full rounded-3xl" aria-label="Loading" />
      ) : !hasPermission(meta.permission as string | string[]) ? (
        <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Your role can&apos;t see this list.
        </p>
      ) : metric === "check-ins" ? (
        <CheckIns key={day} {...props} />
      ) : metric === "collection" ? (
        <Collection key={day} {...props} />
      ) : metric === "new-members" ? (
        <NewMembers key={day} {...props} />
      ) : metric === "renewals" ? (
        <Renewals key={day} {...props} />
      ) : (
        <Leads key={day} {...props} />
      )}
    </div>
  );
}

/* ─── One list per figure ─────────────────────────────────────────── */

function CheckIns({ date, branchId, timeZone }: BodyProps) {
  const [page, setPage] = React.useState(1);
  const q = useAttendance({ date, branchId, page, pageSize: PAGE_SIZE });
  // The tile counts members' visits: staff check-ins are not on it.
  const rows = (q.data?.items ?? []).filter((row) => row.memberId);
  const admitted = rows.filter((row) => !row.deniedReason).length;
  const denied = rows.length - admitted;
  return (
    <ListShell
      query={q}
      page={page}
      onPage={setPage}
      noun="check-ins"
      count={rows.length}
      summary={`${admitted} check-in${admitted === 1 ? "" : "s"}${denied ? ` · ${denied} turned away at the door` : ""}`}
    >
      {rows.map((row) => (
        <Row
          key={row.id}
          time={clock(row.checkInAt, timeZone)}
          href={`/members/${row.memberId}`}
          name={fullName(row.member) || "Member"}
          detail={[methodLabel(row.method), row.branch?.name].filter(Boolean).join(" · ")}
          trailing={
            row.deniedReason ? (
              <Badge variant="destructive" className="rounded-full" title={row.deniedReason}>
                Turned away
              </Badge>
            ) : (
              <Badge variant="success" className="rounded-full">In</Badge>
            )
          }
          note={row.deniedReason ?? undefined}
        />
      ))}
    </ListShell>
  );
}

function Collection({ date, branchId, timeZone, currency }: BodyProps) {
  const [page, setPage] = React.useState(1);
  const q = usePayments({ date, branchId, page, pageSize: PAGE_SIZE });
  // Failed payments collected nothing and the tile leaves them out.
  const rows = (q.data?.items ?? []).filter((row) => row.status !== "FAILED");
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.currency, (totals.get(row.currency) ?? 0) + Number(row.amount));
  const totalText =
    [...totals.entries()].map(([code, sum]) => displayCurrencyAmount(sum, code, 0)).join(" + ") ||
    displayCurrencyAmount(0, currency, 0);
  const refunded = rows.some((row) => row.status !== "COMPLETED");
  return (
    <ListShell
      query={q}
      page={page}
      onPage={setPage}
      noun="payments"
      count={rows.length}
      summary={`${totalText} from ${rows.length} payment${rows.length === 1 ? "" : "s"}${refunded ? " · before refunds" : ""}`}
    >
      {rows.map((row) => (
        <Row
          key={row.id}
          time={clock(row.createdAt, timeZone)}
          href={`/members/${row.memberId}`}
          name={fullName(row.member) || "Member"}
          detail={[methodLabel(row.method), row.membershipId ? "Membership" : null, row.note].filter(Boolean).join(" · ")}
          trailing={
            <div className="flex flex-col items-end gap-1">
              <span className="font-semibold tabular-nums text-foreground">{displayCurrencyAmount(row.amount, row.currency, 0)}</span>
              {row.status !== "COMPLETED" ? (
                <Badge variant="warning" className="rounded-full">{titleCase(row.status)}</Badge>
              ) : null}
            </div>
          }
        />
      ))}
    </ListShell>
  );
}

function NewMembers({ date, branchId }: BodyProps) {
  const [page, setPage] = React.useState(1);
  // Exactly the tile's query: joinedFrom the day, joinedTo the next.
  const q = useMembers({
    joinedFrom: date,
    joinedTo: addDays(date, 1),
    page,
    pageSize: PAGE_SIZE,
    ...(branchId ? { branchId: [branchId] } : {}),
  });
  const rows = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  return (
    <ListShell query={q} page={page} onPage={setPage} noun="new members" count={rows.length} summary={`${total} joined`}>
      {rows.map((row) => (
        <Row
          key={row.id}
          href={`/members/${row.id}`}
          name={fullName(row)}
          detail={[row.memberCode, row.phone, row.primaryBranch?.name].filter(Boolean).join(" · ")}
          trailing={<Badge variant="secondary" className="rounded-full">{memberStatusLabel(row.status)}</Badge>}
        />
      ))}
    </ListShell>
  );
}

function Renewals({ date, branchId }: BodyProps) {
  const [page, setPage] = React.useState(1);
  const q = useMemberships({ createdFrom: date, createdTo: date, branchId, page, pageSize: PAGE_SIZE });
  const started = q.data?.items ?? [];
  // A renewal is a membership that follows an earlier one -- the tile's rule.
  const rows = started.filter((row) => row.previousMembershipId);
  return (
    <ListShell
      query={q}
      page={page}
      onPage={setPage}
      noun="renewals"
      count={rows.length}
      summary={`${rows.length} renewal${rows.length === 1 ? "" : "s"} of ${q.data?.total ?? 0} membership${(q.data?.total ?? 0) === 1 ? "" : "s"} started`}
    >
      {rows.map((row) => (
        <Row
          key={row.id}
          href={`/members/${row.memberId}`}
          name={fullName(row.member) || "Member"}
          detail={[row.membershipPlan?.name, `${shortDay(row.startDate.slice(0, 10))} – ${shortDay(row.endDate.slice(0, 10))}`].filter(Boolean).join(" · ")}
          trailing={<span className="font-semibold tabular-nums text-foreground">{displayCurrencyAmount(row.price, row.currency, 0)}</span>}
        />
      ))}
    </ListShell>
  );
}

function Leads({ date, branchId }: BodyProps) {
  const [page, setPage] = React.useState(1);
  const q = useLeads({ createdFrom: date, createdTo: date, branchId, page, pageSize: PAGE_SIZE });
  const rows = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  return (
    <ListShell query={q} page={page} onPage={setPage} noun="leads" count={rows.length} summary={`${total} new enquir${total === 1 ? "y" : "ies"}`}>
      {rows.map((row) => (
        <Row
          key={row.id}
          href={`/crm/leads/${row.id}`}
          name={fullName(row)}
          detail={[row.phone, row.source].filter(Boolean).join(" · ")}
          trailing={<Badge variant="secondary" className="rounded-full">{titleCase(row.status)}</Badge>}
        />
      ))}
    </ListShell>
  );
}

/* ─── Shared pieces ───────────────────────────────────────────────── */

function ListShell({
  query,
  page,
  onPage,
  noun,
  count,
  summary,
  children,
}: {
  query: { isPending: boolean; isError: boolean; refetch: () => unknown; data?: Paginated<unknown> };
  page: number;
  onPage: (page: number) => void;
  noun: string;
  count: number;
  summary: string;
  children: React.ReactNode;
}) {
  const totalPages = query.data?.totalPages ?? 1;
  return (
    <section aria-label={noun} className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
      <DataState
        isLoading={query.isPending}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        errorMessage={`The ${noun} could not be loaded.`}
        isEmpty={count === 0 && totalPages <= 1}
        emptyTitle={`No ${noun}`}
        emptyDescription="Nothing recorded for this day."
        skeletonRows={5}
      >
        <p className="mb-3 text-sm font-semibold text-foreground">{summary}</p>
        <ul className="divide-y divide-border/70">{children}</ul>
        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => onPage(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        ) : null}
      </DataState>
    </section>
  );
}

function Row({
  time,
  href,
  name,
  detail,
  trailing,
  note,
}: {
  time?: string;
  href: string;
  name: string;
  detail?: string;
  trailing?: React.ReactNode;
  note?: string;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      {time ? <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">{time}</span> : null}
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-semibold text-foreground [overflow-wrap:anywhere] hover:underline">
          {name}
        </Link>
        {detail ? <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{detail}</p> : null}
        {note ? <p className="text-xs text-destructive [overflow-wrap:anywhere]">{note}</p> : null}
      </div>
      {trailing ? <div className="shrink-0 text-right text-sm">{trailing}</div> : null}
    </li>
  );
}

function fullName(person: { firstName: string; lastName: string } | null | undefined) {
  return person ? `${person.firstName} ${person.lastName}`.trim() : "";
}

/** How a visit or payment came in, as people say it: "UPI", not "Upi". */
const METHOD_LABEL: Record<string, string> = {
  QR: "QR code",
  APP: "App",
  KIOSK: "Kiosk",
  MANUAL: "Manual",
  STAFF: "Front desk",
  BIOMETRIC: "Biometric",
  UPI: "UPI",
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

function methodLabel(method: string) {
  return METHOD_LABEL[method] ?? titleCase(method);
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

function clock(iso: string, timeZone: string | null | undefined) {
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat("en-IN", { ...options, timeZone: timeZone ?? undefined }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-IN", options).format(new Date(iso));
  }
}

/** "Thursday, 8 October" for a YYYY-MM-DD, as a calendar date. */
function longDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(
      new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)),
    );
  } catch {
    return iso;
  }
}
