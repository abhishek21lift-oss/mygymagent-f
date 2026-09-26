"use client"

import * as React from "react"
import { BarChart3, CalendarDays, Loader2, Plus, Users } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SessionRosterDialog } from "./session-roster-dialog"

/** The window GET /classes/analytics covers when it is given no dates.
 * Named here so the heading cannot drift from what the numbers mean; the
 * dates themselves stay server-side, which also keeps this render pure. */
const ANALYTICS_DAYS = 30

function AnalyticsSection({ branchId }: { branchId: string }) {
 const analytics = useClassAnalytics({ branchId })
 const rows = analytics.data ?? []

 return (
  <Card>
   <CardHeader>
    <CardTitle className="flex items-center gap-2">
     <BarChart3 className="size-4" aria-hidden="true" />
     Attendance · last {ANALYTICS_DAYS} days
    </CardTitle>
   </CardHeader>
   <CardContent>
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
        <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
         <th className="py-2 pr-4">Programme</th>
         <th className="py-2 pr-4 text-right">Bookings</th>
         <th className="py-2 pr-4 text-right">Attended</th>
         <th className="py-2 pr-4 text-right">No-shows</th>
         <th className="py-2 text-right">Show rate</th>
        </tr>
       </thead>
       <tbody>
        {rows.map((row) => {
         // Out of the places that resolved either way. Waitlisted rows
         // never became a seat, so counting them would read as absence.
         const settled = row.attended + row.noShows
         return (
          <tr key={row.classProgramId} className="border-b last:border-0">
           <td className="py-2 pr-4 font-bold">{row.className}</td>
           <td className="py-2 pr-4 text-right tabular-nums">{row.totalBookings}</td>
           <td className="py-2 pr-4 text-right tabular-nums">{row.attended}</td>
           <td className="py-2 pr-4 text-right tabular-nums">{row.noShows}</td>
           <td className="py-2 text-right font-bold tabular-nums">
            {settled === 0 ? "—" : `${Math.round((row.attended / settled) * 100)}%`}
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
 // Falls back to the first programme rather than being synced into state by
 // an effect, so switching branch cannot leave a stale id selected.
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
    <Card>
     <CardContent className="p-8">You do not have permission to view Group Training.</CardContent>
    </Card>
   </div>
  )
 }

 return (
  <div className="flex flex-col gap-4 pb-4">
   <PageHero
    id="classes-title"
    icon={CalendarDays}
    title="Classes"
    description="Programmes, schedule, roster and attendance"
   />

   <div className="flex flex-wrap items-end gap-3">
    <div className="grid gap-1.5">
     <Label htmlFor="class-branch">Branch</Label>
     <select
      id="class-branch"
      value={branchId}
      onChange={(event) => setBranchId(event.target.value)}
      className="h-10 rounded-xl border bg-background px-3 text-sm"
     >
      {branches.data?.items?.map((branch: { id: string; name: string }) => (
       <option key={branch.id} value={branch.id}>{branch.name}</option>
      ))}
     </select>
    </div>
    {hasPermission("classes.book") && (
     <div className="grid gap-1.5">
      {/* Was a free-text "Member ID" box: staff had to already know a UUID
          to book anyone. */}
      <Label>Member to book</Label>
      <MemberPicker value={member} onChange={setMember} />
     </div>
    )}
   </div>

   <div className="grid gap-6 lg:grid-cols-2">
    {hasPermission("classes.manage") && (
     <Card>
      <CardHeader><CardTitle>Create class program</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
       <div className="sm:col-span-3">
        <Label htmlFor="program-name">Name</Label>
        <Input id="program-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Yoga / HIIT / Strength" />
       </div>
       <div>
        <Label htmlFor="program-capacity">Capacity</Label>
        <Input id="program-capacity" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
       </div>
       <div>
        <Label htmlFor="program-duration">Duration (min)</Label>
        <Input id="program-duration" type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
       </div>
       <Button
        disabled={createProgram.isPending || !selectedBranchId || !name.trim()}
        aria-busy={createProgram.isPending}
        onClick={() => void submitProgram()}
        className="mt-auto"
       >
        {createProgram.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
        Create
       </Button>
      </CardContent>
     </Card>
    )}

    {hasPermission("classes.manage") && (
     <Card>
      <CardHeader><CardTitle>Schedule session</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
       <div className="sm:col-span-2">
        <Label htmlFor="session-program">Class program</Label>
        <select
         id="session-program"
         value={selectedProgramId}
         onChange={(event) => setProgramId(event.target.value)}
         className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
        >
         {programOptions.map((program) => (
          <option key={program.id} value={program.id}>{program.name} · {program.capacity} seats</option>
         ))}
        </select>
       </div>
       <div>
        <Label htmlFor="session-start">Start</Label>
        <Input id="session-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
       </div>
       <div>
        <Label htmlFor="session-end">End</Label>
        <Input id="session-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
       </div>
       <Button
        disabled={createSession.isPending || !selectedProgramId || !start || !end}
        aria-busy={createSession.isPending}
        onClick={() => void submitSession()}
        className="sm:col-span-2"
       >
        {createSession.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CalendarDays className="mr-2 size-4" />}
        Schedule
       </Button>
      </CardContent>
     </Card>
    )}
   </div>

   <Card>
    <CardHeader><CardTitle>Upcoming sessions</CardTitle></CardHeader>
    <CardContent>
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
      <div className="grid gap-3">
       {(sessions.data ?? []).map((session) => (
        <div key={session.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
          <div className="font-semibold">{session.className}</div>
          <div className="text-sm text-muted-foreground">
           {new Date(session.startTime).toLocaleString()} · {session.branchName}
          </div>
          <div className="text-xs text-muted-foreground">
           {session.instructorFirstName || "Unassigned"} {session.instructorLastName || ""}
          </div>
         </div>
         <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
           <Users className="mr-1 size-3" aria-hidden="true" /> {session.bookedCount}/{session.effectiveCapacity}
          </Badge>
          {session.waitlistCount > 0 && <Badge variant="secondary">{session.waitlistCount} waitlisted</Badge>}
          <SessionRosterDialog
           sessionId={session.id}
           programName={session.className}
           startTime={session.startTime}
          />
          {hasPermission("classes.book") && (
           <Button size="sm" onClick={() => void bookMember(session.id)} disabled={book.isPending || !member}>
            Book member
           </Button>
          )}
         </div>
        </div>
       ))}
      </div>
     </DataState>
    </CardContent>
   </Card>

   <AnalyticsSection branchId={selectedBranchId} />
  </div>
 )
}
