"use client"

import * as React from "react"
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Clock3, Sparkles, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/client"
import { useBranches } from "@/lib/hooks/use-branches"
import { useLeads } from "@/lib/hooks/use-leads"
import { useMembers } from "@/lib/hooks/use-members"
import { useStaff } from "@/lib/hooks/use-staff"
import {
  useAddTimeOff,
  useAvailabilityRules,
  useCancelAppointment,
  useCalendarFeed,
  useCompleteAppointment,
  useCreateAppointment,
  useDeleteAvailabilityRule,
  useFreeSlots,
  useNoShowAppointment,
  useRescheduleAppointment,
  useSetAvailabilityRule,
  useTimeOffs,
  type AppointmentType,
  type CalendarSlot,
} from "@/lib/hooks/use-appointments"

const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: "TRIAL", label: "Trial" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "OTHER", label: "Other" },
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
}
function fmtRange(start: string, end: string) {
  return `${fmtDate(new Date(start))} · ${fmtTime(start)} → ${fmtTime(end)}`
}
function statusBadge(status: string) {
  if (status === "COMPLETED" || status === "BOOKED") return <Badge className="bg-emerald-100 text-emerald-800">{status}</Badge>
  if (status === "CANCELLED" || status === "NO_SHOW") return <Badge variant="destructive">{status}</Badge>
  if (status === "SCHEDULED") return <Badge className="bg-violet-100 text-violet-800">{status}</Badge>
  return <Badge variant="secondary">{status}</Badge>
}
function sourceBadge(source: string) {
  return source === "PT_SESSION" ? <Badge className="bg-cyan-100 text-cyan-800">PT</Badge> : <Badge className="bg-indigo-100 text-indigo-800">Appt</Badge>
}

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000)
}
function dateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}
/** Local datetime-local input value (minutes precision) for a Date. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CalendarPage() {
  const [view, setView] = React.useState<"day" | "week" | "month">("week")
  const [anchor, setAnchor] = React.useState(() => startOfDayUTC(new Date()))
  const [branchId, setBranchId] = React.useState<string>("")

  const branches = useBranches({ page: 1, pageSize: 100, order: "asc" })
  const defaultBranchId = branches.data?.items?.[0]?.id
  const effectiveBranchId = branchId || defaultBranchId || ""

  // Feed window: wide enough for any view around the anchor date.
  const from = React.useMemo(() => addDays(anchor, -35).toISOString(), [anchor])
  const to = React.useMemo(() => addDays(anchor, 65).toISOString(), [anchor])
  const feed = useCalendarFeed(effectiveBranchId ? { from, to, branchId: effectiveBranchId } : { from, to })

  const slots = React.useMemo(() => feed.data ?? [], [feed.data])

  // View windows
  const viewStart = React.useMemo(() => {
    if (view === "day") return anchor
    if (view === "week") {
      const dow = (anchor.getUTCDay() + 6) % 7 // ISO: Mon=0
      return addDays(anchor, -dow)
    }
    return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
  }, [view, anchor])
  const viewEnd = React.useMemo(() => {
    if (view === "day") return addDays(viewStart, 1)
    if (view === "week") return addDays(viewStart, 7)
    return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1))
  }, [view, viewStart, anchor])

  const visible = React.useMemo(
    () => slots.filter((s) => new Date(s.startTime) < viewEnd && new Date(s.endTime) > viewStart),
    [slots, viewStart, viewEnd],
  )

  const title = React.useMemo(() => {
    if (view === "month") return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    if (view === "day") return anchor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })
    return `${fmtDate(viewStart)} – ${fmtDate(addDays(viewStart, 6))}`
  }, [view, anchor, viewStart])

  function shift(n: number) {
    if (view === "day") setAnchor(addDays(anchor, n))
    else if (view === "week") setAnchor(addDays(anchor, n * 7))
    else setAnchor(new Date(anchor.getUTCFullYear(), anchor.getUTCMonth() + n, 1))
  }

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_45%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_80%,rgba(16,185,129,.08),transparent_24%)]" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-violet-300/25 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">
                <Sparkles className="size-3.5" /> Unified scheduling
              </div>
              <h1 className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl">Calendar &amp; Appointments</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-500">
                One calendar for PT sessions, trials, consultations and assessments — with conflict detection, trainer availability rules and daily reminders.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={effectiveBranchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Branch" /></SelectTrigger>
                <SelectContent>
                  {(branches.data?.items ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-cyan-900/5 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100/80 bg-gradient-to-r from-white via-cyan-50/40 to-violet-50/50">
              <div>
                <CardTitle className="font-serif text-xl">{title}</CardTitle>
                <p className="mt-1 text-xs text-stone-500">{visible.length} entr{visible.length === 1 ? "y" : "ies"} · PT sessions and appointments merged</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setAnchor(startOfDayUTC(new Date()))}>Today</Button>
                <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next"><ChevronRight className="size-4" /></Button>
                <div className="ml-2 flex overflow-hidden rounded-xl border border-stone-200">
                  {(["day", "week", "month"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={`px-3 py-1.5 text-xs font-bold capitalize transition ${view === v ? "bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] text-white" : "bg-white text-stone-600 hover:bg-stone-50"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-5">
              {feed.isLoading ? (
                <div className="p-8 text-center text-sm font-semibold text-stone-400">Loading calendar…</div>
              ) : feed.isError ? (
                <div className="rounded-2xl bg-rose-50 p-5 text-sm font-semibold text-rose-700">Unable to load the calendar feed.</div>
              ) : visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-10 text-center">
                  <CalendarDays className="mx-auto size-8 text-stone-400" />
                  <p className="mt-3 font-bold text-stone-900">Nothing scheduled</p>
                  <p className="mt-1 text-xs text-stone-500">Book an appointment from the panel — PT sessions booked in Training also appear here.</p>
                </div>
              ) : view === "month" ? (
                <MonthGrid slots={visible} anchor={anchor} />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {(view === "day"
                    ? visible
                    : DAYS.flatMap((_, i) => visible.filter((s) => new Date(s.startTime).getUTCDay() === (i + 1) % 7))
                  ).map((s) => (
                    <SlotRow key={s.id + s.startTime} slot={s} showDate={view === "week"} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <BookingPanel branchId={effectiveBranchId} />
            <AvailabilityPanel branchId={effectiveBranchId} />
          </div>
        </section>
      </div>
    </div>
  )
}

function SlotRow({ slot, showDate }: { slot: CalendarSlot; showDate: boolean }) {
  const [open, setOpen] = React.useState(false)
  const cancel = useCancelAppointment()
  const complete = useCompleteAppointment()
  const noShow = useNoShowAppointment()
  const reschedule = useRescheduleAppointment()
  const [rsStart, setRsStart] = React.useState(toLocalInput(new Date(slot.startTime)))
  const [rsEnd, setRsEnd] = React.useState(toLocalInput(new Date(slot.endTime)))
  const isAppt = slot.source === "APPOINTMENT"
  const busy = cancel.isPending || complete.isPending || noShow.isPending || reschedule.isPending

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn()
      toast.success(ok)
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action failed")
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-[18px] border border-stone-200/80 bg-white/75 p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-cyan-100 to-violet-100 text-violet-700">
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-stone-900">{slot.title}</p>
          <p className="truncate text-xs font-medium text-stone-500">
            {showDate ? fmtDate(new Date(slot.startTime)) + " · " : ""}{fmtTime(slot.startTime)} → {fmtTime(slot.endTime)}
            {slot.staffName ? ` · ${slot.staffName}` : ""}{slot.memberName ? ` · ${slot.memberName}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {sourceBadge(slot.source)}
          {statusBadge(slot.status)}
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{slot.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-sm text-stone-600">
            <p className="flex items-center gap-2"><Clock3 className="size-4 text-violet-500" /> {fmtRange(slot.startTime, slot.endTime)}</p>
            <p className="flex items-center gap-2"><UserRound className="size-4 text-violet-500" /> {slot.staffName ?? "Unassigned staff"}{slot.memberName ? ` · ${slot.memberName}` : ""}</p>
            <div className="flex items-center gap-2">{sourceBadge(slot.source)}{statusBadge(slot.status)}</div>
            {slot.notes ? <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600">{slot.notes}</p> : null}
          </div>
          {isAppt && slot.status === "BOOKED" ? (
            <div className="mt-3 flex flex-col gap-3 border-t border-stone-100 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">New start</Label>
                  <Input type="datetime-local" value={rsStart} onChange={(e) => setRsStart(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">New end</Label>
                  <Input type="datetime-local" value={rsEnd} onChange={(e) => setRsEnd(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => reschedule.mutateAsync({ id: slot.id, startTime: new Date(rsStart).toISOString(), endTime: new Date(rsEnd).toISOString() }), "Appointment rescheduled")}>Reschedule</Button>
                <Button size="sm" variant="outline" className="text-emerald-700" disabled={busy} onClick={() => run(() => complete.mutateAsync(slot.id), "Marked completed")}>Complete</Button>
                <Button size="sm" variant="outline" className="text-amber-700" disabled={busy} onClick={() => run(() => noShow.mutateAsync(slot.id), "Marked no-show")}>No-show</Button>
                <Button size="sm" variant="outline" className="text-rose-700" disabled={busy} onClick={() => run(() => cancel.mutateAsync({ id: slot.id }), "Appointment cancelled")}>Cancel</Button>
              </div>
            </div>
          ) : null}
          {!isAppt ? (
            <p className="mt-3 rounded-xl bg-cyan-50 p-3 text-xs text-cyan-800">
              This is a PT session — manage it from <a className="font-bold underline" href="/pt-operations/sessions">PT Sessions</a> so package credits stay in sync.
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function MonthGrid({ slots, anchor }: { slots: CalendarSlot[]; anchor: Date }) {
  const first = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
  const days = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7
  const cells: (CalendarSlot[] | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) {
    const dayStart = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), d))
    const dayEnd = addDays(dayStart, 1)
    cells.push(slots.filter((s) => new Date(s.startTime) < dayEnd && new Date(s.endTime) > dayStart))
  }
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DAYS.map((d) => <div key={d} className="pb-1 text-center text-[10px] font-black uppercase tracking-wider text-stone-400">{d}</div>)}
      {cells.map((cell, i) =>
        cell === null ? <div key={`pad-${i}`} className="min-h-20 rounded-lg bg-stone-50/40" /> : (
          <div key={`day-${i}`} className="min-h-20 rounded-lg border border-stone-100 p-1.5">
            <p className="px-1 text-[11px] font-black text-stone-400">{i - lead + 1}</p>
            <div className="flex flex-col gap-1">
              {cell.slice(0, 3).map((s) => (
                <div key={s.id + s.startTime} className="truncate rounded-md bg-violet-100/70 px-1.5 py-0.5 text-[10px] font-bold text-violet-800" title={s.title}>
                  {fmtTime(s.startTime)} {s.title}
                </div>
              ))}
              {cell.length > 3 ? <p className="px-1 text-[10px] font-bold text-stone-400">+{cell.length - 3} more</p> : null}
            </div>
          </div>
        ),
      )}
    </div>
  )
}

function BookingPanel({ branchId }: { branchId: string }) {
  const members = useMembers({ page: 1, pageSize: 100, order: "asc" })
  const staff = useStaff({ page: 1, pageSize: 100, order: "asc" })
  const leads = useLeads({ page: 1, pageSize: 100 })
  const create = useCreateAppointment()

  const trainers = (staff.data?.items ?? []).filter((s) => s.staffProfile?.isTrainer)
  const [staffId, setStaffId] = React.useState("")
  const [memberId, setMemberId] = React.useState("")
  const [leadId, setLeadId] = React.useState("")
  const [type, setType] = React.useState<AppointmentType>("TRIAL")
  const [title, setTitle] = React.useState("")
  const [start, setStart] = React.useState(() => toLocalInput(new Date()))
  const [end, setEnd] = React.useState(() => toLocalInput(new Date(Date.now() + 60 * 60 * 1000)))
  const [notes, setNotes] = React.useState("")
  const [clientName, setClientName] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPhone, setClientPhone] = React.useState("")
  const [day, setDay] = React.useState(() => dateKey(new Date()))

  const slots = useFreeSlots(staffId || null, day)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!branchId) return toast.error("Select a branch first")
    if (!title.trim()) return toast.error("Give the appointment a title")
    if (new Date(start) >= new Date(end)) return toast.error("End time must be after start time")
    if (!memberId && !leadId && !clientName.trim()) return toast.error("Pick a member, a lead, or enter a client name")
    try {
      await create.mutateAsync({
        branchId,
        staffId: staffId || undefined,
        memberId: memberId || undefined,
        leadId: leadId || undefined,
        type,
        title: title.trim(),
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        notes: notes.trim() || undefined,
        clientName: clientName.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
      })
      toast.success("Appointment booked — conflicts and availability were validated on the server")
      setTitle(""); setNotes(""); setClientName(""); setClientEmail(""); setClientPhone("")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to book appointment")
    }
  }

  return (
    <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
      <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-white via-cyan-50/40 to-violet-50/50">
        <CardTitle className="font-serif text-xl">Book an appointment</CardTitle>
        <p className="text-xs text-stone-500">Trials, consultations, assessments and more. Availability, time-off and double-booking are blocked by the backend.</p>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div>
            <Label className="text-sm font-bold text-stone-700">Title</Label>
            <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trial session — Priya" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-bold text-stone-700">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-bold text-stone-700">Staff</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {trainers.map((s) => s.staffProfile && <SelectItem key={s.staffProfile.id} value={s.staffProfile.id}>{s.firstName} {s.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-bold text-stone-700">Member</Label>
              <Select value={memberId} onValueChange={(v) => { setMemberId(v === "none" ? "" : v); setLeadId(""); setClientName("") }}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(members.data?.items ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName} · {m.memberCode}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-bold text-stone-700">Lead</Label>
              <Select value={leadId} onValueChange={(v) => { setLeadId(v === "none" ? "" : v); setMemberId("") }}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(leads.data?.items ?? []).filter((l) => l.status !== "WON" && l.status !== "LOST").map((l) => <SelectItem key={l.id} value={l.id}>{l.firstName} {l.lastName} · {l.status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!memberId && !leadId ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-stone-700">Client name</Label>
                <Input className="mt-1.5" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Walk-in" />
              </div>
              <div>
                <Label className="text-xs font-bold text-stone-700">Client email</Label>
                <Input className="mt-1.5" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="For reminders" />
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-bold text-stone-700">Start</Label>
              <Input className="mt-1.5" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-bold text-stone-700">End</Label>
              <Input className="mt-1.5" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-sm font-bold text-stone-700">Notes</Label>
            <Textarea className="mt-1.5" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context for the staff member" />
          </div>
          <Button type="submit" className="w-full rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)]" disabled={create.isPending || !branchId}>
            {create.isPending ? "Booking…" : "Book appointment"}
          </Button>
          <div className="rounded-2xl bg-cyan-50/60 p-3 text-xs text-cyan-800">
            <p className="flex items-center gap-1.5 font-black uppercase tracking-wider"><CalendarX2 className="size-3.5" /> Free slots</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Input type="date" className="h-8 w-36 text-xs" value={day} onChange={(e) => setDay(e.target.value)} />
              {staffId ? (
                slots.data?.windows?.length ? (
                  slots.data.windows.flatMap((w) => w.free).slice(0, 4).map((f) => (
                    <button key={f.start} type="button" className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[10px] font-bold text-cyan-800 hover:bg-cyan-100"
                      onClick={() => { setStart(toLocalInput(new Date(f.start))); setEnd(toLocalInput(new Date(f.end))) }}>
                      {fmtTime(f.start)}–{fmtTime(f.end)}
                    </button>
                  ))
                ) : <span className="text-stone-500">{slots.data?.note ?? "No free windows"}</span>
              ) : <span className="text-stone-500">Select staff to see free times</span>}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

const DAY_OPTIONS = [
  { value: 1, label: "Monday" }, { value: 2, label: "Tuesday" }, { value: 3, label: "Wednesday" }, { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" }, { value: 6, label: "Saturday" }, { value: 7, label: "Sunday" },
]

function minuteToLabel(m: number) {
  const h = Math.floor(m / 60), mm = m % 60
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

function AvailabilityPanel({ branchId }: { branchId: string }) {
  const staff = useStaff({ page: 1, pageSize: 100, order: "asc" })
  const rules = useAvailabilityRules()
  const timeOffs = useTimeOffs()
  const setRule = useSetAvailabilityRule()
  const delRule = useDeleteAvailabilityRule()
  const addOff = useAddTimeOff()

  const trainers = (staff.data?.items ?? []).filter((s) => s.staffProfile?.isTrainer)
  const [staffId, setStaffId] = React.useState("")
  const [dayOfWeek, setDayOfWeek] = React.useState("1")
  const [startMin, setStartMin] = React.useState("540")
  const [endMin, setEndMin] = React.useState("1080")
  const [offStart, setOffStart] = React.useState(() => toLocalInput(new Date()))
  const [offEnd, setOffEnd] = React.useState(() => toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000)))
  const [offReason, setOffReason] = React.useState("")

  async function guard(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast.success(ok) } catch (e) { toast.error(e instanceof ApiError ? e.message : "Action failed") }
  }

  return (
    <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-cyan-900/5 backdrop-blur-xl">
      <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-white via-emerald-50/30 to-cyan-50/40">
        <CardTitle className="font-serif text-xl">Trainer availability &amp; time off</CardTitle>
        <p className="text-xs text-stone-500">Rules and time off are enforced on every booking, reschedule and PT session.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="flex flex-col gap-3">
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select trainer" /></SelectTrigger>
            <SelectContent>
              {trainers.map((s) => s.staffProfile && <SelectItem key={s.staffProfile.id} value={s.staffProfile.id}>{s.firstName} {s.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-3 gap-2">
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{DAY_OPTIONS.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={startMin} onValueChange={setStartMin}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{[...Array(24).keys()].map((h) => <SelectItem key={h * 60} value={String(h * 60)}>{minuteToLabel(h * 60)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={endMin} onValueChange={setEndMin}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{[...Array(24).keys()].map((h) => <SelectItem key={(h + 1) * 60} value={String((h + 1) * 60)}>{minuteToLabel((h + 1) * 60)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" disabled={!staffId || setRule.isPending}
            onClick={() => guard(() => setRule.mutateAsync({ staffId, branchId: branchId || undefined, dayOfWeek: Number(dayOfWeek), startMinute: Number(startMin), endMinute: Number(endMin) }), "Availability rule saved")}>
            {setRule.isPending ? "Saving…" : "Add weekly rule"}
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          {(rules.data ?? []).length === 0 ? <p className="text-xs text-stone-500">No rules yet — trainers without rules accept any time.</p> : (rules.data ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2 text-xs">
              <span className="font-bold text-stone-700">
                {r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : "Trainer"} · {DAYS[(r.dayOfWeek + 5) % 7]} {minuteToLabel(r.startMinute)}–{minuteToLabel(r.endMinute)}
              </span>
              <button type="button" aria-label="Delete rule" className="text-stone-400 transition hover:text-rose-600" onClick={() => guard(() => delRule.mutateAsync(r.id), "Rule removed")}><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-100 pt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-stone-400">Time off</p>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input type="datetime-local" value={offStart} onChange={(e) => setOffStart(e.target.value)} />
              <Input type="datetime-local" value={offEnd} onChange={(e) => setOffEnd(e.target.value)} />
            </div>
            <Input value={offReason} onChange={(e) => setOffReason(e.target.value)} placeholder="Reason (optional)" />
            <Button size="sm" variant="outline" disabled={!staffId || addOff.isPending}
              onClick={() => guard(() => addOff.mutateAsync({ staffId, branchId: branchId || undefined, startAt: new Date(offStart).toISOString(), endAt: new Date(offEnd).toISOString(), reason: offReason.trim() || undefined }), "Time off added")}>
              <CalendarX2 className="size-4" /> Add time off
            </Button>
            <div className="flex flex-col gap-1.5">
              {(timeOffs.data ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs">
                  <span className="font-bold text-amber-800">{t.staff ? `${t.staff.firstName} ${t.staff.lastName}` : "Trainer"} · {fmtDate(new Date(t.startAt))} → {fmtDate(new Date(t.endAt))}{t.reason ? ` · ${t.reason}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
