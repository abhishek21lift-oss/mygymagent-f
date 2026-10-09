"use client"

import * as React from "react"
import { BarChart3, CalendarDays, Clock, Loader2, Plus, Sparkles, UserCheck, Users } from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useBranches } from "@/lib/hooks/use-branches"
import {
  useBookClass,
  useClassAnalytics,
  useClassPrograms,
  useClassSessions,
  useCreateClassProgram,
  useCreateClassSession,
} from "@/lib/hooks/use-classes"
import { DataState } from "@/components/shared/data-state"
import { MemberPicker } from "@/components/shared/member-picker"
import { PageHero } from "@/components/shared/page-hero"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SessionRosterDialog } from "./session-roster-dialog"

/** The window GET /classes/analytics covers when it is given no dates.
 * Named here so the heading cannot drift from what the numbers mean; the
 * dates themselves stay server-side, which also keeps this render pure. */
const ANALYTICS_DAYS = 30

function AnalyticsSection({ branchId }: { branchId: string }) {
  const analytics = useClassAnalytics({ branchId })
  const rows = analytics.data ?? []

  return (
    <Card className="overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="size-4" aria-hidden="true" />
              </span>
              Attendance Performance
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Last {ANALYTICS_DAYS} days completion and attendance show rates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DataState
          isLoading={analytics.isPending}
          isError={analytics.isError}
          onRetry={() => void analytics.refetch()}
          errorMessage="Class analytics could not be loaded."
          isEmpty={rows.length === 0}
          emptyIcon={BarChart3}
          emptyTitle="Nothing to report yet"
          emptyDescription={`No sessions ran at this branch in the last ${ANALYTICS_DAYS} days.`}
          skeletonRows={3}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/10 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3.5">Programme</th>
                  <th className="px-6 py-3.5 text-right">Bookings</th>
                  <th className="px-6 py-3.5 text-right">Attended</th>
                  <th className="px-6 py-3.5 text-right">No-shows</th>
                  <th className="px-6 py-3.5 text-right">Show Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row) => {
                  const settled = row.attended + row.noShows
                  const rate = settled === 0 ? null : Math.round((row.attended / settled) * 100)
                  return (
                    <tr
                      key={row.classProgramId}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-3.5 font-bold text-foreground">
                        {row.className}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono tabular-nums text-foreground">
                        {row.totalBookings}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {row.attended}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono tabular-nums text-rose-500">
                        {row.noShows}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {rate === null ? (
                          <span className="font-mono text-muted-foreground">—</span>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${
                                  rate >= 80
                                    ? "bg-emerald-500"
                                    : rate >= 60
                                    ? "bg-indigo-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold tabular-nums text-foreground">
                              {rate}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </DataState>
      </CardContent>
    </Card>
  )
}

export default function ClassesPage() {
  const { hasPermission } = useAuth()
  const branches = useBranches({ page: 1, pageSize: 100 })
  const [branchId, setBranchId] = React.useState("")
  const selectedBranchId = branchId || branches.data?.items?.[0]?.id || ""

  const programs = useClassPrograms(selectedBranchId || undefined)
  const sessions = useClassSessions(selectedBranchId || undefined)

  const createProgram = useCreateClassProgram()
  const createSession = useCreateClassSession()
  const book = useBookClass()

  const [name, setName] = React.useState("")
  const [capacity, setCapacity] = React.useState("20")
  const [duration, setDuration] = React.useState("60")
  const [programId, setProgramId] = React.useState("")
  const [start, setStart] = React.useState("")
  const [end, setEnd] = React.useState("")
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null)

  const programOptions = programs.data ?? []
  const selectedProgramId =
    programOptions.some((p) => p.id === programId) ? programId : programOptions[0]?.id ?? ""

  async function submitProgram() {
    if (!selectedBranchId || !name.trim()) return
    try {
      await createProgram.mutateAsync({
        branchId: selectedBranchId,
        name: name.trim(),
        capacity: Number(capacity),
        durationMinutes: Number(duration),
      })
      setName("")
      toast.success("Class program created")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create class")
    }
  }

  async function submitSession() {
    if (!selectedBranchId || !selectedProgramId || !start || !end) return
    try {
      await createSession.mutateAsync({
        branchId: selectedBranchId,
        classProgramId: selectedProgramId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      })
      toast.success("Class session scheduled")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to schedule session")
    }
  }

  async function bookMember(sessionId: string) {
    if (!member) {
      toast.error("Pick a member first")
      return
    }
    try {
      const result = await book.mutateAsync({ sessionId, memberId: member.id })
      toast.success(
        result.status === "WAITLISTED"
          ? `${member.label} added to the waitlist`
          : `${member.label} booked in`,
      )
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Booking failed")
    }
  }

  if (!hasPermission("classes.read")) {
    return (
      <div className="p-8">
        <Card className="rounded-3xl border border-border/80 bg-card p-8">
          <CardContent className="p-0">You do not have permission to view Group Training.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <PageHero
        id="classes-title"
        icon={CalendarDays}
        title="Classes"
      />

      {/* Control bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-border/80 bg-card/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="class-branch" className="text-xs font-semibold text-muted-foreground">
              Active Branch
            </Label>
            <div className="w-56">
              <Select
                value={selectedBranchId}
                onValueChange={setBranchId}
                disabled={branches.isLoading}
              >
                <SelectTrigger id="class-branch" className="h-10 rounded-xl bg-background/80">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.data?.items?.map((branch: { id: string; name: string }) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasPermission("classes.book") && (
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Quick Member Booking
              </Label>
              <div className="w-64">
                <MemberPicker value={member} onChange={setMember} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Timetable Active</span>
        </div>
      </div>

      {/* Creation and Scheduling Panel */}
      {hasPermission("classes.manage") && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
                Create Class Programme
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Define course template, capacity limit, and duration
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <Label htmlFor="program-name" className="text-xs font-semibold">
                  Programme Name
                </Label>
                <Input
                  id="program-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HIIT Athletics, Vinyasa Flow, Powerlifting"
                  className="mt-1.5 rounded-xl bg-background/80"
                />
              </div>
              <div>
                <Label htmlFor="program-capacity" className="text-xs font-semibold">
                  Capacity (seats)
                </Label>
                <Input
                  id="program-capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="mt-1.5 rounded-xl bg-background/80 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="program-duration" className="text-xs font-semibold">
                  Duration (mins)
                </Label>
                <Input
                  id="program-duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1.5 rounded-xl bg-background/80 font-mono"
                />
              </div>
              <div className="flex items-end">
                <Button
                  disabled={createProgram.isPending || !selectedBranchId || !name.trim()}
                  aria-busy={createProgram.isPending}
                  onClick={() => void submitProgram()}
                  className="w-full rounded-xl"
                >
                  {createProgram.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 size-4" />
                  )}
                  Create Programme
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <CalendarDays className="size-4" aria-hidden="true" />
                </span>
                Schedule Session
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Add an upcoming class session to the active timetable
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="session-program" className="text-xs font-semibold">
                  Class Programme
                </Label>
                <div className="mt-1.5">
                  <Select
                    value={selectedProgramId}
                    onValueChange={setProgramId}
                    disabled={programOptions.length === 0}
                  >
                    <SelectTrigger id="session-program" className="w-full rounded-xl bg-background/80">
                      <SelectValue placeholder="Choose class program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name} · {program.capacity} seats ({program.durationMinutes || 60}m)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="session-start" className="text-xs font-semibold">
                  Start Date & Time
                </Label>
                <Input
                  id="session-start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="mt-1.5 rounded-xl bg-background/80"
                />
              </div>
              <div>
                <Label htmlFor="session-end" className="text-xs font-semibold">
                  End Date & Time
                </Label>
                <Input
                  id="session-end"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="mt-1.5 rounded-xl bg-background/80"
                />
              </div>
              <Button
                disabled={createSession.isPending || !selectedProgramId || !start || !end}
                aria-busy={createSession.isPending}
                onClick={() => void submitSession()}
                className="mt-1 rounded-xl sm:col-span-2"
              >
                {createSession.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CalendarDays className="mr-2 size-4" />
                )}
                Schedule Session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Timetable Sessions */}
      <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Upcoming Timetable
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Live sessions scheduled for {branches.data?.items?.find((b) => b.id === selectedBranchId)?.name ?? "selected branch"}
              </CardDescription>
            </div>
            {sessions.data && sessions.data.length > 0 && (
              <Badge variant="outline" className="rounded-full font-mono text-xs font-bold">
                {sessions.data.length} sessions
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <DataState
            isLoading={sessions.isPending}
            isError={sessions.isError}
            onRetry={() => void sessions.refetch()}
            errorMessage="Class sessions could not be loaded."
            isEmpty={(sessions.data ?? []).length === 0}
            emptyIcon={CalendarDays}
            emptyTitle="No sessions scheduled"
            emptyDescription="Nothing is on the timetable for the current window."
          >
            <div className="grid gap-4">
              {(sessions.data ?? []).map((session) => {
                const startDate = new Date(session.startTime)
                const endDate = new Date(session.endTime)
                const occupancyRate = session.effectiveCapacity > 0
                  ? Math.min(100, Math.round((session.bookedCount / session.effectiveCapacity) * 100))
                  : 0
                const isFull = session.bookedCount >= session.effectiveCapacity

                return (
                  <div
                    key={session.id}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      {/* Apple-style Calendar Badge */}
                      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 text-indigo-700 shadow-xs dark:border-indigo-900/50 dark:from-indigo-950/60 dark:to-indigo-900/20 dark:text-indigo-300">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {startDate.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {startDate.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-foreground">
                            {session.className}
                          </h4>
                          {isFull && (
                            <Badge variant="destructive" className="rounded-full text-[10px] uppercase">
                              Full
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className="size-3 text-muted-foreground" aria-hidden="true" />
                            {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="size-3 text-muted-foreground" aria-hidden="true" />
                            {session.instructorFirstName
                              ? `${session.instructorFirstName} ${session.instructorLastName || ""}`
                              : "Instructor TBD"}
                          </span>
                        </div>

                        {/* Capacity meter */}
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                occupancyRate >= 90
                                  ? "bg-rose-500"
                                  : occupancyRate >= 70
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                            {session.bookedCount} / {session.effectiveCapacity} booked ({occupancyRate}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                      {session.waitlistCount > 0 && (
                        <Badge variant="secondary" className="rounded-full font-mono text-xs">
                          {session.waitlistCount} waitlisted
                        </Badge>
                      )}
                      <SessionRosterDialog
                        sessionId={session.id}
                        programName={session.className}
                        startTime={session.startTime}
                      />
                      {hasPermission("classes.book") && (
                        <Button
                          size="sm"
                          onClick={() => void bookMember(session.id)}
                          disabled={book.isPending || !member}
                          className="rounded-xl"
                        >
                          Book Member
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </DataState>
        </CardContent>
      </Card>

      <AnalyticsSection branchId={selectedBranchId} />
    </div>
  )
}
