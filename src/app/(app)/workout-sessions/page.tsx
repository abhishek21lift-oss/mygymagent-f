"use client"

import * as React from "react"
import { CheckCircle2, Dumbbell, Flame, Play, Plus, Target, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useWorkoutAssignments } from "@/lib/hooks/use-workouts"
import { useCompleteWorkoutSession, useLogWorkoutSet, useStartWorkoutSession, useTodayWorkoutSessions, useWorkoutSession } from "@/lib/hooks/use-workout-sessions"
import { ApiError } from "@/lib/api/client"
import { StatCard, toStatTone } from "@/components/shared/stat-card";

type MetricTone = "rose" | "cyan" | "emerald"

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; orb: string; ring: string }> = {
 rose: {
 bar: "bg-rose-500",
 tile: "bg-rose-500 shadow-rose-500/30",
 orb: "bg-rose-400/20",
 ring: "hover:border-rose-200 hover:shadow-rose-500/10",
 },
 cyan: {
 bar: "bg-cyan-400",
 tile: "bg-cyan-500 shadow-cyan-500/30",
 orb: "bg-cyan-400/20",
 ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
 },
 emerald: {
 bar: "bg-emerald-400",
 tile: "bg-emerald-500 shadow-emerald-500/30",
 orb: "bg-emerald-400/20",
 ring: "hover:border-emerald-200 hover:shadow-emerald-500/10",
 },
}

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

