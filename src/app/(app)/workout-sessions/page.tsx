"use client"

import * as React from "react"
import { CheckCircle2, Dumbbell, Flame, Play, Plus, Sparkles, Target, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useWorkoutAssignments } from "@/lib/hooks/use-workouts"
import { useCompleteWorkoutSession, useLogWorkoutSet, useStartWorkoutSession, useTodayWorkoutSessions, useWorkoutSession } from "@/lib/hooks/use-workout-sessions"
import { ApiError } from "@/lib/api/client"

type MetricTone = "rose" | "cyan" | "emerald"

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; orb: string; ring: string }> = {
  rose: {
    bar: "from-rose-500 via-red-500 to-orange-500",
    tile: "from-rose-500 to-orange-500 shadow-rose-500/30",
    orb: "bg-rose-400/20",
    ring: "hover:border-rose-200 hover:shadow-rose-500/10",
  },
  cyan: {
    bar: "from-cyan-400 via-sky-500 to-blue-600",
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    orb: "bg-cyan-400/20",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
  },
  emerald: {
    bar: "from-emerald-400 via-teal-500 to-green-600",
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    orb: "bg-emerald-400/20",
    ring: "hover:border-emerald-200 hover:shadow-emerald-500/10",
  },
}

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: React.ReactNode; hint: string; tone: MetricTone }) {
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
          <p className="mt-1 text-[11px] font-medium text-stone-600">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="ws-title" className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-rose-300/25 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-orange-300/25 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-cyan-300/20 blur-3xl motion-safe:animate-pulse-slow" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-rose-700">
                <Sparkles className="size-3.5" aria-hidden="true" /> Live workout execution
              </div>
              <h1 id="ws-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl lg:text-6xl">Today&apos;s Sessions</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600">Run the actual workout, capture every set and close the session with a clean execution record.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-gradient-to-r from-rose-50 to-orange-50 px-4 py-3 text-xs font-bold text-stone-700">
              <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25" aria-hidden="true">
                <Dumbbell className="size-5" />
              </span>
              <span>{activeAssignments.length} ready · {sessions.data?.filter((x) => x.status === "COMPLETED").length ?? 0} closed</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="ws-stats" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 id="ws-stats" className="sr-only">Execution numbers</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={Target} label="Ready to start" value={activeAssignments.length} hint="Active client assignments" tone="rose" />
            <Metric icon={Users} label="Started today" value={sessions.data?.length ?? 0} hint="Live execution records" tone="cyan" />
            <Metric icon={CheckCircle2} label="Completed" value={sessions.data?.filter((x) => x.status === "COMPLETED").length ?? 0} hint="Closed sessions" tone="emerald" />
          </div>
        </section>

        <section aria-label="Execution workspace" className="grid animate-in fade-in slide-in-from-bottom-2 gap-5 duration-500 [animation-delay:100ms] xl:grid-cols-[.9fr_1.35fr]">
          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-rose-900/5 backdrop-blur-xl">
            <div className="flex items-start gap-3 border-b border-stone-100/80 bg-gradient-to-r from-rose-50/90 via-white to-orange-50/60 px-5 py-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25" aria-hidden="true">
                <Flame className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold tracking-tight text-stone-950">Execution queue</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">Start an assigned workout or reopen today&apos;s session.</p>
              </div>
            </div>
            <CardContent className="space-y-5 p-4">
              {activeAssignments.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Ready to start</p>
                  <div className="space-y-2">
                    {activeAssignments.map((a) => (
                      <div key={a.id} className="group flex items-center gap-3 rounded-[20px] border border-stone-200/80 bg-white/70 p-3 transition duration-200 hover:-translate-y-px hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-md">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                          <Dumbbell className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-stone-900">{a.member ? `${a.member.firstName} ${a.member.lastName}` : "Member"}</p>
                          <p className="truncate text-xs font-medium text-stone-600">{a.workoutPlan?.name ?? "Workout plan"}</p>
                        </div>
                        <Button size="sm" className="min-h-11 rounded-xl bg-[linear-gradient(105deg,#e11d48,#f97316_60%,#0891b2)] text-white shadow-md shadow-rose-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" onClick={() => startSession(a.id)} disabled={start.isPending}>
                          <Play className="size-3.5" aria-hidden="true" />{start.isPending ? "Starting" : "Start"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Started today</p>
                {sessions.isLoading ? (
                  <div className="space-y-2" aria-label="Loading today's sessions">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl bg-gradient-to-r from-stone-100 to-stone-50" />
                    ))}
                  </div>
                ) : sessions.isError ? (
                  <p role="alert" className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-4 text-sm font-semibold text-rose-700">Unable to load today&apos;s sessions.</p>
                ) : sessions.data?.length ? (
                  <div className="space-y-2">
                    {sessions.data.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        aria-pressed={selectedId === s.id}
                        className={`w-full rounded-[20px] border p-3 text-left transition duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 ${selectedId === s.id ? "border-rose-300 bg-gradient-to-r from-rose-50 to-orange-50 shadow-md" : "border-stone-200/80 bg-white/70 hover:border-rose-200 hover:bg-white"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-stone-900">{s.firstName} {s.lastName}</p>
                            <p className="truncate text-xs font-medium text-stone-600">{s.workoutPlanName}</p>
                          </div>
                          <Badge variant={s.status === "COMPLETED" ? "success" : "default"}>{s.status.replace("_", " ")}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center text-sm font-medium text-stone-600">No workout sessions started today.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-cyan-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-orange-50/60 px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25" aria-hidden="true">
                  <Target className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold tracking-tight text-stone-950">Session execution</h2>
                  <p className="mt-0.5 text-xs font-medium text-stone-600">Assigned targets and logged sets.</p>
                </div>
              </div>
              {selected.data && <Badge variant={selected.data.status === "COMPLETED" ? "success" : "default"}>{selected.data.status.replace("_", " ")}</Badge>}
            </div>
            <CardContent className="p-4 sm:p-5">
              {!selectedId ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-[22px] border border-dashed border-rose-200 bg-gradient-to-br from-rose-50/70 to-orange-50/50 p-8 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25" aria-hidden="true">
                    <Dumbbell className="size-6" />
                  </span>
                  <p className="mt-3 text-sm font-extrabold text-stone-900">Select a session</p>
                  <p className="mt-1 max-w-sm text-xs font-medium text-stone-600">Start a workout from the queue or choose one already started today.</p>
                </div>
              ) : selected.isLoading ? (
                <div className="space-y-3" aria-label="Loading session">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
                  ))}
                </div>
              ) : selected.isError || !selected.data ? (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Unable to load this session.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[20px] bg-gradient-to-br from-rose-50 via-orange-50/70 to-cyan-50/60 p-4 ring-1 ring-rose-100">
                    <p className="font-bold text-stone-900">{selected.data.firstName} {selected.data.lastName}</p>
                    <p className="mt-1 text-sm font-medium text-stone-600">{selected.data.workoutPlanName}</p>
                  </div>
                  {selected.data.exercises.map((exercise) => {
                    const logs = selected.data!.sets.filter((set) => set.sessionExerciseId === exercise.id)
                    const draft = drafts[exercise.id] ?? { weightKg: "", reps: "", rpe: "" }
                    const next = logs.length + 1
                    return (
                      <div key={exercise.id} className="rounded-[20px] border border-stone-200/80 bg-white/70 p-4 transition hover:border-orange-200 hover:shadow-md">
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
                              <div key={l.id} className="flex justify-between rounded-lg bg-gradient-to-r from-stone-50 to-orange-50/50 px-3 py-2 text-xs font-semibold text-stone-700 tabular-nums">
                                <span>Set {l.setNumber}</span>
                                <span>{l.weightKg ?? "—"} kg × {l.reps ?? "—"}{l.rpe ? ` · RPE ${l.rpe}` : ""}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {selected.data.status === "IN_PROGRESS" && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                            <input aria-label={`${exercise.exerciseName} weight`} inputMode="decimal" placeholder="kg" value={draft.weightKg} onChange={(e) => setDrafts((c) => ({ ...c, [exercise.id]: { ...draft, weightKg: e.target.value } }))} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" />
                            <input aria-label={`${exercise.exerciseName} reps`} inputMode="numeric" placeholder="reps" value={draft.reps} onChange={(e) => setDrafts((c) => ({ ...c, [exercise.id]: { ...draft, reps: e.target.value } }))} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" />
                            <input aria-label={`${exercise.exerciseName} RPE`} inputMode="decimal" placeholder="RPE" value={draft.rpe} onChange={(e) => setDrafts((c) => ({ ...c, [exercise.id]: { ...draft, rpe: e.target.value } }))} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-rose-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" />
                            <Button size="sm" className="min-h-11 rounded-xl bg-stone-950 text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950" onClick={() => saveSet(exercise.id, next)} disabled={logSet.isPending}>
                              <Plus className="size-3.5" aria-hidden="true" />Set {next}
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div className="flex justify-end pt-2">
                    {selected.data.status === "IN_PROGRESS" && (
                      <Button onClick={completeSession} disabled={complete.isPending} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#e11d48,#f97316_55%,#0891b2)] text-white shadow-lg shadow-rose-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
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
