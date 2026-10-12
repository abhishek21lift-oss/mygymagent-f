"use client"

import * as React from "react"
import { UserMinus } from "lucide-react"

import { DataState } from "@/components/shared/data-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useIrregularMembers,
  type IrregularMember,
  type SubscriptionStatus,
} from "@/lib/hooks/use-whatsapp-automation"

const RANGE_PRESETS = [3, 7, 15, 30] as const
const CUSTOM = "custom" as const
type Selection = (typeof RANGE_PRESETS)[number] | typeof CUSTOM

/**
 * Who the "Irregular Members" schedule would re-engage, and why.
 *
 * Read-only on purpose: this card only reads the report, so opening the
 * page never messages anyone. The scheduled scan is what sends, and only
 * inside its own window with the switch on.
 */
export function IrregularMembersCard() {
  const [selection, setSelection] = React.useState<Selection>(7)
  const [customDays, setCustomDays] = React.useState("14")
  const [applied, setApplied] = React.useState<number | null>(7)

  const customError =
    selection === CUSTOM && !/^\d+$/.test(customDays)
      ? "Enter a whole number of days."
      : selection === CUSTOM && (Number(customDays) < 1 || Number(customDays) > 90)
        ? "Choose between 1 and 90 days."
        : null

  const query = useIrregularMembers(applied)

  function select(value: Selection) {
    setSelection(value)
    if (value !== CUSTOM) setApplied(value)
  }

  function applyCustom() {
    if (customError) return
    setApplied(Number(customDays))
  }

  return (
    <Card className="overflow-hidden border-border bg-card dark:bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
            <UserMinus className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-950 dark:text-stone-50">
              Irregular members
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              Members who have not checked in for a while. Preview only — nothing is sent from this screen.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Inactivity range">
            {RANGE_PRESETS.map((days) => (
              <Button
                key={days}
                type="button"
                size="sm"
                variant={selection === days ? "default" : "outline"}
                onClick={() => select(days)}
                className="min-h-11 rounded-lg"
              >
                Last {days} days
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={selection === CUSTOM ? "default" : "outline"}
              onClick={() => select(CUSTOM)}
              className="min-h-11 rounded-lg"
            >
              Custom
            </Button>
          </div>

          {selection === CUSTOM && (
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="irregular-custom-days" className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Days
                </Label>
                <Input
                  id="irregular-custom-days"
                  type="number"
                  min={1}
                  max={90}
                  inputMode="numeric"
                  value={customDays}
                  onChange={(event) => setCustomDays(event.target.value)}
                  aria-invalid={customError ? true : undefined}
                  className="h-11 w-24 rounded-lg tabular-nums"
                />
              </div>
              <Button type="button" onClick={applyCustom} disabled={Boolean(customError)} className="min-h-11 rounded-lg">
                Apply
              </Button>
            </div>
          )}
        </div>

        {customError && (
          <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {customError}
          </p>
        )}

        <DataState
          isLoading={query.isPending}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          errorMessage="Could not load irregular members."
          isEmpty={(query.data?.members ?? []).length === 0}
          emptyIcon={UserMinus}
          emptyTitle="No irregular members"
          emptyDescription={
            applied
              ? `Every member has checked in within the last ${applied} days.`
              : "Every member has checked in recently."
          }
          skeletonRows={4}
        >
          <IrregularTable members={query.data?.members ?? []} />
        </DataState>
      </CardContent>
    </Card>
  )
}

function IrregularTable({ members }: { members: IrregularMember[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Last check-in</TableHead>
          <TableHead>Inactive for</TableHead>
          <TableHead>Subscription</TableHead>
          <TableHead>Expiry</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div className="font-medium text-stone-900 dark:text-stone-100">{member.name}</div>
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {member.phone ?? member.email ?? "No contact"}
              </div>
            </TableCell>
            <TableCell className="tabular-nums text-stone-700 dark:text-stone-300">
              {member.lastCheckInAt ? new Date(member.lastCheckInAt).toLocaleDateString() : "Never"}
            </TableCell>
            <TableCell className="tabular-nums text-stone-700 dark:text-stone-300">
              {member.daysInactive} {member.daysInactive === 1 ? "day" : "days"}
            </TableCell>
            <TableCell>
              <Badge variant={subscriptionVariant(member.subscriptionStatus)} className="rounded-full">
                {subscriptionLabel(member.subscriptionStatus)}
              </Badge>
            </TableCell>
            <TableCell className="tabular-nums text-stone-700 dark:text-stone-300">
              {member.membershipEndDate ? new Date(member.membershipEndDate).toLocaleDateString() : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function subscriptionLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active"
    case "INACTIVE":
      return "Inactive"
    default:
      return "None"
  }
}

function subscriptionVariant(status: SubscriptionStatus): "success" | "destructive" | "secondary" {
  switch (status) {
    case "ACTIVE":
      return "success"
    case "INACTIVE":
      return "destructive"
    default:
      return "secondary"
  }
}