export default function WorkoutSessionsPage() {
 const [selectedId, setSelectedId] = React.useState<string | null>(null)
 const [drafts, setDrafts] = React.useState<Record<string, { weightKg: string; reps: string; rpe: string }>>({})
 const assignments = useWorkoutAssignments({ page: 1, pageSize: 50, order: "desc" })
 const sessions = useTodayWorkoutSessions()
 const start = useStartWorkoutSession()
 const logSet = useLogWorkoutSet()
 const complete = useCompleteWorkoutSession()
 const selected = useWorkoutSession(selectedId)
 const activeAssignments = (assignments.data?.items ?? []).filter((x) => x.status === "ACTIVE")

 async function startSession(assignmentId: string) {
 try {
 const session = await start.mutateAsync({ assignmentId })
 setSelectedId(session.id)
 toast.success("Workout session started")
 } catch (e) {
 toast.error(e instanceof ApiError ? e.message : "Unable to start workout session")
 }
 }

 async function saveSet(exerciseId: string, next: number) {
 if (!selectedId) return
 const draft = drafts[exerciseId] ?? { weightKg: "", reps: "", rpe: "" }
 try {
 await logSet.mutateAsync({
 sessionId: selectedId,
 sessionExerciseId: exerciseId,
 setNumber: next,
 weightKg: draft.weightKg ? Number(draft.weightKg) : undefined,
 reps: draft.reps ? Number(draft.reps) : undefined,
 rpe: draft.rpe ? Number(draft.rpe) : undefined,
 })
 setDrafts((c) => ({ ...c, [exerciseId]: { weightKg: "", reps: "", rpe: "" } }))
 toast.success(`Set ${next} logged`)
 } catch (e) {
 toast.error(e instanceof ApiError ? e.message : "Unable to log set")
 }
 }

 async function completeSession() {
 if (!selectedId) return
 try {
 await complete.mutateAsync(selectedId)
 toast.success("Workout session completed")
 } catch (e) {
 toast.error(e instanceof ApiError ? e.message : "Unable to complete workout session")
 }
 }

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="ws-title"
 icon={Dumbbell}
 title="Today's sessions"
 actions={
 <div className="flex items-center gap-3 rounded-lg border border-orange-100 bg-muted/40 px-4 py-3 text-xs font-bold text-stone-700">
 <span className="flex size-11 items-center justify-center rounded-lg bg-rose-500 text-white shadow-md shadow-rose-500/25" aria-hidden="true">
 <Dumbbell className="size-5" />
 </span>
 <span>{activeAssignments.length} ready · {sessions.data?.filter((x) => x.status === "COMPLETED").length ?? 0} closed</span>
 </div>
 }
 />

 <section aria-labelledby="ws-stats" className="">
 <h2 id="ws-stats" className="sr-only">Execution numbers</h2>
 <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
 <Metric icon={Target} label="Ready to start" value={activeAssignments.length} tone="rose" />
 <Metric icon={Users} label="Started today" value={sessions.data?.length ?? 0} tone="cyan" />
 <Metric icon={CheckCircle2} label="Completed" value={sessions.data?.filter((x) => x.status === "COMPLETED").length ?? 0} tone="emerald" />
 </div>
 </section>

 <section aria-label="Execution workspace" className="grid gap-5 xl:grid-cols-[.9fr_1.35fr]">
 <Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm shadow-rose-900/5">
 <div className="flex items-start gap-3 border-b border-border px-4 py-2.5 sm:px-5">
 <div className="min-w-0">
 <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Execution queue</h2>
 </div>
 </div>
 <CardContent className="space-y-5 p-4">
 {activeAssignments.length > 0 && (
 <div>
 <p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-stone-500">Ready to start</p>
 <div className="space-y-2">
 {activeAssignments.map((a) => (
 <div key={a.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition duration-200 hover:-translate-y-px hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-md">
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-bold text-stone-900">{a.member ? `${a.member.firstName} ${a.member.lastName}` : "Member"}</p>
 <p className="truncate text-xs font-medium text-stone-600">{a.workoutPlan?.name ?? "Workout plan"}</p>
 </div>
 <Button size="sm" className="btn-sheen min-h-11 rounded-xl bg-primary text-primary-foreground shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={() => startSession(a.id)} disabled={start.isPending}>
 <Play className="size-3.5" aria-hidden="true" />{start.isPending ? "Starting" : "Start"}
 </Button>
 </div>
 ))}
 </div>
 </div>
 )}
 <div>
 <p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-stone-500">Started today</p>
 {sessions.isLoading ? (
 <div className="space-y-2" aria-label="Loading today's sessions">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/40" />
 ))}
 </div>
 ) : sessions.isError ? (
 <p role="alert" className="rounded-xl border border-rose-200 bg-muted/40 p-4 text-sm font-semibold text-rose-700">Unable to load today&apos;s sessions.</p>
 ) : sessions.data?.length ? (
 <div className="space-y-2">
 {sessions.data.map((s) => (
 <Button
 key={s.id}
 type="button"
 variant="outline"
 onClick={() => setSelectedId(s.id)}
 aria-pressed={selectedId === s.id}
 className="h-auto min-h-11 w-full justify-start rounded-lg p-3 text-left text-sm font-medium"
 >
 <span className="flex w-full items-center justify-between gap-3">
 <span className="min-w-0">
 <span className="block truncate text-sm font-semibold">{s.firstName} {s.lastName}</span>
 <span className="block truncate text-xs text-muted-foreground">{s.workoutPlanName}</span>
 </span>
 <Badge variant={s.status === "COMPLETED" ? "success" : "default"}>{s.status.replace("_", " ")}</Badge>
 </span>
 </Button>
 ))}
 </div>
 ) : (
 <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center text-sm font-medium text-stone-600">No workout sessions started today.</p>
 )}
 </div>
 </CardContent>
 </Card>

 <Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm shadow-cyan-900/5">
 <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5">
 <div className="flex items-center gap-3">
 <div>
 <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Session execution</h2>
 </div>
 </div>
 {selected.data && <Badge variant={selected.data.status === "COMPLETED" ? "success" : "default"}>{selected.data.status.replace("_", " ")}</Badge>}
 </div>
 <CardContent className="p-4 sm:p-5">
 {!selectedId ? (
 <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-muted/40 p-8 text-center">
 <span className="flex size-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/25" aria-hidden="true">
 <Dumbbell className="size-6" />
 </span>
 <p className="mt-3 text-sm font-extrabold text-stone-900">Select a session</p>
 <p className="mt-1 max-w-sm text-xs font-medium text-stone-600">Start a workout or pick one.</p>
 </div>
 ) : selected.isLoading ? (
 <div className="space-y-3" aria-label="Loading session">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="h-20 animate-pulse rounded-lg bg-stone-100" />
 ))}
 </div>
 ) : selected.isError || !selected.data ? (
 <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Unable to load this session.</p>
 ) : (
 <div className="space-y-4">
 <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-rose-100">
 <p className="font-bold text-stone-900">{selected.data.firstName} {selected.data.lastName}</p>
 <p className="mt-1 text-sm font-medium text-stone-600">{selected.data.workoutPlanName}</p>
 </div>
 {selected.data.exercises.map((exercise) => {
 const logs = selected.data!.sets.filter((set) => set.sessionExerciseId === exercise.id)
 const draft = drafts[exercise.id] ?? { weightKg: "", reps: "", rpe: "" }
 const next = logs.length + 1
 return (
 <div key={exercise.id} className="rounded-xl border border-border bg-card p-4 transition hover:border-orange-200 hover:shadow-md">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <p className="font-bold text-stone-900">{exercise.exerciseName}</p>
 <p className="mt-1 text-xs font-medium text-stone-600">Target: {exercise.setsTarget ?? "—"} sets × {exercise.repsTarget ?? "—"} reps</p>
 </div>
 <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-800">{logs.length} logged</Badge>
 </div>
 {logs.length > 0 && (
 <div className="mt-3 space-y-1">
 {logs.map((l) => (
 <div key={l.id} className="flex justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs font-semibold text-stone-700 tabular-nums">
 <span>Set {l.setNumber}</span>
 <span>{l.weightKg ?? "—"} kg × {l.reps ?? "—"}{l.rpe ? ` · RPE ${l.rpe}` : ""}</span>
 </div>
 ))}
 </div>
 )}
 {selected.data.status === "IN_PROGRESS" && (
 <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
 <Input aria-label={`${exercise.exerciseName} weight`} inputMode="decimal" placeholder="kg" value={draft.weightKg} onChange={(e) => setDrafts((c) => ({ ...c, [exercise.id]: { ...draft, weightKg: e.target.value } }))} className="min-h-11 rounded-lg text-sm" />
 <Input aria-label={`${exercise.exerciseName} reps`} inputMode="numeric" placeholder="reps" value={draft.reps} onChange={(e) => setDrafts((c) => ({ ...c, [exercise.id]: { ...draft, reps: e.target.value } }))} className="min-h-11 rounded-lg text-sm" />
 <Input aria-label={`${exercise.exerciseName} RPE`} inputMode="decimal" placeholder="RPE" value={draft.rpe} onChange={(e) => setDrafts((c) => ({ ...c, [exercise.id]: { ...draft, rpe: e.target.value } }))} className="min-h-11 rounded-lg text-sm" />
 <Button size="sm" className="min-h-11 rounded-xl bg-stone-950 text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={() => saveSet(exercise.id, next)} disabled={logSet.isPending}>
 <Plus className="size-3.5" aria-hidden="true" />Set {next}
 </Button>
 </div>
 )}
 </div>
 )
 })}
 <div className="flex justify-end pt-2">
 {selected.data.status === "IN_PROGRESS" && (
 <Button onClick={completeSession} disabled={complete.isPending} className="btn-sheen min-h-11 rounded-lg bg-primary text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <CheckCircle2 className="size-4" aria-hidden="true" />{complete.isPending ? "Completing..." : "Complete session"}
 </Button>
 )}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </section>
 </div>
 </div>
 )
}
