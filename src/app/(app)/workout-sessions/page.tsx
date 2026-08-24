"use client"

import * as React from "react"
import { CheckCircle2, Dumbbell, Play, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkoutAssignments } from "@/lib/hooks/use-workouts"
import { useCompleteWorkoutSession, useLogWorkoutSet, useStartWorkoutSession, useTodayWorkoutSessions, useWorkoutSession } from "@/lib/hooks/use-workout-sessions"
import { ApiError } from "@/lib/api/client"

export default function WorkoutSessionsPage() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [drafts, setDrafts] = React.useState<Record<string, { weightKg: string; reps: string; rpe: string }>>({})
  const assignments = useWorkoutAssignments({ page: 1, pageSize: 50, order: "desc" })
  const sessions = useTodayWorkoutSessions()
  const start = useStartWorkoutSession()
  const logSet = useLogWorkoutSet()
  const complete = useCompleteWorkoutSession()
  const selected = useWorkoutSession(selectedId)
  const activeAssignments = (assignments.data?.items ?? []).filter((item) => item.status === "ACTIVE")

  async function startSession(assignmentId: string) {
    try {
      const session = await start.mutateAsync({ assignmentId })
      setSelectedId(session.id)
      toast.success("Workout session started")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to start workout session")
    }
  }

  async function saveSet(exerciseId: string, nextSetNumber: number) {
    if (!selectedId) return
    const draft = drafts[exerciseId] ?? { weightKg: "", reps: "", rpe: "" }
    try {
      await logSet.mutateAsync({ sessionId: selectedId, sessionExerciseId: exerciseId, setNumber: nextSetNumber, weightKg: draft.weightKg ? Number(draft.weightKg) : undefined, reps: draft.reps ? Number(draft.reps) : undefined, rpe: draft.rpe ? Number(draft.rpe) : undefined })
      setDrafts((current) => ({ ...current, [exerciseId]: { weightKg: "", reps: "", rpe: "" } }))
      toast.success(`Set ${nextSetNumber} logged`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to log set")
    }
  }

  async function completeSession() {
    if (!selectedId) return
    try {
      await complete.mutateAsync(selectedId)
      toast.success("Workout session completed")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to complete workout session")
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Today's Sessions" description="Run real workout execution from assignment to completed training history." />
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.10] via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Execution layer</div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Coach the workout, not just the plan.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Start an assigned workout, capture sets as they happen, and finish with a durable execution record for Member 360 and future AI analysis.</p></div><Dumbbell className="hidden size-10 text-primary/60 sm:block" /></div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.25fr]">
        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/20"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Today's execution queue</CardTitle><p className="mt-1 text-xs text-muted-foreground">Only tenant-scoped sessions returned by the backend.</p></div><Badge variant="outline">{sessions.data?.length ?? 0} sessions</Badge></div></CardHeader><CardContent className="p-3 sm:p-4 space-y-5">
          {activeAssignments.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ready to start</p><div className="space-y-2">{activeAssignments.map((assignment) => <div key={assignment.id} className="flex items-center gap-3 rounded-2xl border p-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Dumbbell className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{assignment.member ? `${assignment.member.firstName} ${assignment.member.lastName}` : "Member"}</p><p className="truncate text-xs text-muted-foreground">{assignment.workoutPlan?.name ?? "Workout plan"}</p></div><Button size="sm" onClick={() => startSession(assignment.id)} disabled={start.isPending}><Play className="size-3.5" />{start.isPending ? "Starting" : "Start"}</Button></div>)}</div></div>}
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Started today</p>{sessions.isLoading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div> : sessions.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Unable to load today's sessions.</div> : sessions.data?.length ? <div className="space-y-2">{sessions.data.map((session) => <button key={session.id} onClick={() => setSelectedId(session.id)} className={`w-full rounded-2xl border p-3 text-left transition hover:border-primary/30 hover:bg-muted/30 ${selectedId === session.id ? "border-primary/40 bg-primary/[0.05]" : ""}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{session.firstName} {session.lastName}</p><p className="text-xs text-muted-foreground">{session.workoutPlanName}</p></div><Badge variant={session.status === "COMPLETED" ? "success" : "default"}>{session.status.replace("_", " ")}</Badge></div></button>)}</div> : <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No workout sessions started today.</div>}</div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/20"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Session execution</CardTitle><p className="mt-1 text-xs text-muted-foreground">Snapshot of the assigned plan plus logged sets.</p></div>{selected.data && <Badge variant={selected.data.status === "COMPLETED" ? "success" : "default"}>{selected.data.status.replace("_", " ")}</Badge>}</div></CardHeader><CardContent className="p-4 sm:p-5">
          {!selectedId ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed text-center"><Dumbbell className="size-9 text-muted-foreground" /><p className="mt-3 font-semibold">Select a session</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Start a workout from the queue or choose one already started today.</p></div> : selected.isLoading ? <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div> : selected.isError || !selected.data ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Unable to load this session.</div> : <div className="space-y-4"><div className="rounded-2xl bg-muted/30 p-4"><p className="font-semibold">{selected.data.firstName} {selected.data.lastName}</p><p className="mt-1 text-sm text-muted-foreground">{selected.data.workoutPlanName}</p></div>{selected.data.exercises.map((exercise) => { const logs = selected.data!.sets.filter((set) => set.sessionExerciseId === exercise.id); const draft = drafts[exercise.id] ?? { weightKg: "", reps: "", rpe: "" }; const nextSet = logs.length + 1; return <div key={exercise.id} className="rounded-2xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{exercise.exerciseName}</p><p className="mt-1 text-xs text-muted-foreground">Target: {exercise.setsTarget ?? "—"} sets × {exercise.repsTarget ?? "—"} reps</p></div><Badge variant="outline">{logs.length} logged</Badge></div>{logs.length > 0 && <div className="mt-3 space-y-1 text-xs text-muted-foreground">{logs.map((log) => <div key={log.id} className="flex justify-between rounded-lg bg-muted/30 px-3 py-2"><span>Set {log.setNumber}</span><span>{log.weightKg ?? "—"} kg × {log.reps ?? "—"}{log.rpe ? ` · RPE ${log.rpe}` : ""}</span></div>)}</div>}{selected.data.status === "IN_PROGRESS" && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"><input aria-label={`${exercise.exerciseName} weight`} inputMode="decimal" placeholder="kg" value={draft.weightKg} onChange={(event) => setDrafts((current) => ({ ...current, [exercise.id]: { ...draft, weightKg: event.target.value } }))} className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /><input aria-label={`${exercise.exerciseName} reps`} inputMode="numeric" placeholder="reps" value={draft.reps} onChange={(event) => setDrafts((current) => ({ ...current, [exercise.id]: { ...draft, reps: event.target.value } }))} className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /><input aria-label={`${exercise.exerciseName} RPE`} inputMode="decimal" placeholder="RPE" value={draft.rpe} onChange={(event) => setDrafts((current) => ({ ...current, [exercise.id]: { ...draft, rpe: event.target.value } }))} className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /><Button size="sm" onClick={() => saveSet(exercise.id, nextSet)} disabled={logSet.isPending}><Plus className="size-3.5" />Set {nextSet}</Button></div>}</div>})}<div className="flex justify-end pt-2">{selected.data.status === "IN_PROGRESS" && <Button onClick={completeSession} disabled={complete.isPending}><CheckCircle2 className="size-4" />{complete.isPending ? "Completing..." : "Complete session"}</Button>}</div></div>}
        </CardContent></Card>
      </div>
    </div>
  )
}
