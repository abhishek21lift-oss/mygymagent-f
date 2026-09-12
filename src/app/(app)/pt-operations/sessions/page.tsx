"use client"

import * as React from "react"
import { CalendarDays, CheckCircle2, Clock3, Dumbbell, UserRound, Users, XCircle, Zap } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBranches } from "@/lib/hooks/use-branches"
import { useMembers } from "@/lib/hooks/use-members"
import { useStaff } from "@/lib/hooks/use-staff"
import { ApiError } from "@/lib/api/client"
import { useBookPtSession, usePtSessionAction, usePtSessions, type PtSession, type PtSessionType } from "@/lib/hooks/use-pt-sessions"

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success" as const
  if (status === "CANCELLED" || status === "NO_SHOW") return "destructive" as const
  return "default" as const
}

function SessionRow({ session }: { session: PtSession }) {
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
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Unable to update session")
    }
  }
  return (
    <div className="group flex flex-col gap-4 rounded-[22px] border border-stone-200/80 bg-white/75 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white hover:shadow-[0_20px_50px_-30px_rgba(244,63,94,.4)] lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-stone-900">{member}</p>
          <p className="truncate text-xs font-medium text-stone-600">{session.member?.memberCode ?? ""} · {trainer}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-50 to-orange-50 px-3 py-1.5 text-xs font-bold text-stone-700 ring-1 ring-rose-100">
        <Clock3 className="size-4 text-rose-500" aria-hidden="true" />
        <span className="tabular-nums">{new Date(session.startTime).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
        <span className="text-stone-300" aria-hidden="true">→</span>
        <span className="tabular-nums">{new Date(session.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant(session.status)}>{session.status.replace("_", " ")}</Badge>
        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">{session.type.replaceAll("_", " ")}</Badge>
      </div>
      {session.status === "SCHEDULED" && (
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <Button size="sm" disabled={busy} onClick={() => run("complete")} className="min-h-11 rounded-xl bg-[linear-gradient(105deg,#e11d48,#f97316_60%,#0891b2)] text-white shadow-md shadow-rose-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
            <CheckCircle2 className="size-4" aria-hidden="true" />Complete
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run("no-show")} className="min-h-11 rounded-xl border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            <XCircle className="size-4" aria-hidden="true" />No-show
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run("cancel")} className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">Cancel</Button>
        </div>
      )}
    </div>
  )
}

