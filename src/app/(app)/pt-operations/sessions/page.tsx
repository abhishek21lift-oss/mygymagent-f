"use client"

import * as React from "react"
import { CalendarDays, CheckCircle2, Clock3, Dumbbell, UserRound, Users, XCircle, Zap } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBranches } from "@/lib/hooks/use-branches"
import { useMembers } from "@/lib/hooks/use-members"
import { useStaff } from "@/lib/hooks/use-staff"
import { ApiError } from "@/lib/api/client"
import { useBookPtSession, usePtSessionAction, usePtSessions, type PtSession, type PtSessionType } from "@/lib/hooks/use-pt-sessions"
import { StatCard, toStatTone } from "@/components/shared/stat-card";

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
 <div className="group flex flex-col gap-4 rounded-lg border bg-card p-4 transition-colors lg:flex-row lg:items-center">
 <div className="flex min-w-0 flex-1 items-center gap-3">
 <div className="min-w-0">
 <p className="truncate text-sm font-semibold">{member}</p>
 <p className="truncate text-xs text-muted-foreground">{session.member?.memberCode ?? ""} · {trainer}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium tabular-nums">
 <Clock3 className="size-4 text-primary" aria-hidden="true" />
 <span className="tabular-nums">{new Date(session.startTime).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
 <span className="text-muted-foreground" aria-hidden="true">→</span>
 <span className="tabular-nums">{new Date(session.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={statusVariant(session.status)}>{session.status.replace("_", " ")}</Badge>
 <Badge variant="outline">{session.type.replaceAll("_", " ")}</Badge>
 </div>
 {session.status === "SCHEDULED" && (
 <div className="flex flex-wrap gap-2 lg:ml-auto">
 <Button size="sm" disabled={busy} aria-busy={busy} onClick={() => run("complete")} className="min-h-10 rounded-md text-sm">
 <CheckCircle2 className="size-4" aria-hidden="true" />Complete
 </Button>
 <Button size="sm" variant="outline" disabled={busy} aria-busy={busy} onClick={() => run("no-show")} className="min-h-10 rounded-md text-sm">
 <XCircle className="size-4" aria-hidden="true" />No-show
 </Button>
 <Button size="sm" variant="ghost" disabled={busy} onClick={() => run("cancel")} className="min-h-10 rounded-md text-sm">Cancel</Button>
 </div>
 )}
 </div>
 )
}

type MetricTone = "rose" | "emerald" | "amber" | "cyan"

function Metric({ label, value, hint, loading, tone }: { icon?: unknown; label: string; value: React.ReactNode; hint?: string; loading?: boolean; tone?: string }) {
 // Delegates to the shared tile. This page used to carry its own metric
 // component with a coloured top bar, a blurred orb, a 56px white-on-colour
 // icon tile that scaled and rotated on hover, and a two-tone shadow --
 // five decorative devices on one number, reinvented on fourteen pages.
 return (
  <StatCard
   title={label}
   value={typeof value === "string" || typeof value === "number" ? value : String(value ?? "")}
   isLoading={Boolean(loading)}
   hint={hint}
   tone={toStatTone(tone)}
  />
 );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
 return (
 <div>
 <Label htmlFor={htmlFor} className="text-sm font-medium">
 {label}
 </Label>
 <div className="mt-1.5">{children}</div>
 </div>
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
 <div className="pb-12">
 <div className="flex flex-col gap-4">
 <PageHero
 id="pt-sessions-title"
 icon={CalendarDays}
 title="PT sessions"
 variant="light"
 accent="rose"
 actions={
 <Button variant="outline" asChild className="min-h-11 rounded-lg text-sm">
 <a href="/pt-operations"><Dumbbell className="size-4" aria-hidden="true" /> PT OS</a>
 </Button>
 }
 />

 <section aria-labelledby="pt-sessions-stats" className="">
 <h2 id="pt-sessions-stats" className="sr-only">Today&apos;s session numbers</h2>
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 <Metric icon={CalendarDays} label="Scheduled" value={scheduled.length} tone="rose" />
 <Metric icon={CheckCircle2} label="Completed" value={completed.length} tone="emerald" />
 <Metric icon={XCircle} label="No-shows" value={noShows.length} tone="amber" />
 <Metric icon={Clock3} label="Total" value={items.length} tone="cyan" />
 </div>
 </section>

 <section aria-label="Booking and timeline" className="grid gap-5 xl:grid-cols-[.82fr_1.45fr]">
 <Card className="overflow-hidden rounded-lg">
 <div className="flex items-start gap-3 border-b px-5 py-4">
 <div className="min-w-0">
 <h2 className="text-sm font-semibold tracking-tight">Book a PT session</h2>
 </div>
 </div>
 <CardContent className="pt-5">
 <form className="flex flex-col gap-4" onSubmit={submit}>
 <Field label="Client" htmlFor="pt-client">
 <Select value={memberId} onValueChange={setMemberId}>
 <SelectTrigger id="pt-client" className="min-h-11 w-full rounded-lg text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
 <SelectContent>
 {(members.data?.items ?? []).map((m) => (
 <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName} · {m.memberCode}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>
 <Field label="Trainer" htmlFor="pt-trainer">
 <Select value={trainerId || "none"} onValueChange={(v) => setTrainerId(v === "none" ? "" : v)}>
 <SelectTrigger id="pt-trainer" className="min-h-11 w-full rounded-lg text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="none">Unassigned</SelectItem>
 {(staff.data?.items ?? []).filter((s) => s.staffProfile?.isTrainer).map((s) => s.staffProfile && (
 <SelectItem key={s.staffProfile.id} value={s.staffProfile.id}>{s.firstName} {s.lastName}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>
 <Field label="Branch" htmlFor="pt-branch">
 <Select value={branchId} onValueChange={setBranchId}>
 <SelectTrigger id="pt-branch" className="min-h-11 w-full rounded-lg text-sm"><SelectValue placeholder="Select branch" /></SelectTrigger>
 <SelectContent>
 {(branches.data?.items ?? []).map((b) => (
 <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Field label="Start" htmlFor="pt-start">
 <Input id="pt-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="min-h-11 rounded-lg text-sm" />
 </Field>
 <Field label="End" htmlFor="pt-end">
 <Input id="pt-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="min-h-11 rounded-lg text-sm" />
 </Field>
 </div>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Field label="Session type" htmlFor="pt-type">
 <Select value={type} onValueChange={(v) => setType(v as PtSessionType)}>
 <SelectTrigger id="pt-type" className="min-h-11 w-full rounded-lg text-sm"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="PERSONAL_TRAINING">Personal</SelectItem>
 <SelectItem value="PARTNER_TRAINING">Partner</SelectItem>
 <SelectItem value="SMALL_GROUP">Small group</SelectItem>
 </SelectContent>
 </Select>
 </Field>
 <Field label="Price" htmlFor="pt-price">
 <Input id="pt-price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₹" className="min-h-11 rounded-lg text-sm" />
 </Field>
 </div>
 <Button type="submit" className="mt-1 min-h-11 w-full rounded-lg text-sm" disabled={book.isPending} aria-busy={book.isPending}>
 {book.isPending ? "Booking..." : "Book PT session"}
 </Button>
 </form>
 </CardContent>
 </Card>

 <Card className="overflow-hidden rounded-lg">
 <div className="flex items-start gap-3 border-b px-5 py-4">
 <div className="min-w-0">
 <h2 className="text-sm font-semibold tracking-tight">Today&apos;s coaching timeline</h2>
 </div>
 </div>
 <CardContent className="p-3 sm:p-4">
 {sessions.isError ? (
 <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm font-medium">Unable to load PT sessions.</div>
 ) : items.length === 0 && !sessions.isLoading ? (
 <div className="rounded-lg border border-dashed p-10 text-center">
 <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
 <CalendarDays className="size-6" />
 </span>
 <p className="mt-3 text-sm font-semibold">No PT sessions today</p>
 <p className="mt-1 text-xs text-muted-foreground">Book the first session now.</p>
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
