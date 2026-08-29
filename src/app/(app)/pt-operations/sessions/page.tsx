"use client"

import * as React from "react"
import { CalendarDays, CheckCircle2, Clock3, Dumbbell, UserRound, XCircle } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBranches } from "@/lib/hooks/use-branches"
import { useMembers } from "@/lib/hooks/use-members"
import { useStaff } from "@/lib/hooks/use-staff"
import { ApiError } from "@/lib/api/client"
import { useBookPtSession, usePtSessionAction, usePtSessions, type PtSessionType } from "@/lib/hooks/use-pt-sessions"

function localDateTime(value: string) {
  const d = new Date(value)
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
}

function toIso(value: string) {
  return new Date(value).toISOString()
}

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success" as const
  if (status === "CANCELLED" || status === "NO_SHOW") return "destructive" as const
  return "default" as const
}

function SessionRow({ session }: { session: ReturnType<typeof usePtSessions>["data"] extends infer T ? T extends { items: Array<infer I> } ? I : never : never }) {
  const complete = usePtSessionAction("complete")
  const cancel = usePtSessionAction("cancel")
  const noShow = usePtSessionAction("no-show")
  const busy = complete.isPending || cancel.isPending || noShow.isPending
  const member = session.member ? `${session.member.firstName} ${session.member.lastName}` : "Member unavailable"
  const trainer = session.trainer ? `${session.trainer.firstName} ${session.trainer.lastName}` : "Unassigned"

  async function run(action: "complete" | "cancel" | "no-show") {
    try {
      if (action === "complete") await complete.mutateAsync({ id: session.id })
      if (action === "cancel") await cancel.mutateAsync({ id: session.id, reason: "Cancelled by trainer" })
      if (action === "no-show") await noShow.mutateAsync({ id: session.id })
      toast.success(action === "complete" ? "PT session completed" : action === "no-show" ? "Marked as no-show" : "Session cancelled")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to update session")
    }
  }

  return <div className="group flex flex-col gap-4 rounded-2xl border p-4 transition hover:border-primary/20 hover:bg-muted/20 lg:flex-row lg:items-center">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{member}</p>
        <p className="truncate text-xs text-muted-foreground">{session.member?.memberCode ?? ""} · {trainer}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 text-sm"><Clock3 className="size-4 text-muted-foreground" /><span>{localDateTime(session.startTime)}</span><span className="text-muted-foreground">→</span><span>{new Date(session.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div>
    <div className="flex items-center gap-2"><Badge variant={statusVariant(session.status)}>{session.status.replace("_", " ")}</Badge><Badge variant="outline">{session.type.replaceAll("_", " ")}</Badge></div>
    {session.status === "SCHEDULED" && <div className="flex gap-2 lg:ml-auto"><Button size="sm" disabled={busy} onClick={() => run("complete")}><CheckCircle2 className="size-4" />Complete</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => run("no-show")}><XCircle className="size-4" />No-show</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => run("cancel")}>Cancel</Button></div>}
  </div>
}

export default function PtSessionsPage() {
  const today = new Date()
  const dateKey = today.toISOString().slice(0, 10)
  const startFrom = new Date(`${dateKey}T00:00:00`).toISOString()
  const endTo = new Date(`${dateKey}T23:59:59`).toISOString()
  const sessions = usePtSessions({ page: 1, pageSize: 100, order: "asc", startFrom, endTo })
  const members = useMembers({ page: 1, pageSize: 100, order: "asc" })
  const staff = useStaff({ page: 1, pageSize: 100, order: "asc" })
  const branches = useBranches({ page: 1, pageSize: 100, order: "asc" })
  const book = useBookPtSession()
  const [memberId, setMemberId] = React.useState("")
  const [trainerId, setTrainerId] = React.useState("")
  const [branchId, setBranchId] = React.useState("")
  const [start, setStart] = React.useState(`${dateKey}T10:00`)
  const [end, setEnd] = React.useState(`${dateKey}T11:00`)
  const [type, setType] = React.useState<PtSessionType>("PERSONAL_TRAINING")
  const [price, setPrice] = React.useState("")

  const items = sessions.data?.items ?? []
  const scheduled = items.filter(x => x.status === "SCHEDULED")
  const completed = items.filter(x => x.status === "COMPLETED")
  const noShows = items.filter(x => x.status === "NO_SHOW")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!memberId || !branchId) return toast.error("Select a client and branch")
    try {
      await book.mutateAsync({ memberId, trainerId: trainerId || undefined, branchId, startTime: toIso(start), endTime: toIso(end), type, price: price ? Number(price) : undefined })
      toast.success("PT session booked")
      setPrice("")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to book PT session")
    }
  }

  return <div className="flex flex-col gap-7">
    <PageHeader title="PT Sessions" description="Schedule, execute and close real personal-training sessions." actions={<Button variant="outline" asChild><a href="/pt-operations"><Dumbbell className="size-4" /> PT OS</a></Button>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Scheduled today" icon={CalendarDays} value={scheduled.length} isLoading={sessions.isLoading} /><StatCard title="Completed" icon={CheckCircle2} value={completed.length} isLoading={sessions.isLoading} tone="success" /><StatCard title="No-shows" icon={XCircle} value={noShows.length} isLoading={sessions.isLoading} tone="warning" /><StatCard title="Total sessions" icon={Clock3} value={items.length} isLoading={sessions.isLoading} /></div>
    <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
      <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/20"><CardTitle className="text-base">Book a PT session</CardTitle></CardHeader><CardContent className="pt-5"><form className="flex flex-col gap-4" onSubmit={submit}>
        <label className="text-sm font-medium">Client<select value={memberId} onChange={e => setMemberId(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="">Select client</option>{(members.data?.items ?? []).map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} · {m.memberCode}</option>)}</select></label>
        <label className="text-sm font-medium">Trainer<select value={trainerId} onChange={e => setTrainerId(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="">Unassigned</option>{(staff.data?.items ?? []).filter(s => s.staffProfile?.isTrainer).map(s => s.staffProfile && <option key={s.staffProfile.id} value={s.staffProfile.id}>{s.firstName} {s.lastName}</option>)}</select></label>
        <label className="text-sm font-medium">Branch<select value={branchId} onChange={e => setBranchId(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="">Select branch</option>{(branches.data?.items ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Start<input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm" /></label><label className="text-sm font-medium">End<input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm" /></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Session type<select value={type} onChange={e => setType(e.target.value as PtSessionType)} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="PERSONAL_TRAINING">Personal</option><option value="PARTNER_TRAINING">Partner</option><option value="SMALL_GROUP">Small group</option></select></label><label className="text-sm font-medium">Price<input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="₹" className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm" /></label></div>
        <Button type="submit" className="mt-1 w-full" disabled={book.isPending}>{book.isPending ? "Booking..." : "Book PT session"}</Button>
      </form></CardContent></Card>
      <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/20"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Today&apos;s sessions</CardTitle><p className="mt-1 text-xs text-muted-foreground">Your actual PT calendar, not workout assignments.</p></div><Badge variant="outline">{items.length} sessions</Badge></div></CardHeader><CardContent className="p-3 sm:p-4">{sessions.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Unable to load PT sessions.</div> : items.length === 0 && !sessions.isLoading ? <div className="rounded-2xl border border-dashed p-10 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">No PT sessions today</p><p className="mt-1 text-sm text-muted-foreground">Book the first coaching session from the panel.</p></div> : <div className="flex flex-col gap-3">{items.map(session => <SessionRow key={session.id} session={session} />)}</div>}</CardContent></Card>
    </div>
  </div>
}