type MetricTone = "rose" | "emerald" | "amber" | "cyan"

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; orb: string; ring: string }> = {
  rose: {
    bar: "from-rose-500 via-red-500 to-orange-500",
    tile: "from-rose-500 to-orange-500 shadow-rose-500/30",
    orb: "bg-rose-400/20",
    ring: "hover:border-rose-200 hover:shadow-rose-500/10",
  },
  emerald: {
    bar: "from-emerald-400 via-teal-500 to-green-600",
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    orb: "bg-emerald-400/20",
    ring: "hover:border-emerald-200 hover:shadow-emerald-500/10",
  },
  amber: {
    bar: "from-amber-400 via-orange-500 to-rose-500",
    tile: "from-amber-500 to-orange-600 shadow-amber-500/30",
    orb: "bg-amber-400/20",
    ring: "hover:border-amber-200 hover:shadow-amber-500/10",
  },
  cyan: {
    bar: "from-cyan-400 via-sky-500 to-blue-600",
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    orb: "bg-cyan-400/20",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
  },
}

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: React.ReactNode; hint?: string; tone: MetricTone }) {
  const t = METRIC_TONES[tone]
  return (
    <Card className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <CardContent className="relative flex items-center gap-4 p-5">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.tile}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-[11px] font-medium text-stone-600">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm font-bold text-stone-700">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  )
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
  const scheduled = items.filter((x) => x.status === "SCHEDULED")
  const completed = items.filter((x) => x.status === "COMPLETED")
  const noShows = items.filter((x) => x.status === "NO_SHOW")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!memberId || !branchId) return toast.error("Select a client and branch")
    if (new Date(start) >= new Date(end)) return toast.error("End time must be after start time")
    try {
      await book.mutateAsync({
        memberId,
        trainerId: trainerId || undefined,
        branchId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        type,
        price: price ? Number(price) : undefined,
      })
      toast.success("PT session booked")
      setPrice("")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to book PT session")
    }
  }

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="pt-sessions-title"
          icon={CalendarDays}
          title="PT Sessions"
          variant="light"
          accent="rose"
          actions={
            <Button variant="outline" asChild className="min-h-11 rounded-2xl border-stone-200 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
              <a href="/pt-operations"><Dumbbell className="size-4" aria-hidden="true" /> PT OS</a>
            </Button>
          }
        />

        <section aria-labelledby="pt-sessions-stats" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 id="pt-sessions-stats" className="sr-only">Today&apos;s session numbers</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={CalendarDays} label="Scheduled" value={scheduled.length} tone="rose" />
            <Metric icon={CheckCircle2} label="Completed" value={completed.length} tone="emerald" />
            <Metric icon={XCircle} label="No-shows" value={noShows.length} tone="amber" />
            <Metric icon={Clock3} label="Total" value={items.length} tone="cyan" />
          </div>
        </section>

        <section aria-label="Booking and timeline" className="grid animate-in fade-in slide-in-from-bottom-2 gap-5 duration-500 [animation-delay:100ms] xl:grid-cols-[.82fr_1.45fr]">
          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-rose-900/5 backdrop-blur-xl">
            <div className="flex items-start gap-3 border-b border-stone-100/80 bg-gradient-to-r from-rose-50/90 via-white to-orange-50/60 px-5 py-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25" aria-hidden="true">
                <Zap className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold tracking-tight text-stone-950">Book a PT session</h2>
              </div>
            </div>
            <CardContent className="pt-5">
              <form className="flex flex-col gap-4" onSubmit={submit}>
                <Field label="Client">
                  <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="input min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
                    <option value="">Select client</option>
                    {(members.data?.items ?? []).map((m) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName} · {m.memberCode}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Trainer">
                  <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className="input min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
                    <option value="">Unassigned</option>
                    {(staff.data?.items ?? []).filter((s) => s.staffProfile?.isTrainer).map((s) => s.staffProfile && (
                      <option key={s.staffProfile.id} value={s.staffProfile.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Branch">
                  <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
                    <option value="">Select branch</option>
                    {(branches.data?.items ?? []).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Start">
                    <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="input min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" />
                  </Field>
                  <Field label="End">
                    <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="input min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Session type">
                    <select value={type} onChange={(e) => setType(e.target.value as PtSessionType)} className="input min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
                      <option value="PERSONAL_TRAINING">Personal</option>
                      <option value="PARTNER_TRAINING">Partner</option>
                      <option value="SMALL_GROUP">Small group</option>
                    </select>
                  </Field>
                  <Field label="Price">
                    <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₹" className="input min-h-11 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" />
                  </Field>
                </div>
                <Button type="submit" className="mt-1 min-h-11 w-full rounded-2xl bg-[linear-gradient(105deg,#e11d48,#f97316_55%,#0891b2)] text-white shadow-lg shadow-rose-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" disabled={book.isPending}>
                  {book.isPending ? "Booking..." : "Book PT session"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-cyan-900/5 backdrop-blur-xl">
            <div className="flex items-start gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-orange-50/60 px-5 py-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25" aria-hidden="true">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold tracking-tight text-stone-950">Today&apos;s coaching timeline</h2>
              </div>
            </div>
            <CardContent className="p-3 sm:p-4">
              {sessions.isError ? (
                <div role="alert" className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-5 text-sm font-semibold text-rose-700">Unable to load PT sessions.</div>
              ) : items.length === 0 && !sessions.isLoading ? (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-gradient-to-br from-rose-50/60 to-orange-50/50 p-10 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25" aria-hidden="true">
                    <CalendarDays className="size-6" />
                  </span>
                  <p className="mt-3 text-sm font-extrabold text-stone-900">No PT sessions today</p>
                  <p className="mt-1 text-xs font-medium text-stone-600">Book the first session now.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">{items.map((x) => <SessionRow key={x.id} session={x} />)}</div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
