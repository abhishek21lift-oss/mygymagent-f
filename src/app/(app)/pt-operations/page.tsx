"use client";

import Link from "next/link";
import * as React from "react";
import { StatCard, toStatTone } from "@/components/shared/stat-card";
import { ArrowRight, CheckCircle2, ClipboardCheck, Dumbbell, Sparkles, UserRound, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useUpdateWorkoutAssignmentStatus, useWorkoutAssignments } from "@/lib/hooks/use-workouts";
import type { WorkoutAssignment } from "@/lib/types/gym";
import { ApiError } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { PtPackagesSection } from "./pt-packages-section";

const tones = {
 cyan: "from-cyan-50 to-sky-50 text-cyan-700",
 emerald: "from-emerald-50 to-teal-50 text-emerald-700",
 amber: "from-amber-50 to-orange-50 text-amber-700",
 violet: "from-violet-50 to-fuchsia-50 text-violet-700",
};

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

function AssignmentRow({ assignment }: { assignment: WorkoutAssignment }) {
 const { hasPermission } = useAuth();
 const updateStatus = useUpdateWorkoutAssignmentStatus();
 const member = assignment.member;
 async function complete() { try { await updateStatus.mutateAsync({ id: assignment.id, status: "COMPLETED" }); toast.success("Workout assignment marked complete"); } catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to update assignment"); } }
 return <div className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-lg sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-violet-700"><UserRound className="size-5" /></span><div className="min-w-0"><p className="truncate text-sm font-extrabold text-stone-900">{member ? `${member.firstName} ${member.lastName}` : "Member unavailable"}</p><p className="truncate text-xs font-medium text-stone-500">{assignment.workoutPlan?.name ?? "Workout plan unavailable"}</p></div></div><div className="flex items-center gap-3 text-xs font-semibold text-stone-500"><span>{new Date(assignment.startDate).toLocaleDateString(undefined,{day:"numeric",month:"short"})}</span><Badge variant={assignment.status === "ACTIVE" ? "default" : assignment.status === "COMPLETED" ? "success" : "secondary"}>{assignment.status}</Badge></div><div className="flex gap-2"><Button asChild variant="ghost" size="sm"><Link href={member ? `/members/${member.id}` : "/members"}>Client <ArrowRight className="size-3.5" /></Link></Button>{assignment.status === "ACTIVE" && hasPermission("workouts.assign") && <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={complete}><CheckCircle2 className="size-4" />{updateStatus.isPending ? "Saving..." : "Complete"}</Button>}</div></div>;
}

export default function PtoOperationsPage() {
 const assignmentsQuery = useWorkoutAssignments({ page: 1, pageSize: 50, order: "desc" });
 const assignments = assignmentsQuery.data?.items ?? [];
 const active = assignments.filter(x => x.status === "ACTIVE");
 const completed = assignments.filter(x => x.status === "COMPLETED");
 const clients = new Set(active.map(x => x.memberId)).size;
 const plans = new Set(active.map(x => x.workoutPlanId)).size;
 return <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero id="pt-title" icon={Dumbbell} title="PT overview"
 description="Assignments, packages and coaching load" actions={<><Button asChild variant="outline" className="rounded-lg border-stone-200 bg-card"><Link href="/workouts"><Dumbbell className="size-4" /> Manage workouts</Link></Button><Button asChild className="rounded-lg bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] shadow-lg shadow-violet-500/20"><Link href="/ai"><Sparkles className="size-4" /> Ask AI <ArrowRight className="size-4" /></Link></Button></>} />
 <section className="grid gap-4 grid-cols-2 xl:grid-cols-4"><Metric icon={ClipboardCheck} label="Active assignments" value={assignmentsQuery.isLoading ? "—" : active.length} tone="cyan" /><Metric icon={Users} label="Active clients" value={assignmentsQuery.isLoading ? "—" : clients} tone="emerald" /><Metric icon={CheckCircle2} label="Completed" value={assignmentsQuery.isLoading ? "—" : completed.length} tone="amber" /><Metric icon={Dumbbell} label="Plans in workload" value={assignmentsQuery.isLoading ? "—" : plans} tone="violet" /></section>
 <section className="grid gap-5"><Card className="overflow-hidden border-border bg-card"><CardHeader className="border-b border-border bg-white px-5 py-5"><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-3 text-stone-950"><span className="flex size-10 items-center justify-center rounded-xl bg-muted/40 text-violet-700"><Zap className="size-4" /></span>Active coaching queue</CardTitle></CardHeader><CardContent className="p-3 sm:p-4">{assignmentsQuery.isError ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">Unable to load PT assignments. Refresh and try again.</div> : active.length === 0 && !assignmentsQuery.isLoading ? <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/70 p-10 text-center"><ClipboardCheck className="mx-auto size-8 text-stone-400" /><p className="mt-3 text-sm font-bold text-stone-900">No active PT assignments</p><p className="mt-1 text-xs text-stone-500">Assign a workout plan to begin.</p><Button asChild className="mt-4 rounded-xl"><Link href="/workouts">Assign a workout</Link></Button></div> : <div className="flex flex-col gap-3">{active.map(x => <AssignmentRow key={x.id} assignment={x} />)}</div>}</CardContent></Card></section>
 <PtPackagesSection />
 <Card className="overflow-hidden border-border bg-card shadow-lg"><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground text-stone-950">Recent completions</CardTitle></CardHeader><CardContent>{completed.length === 0 ? <p className="text-sm font-medium text-stone-500">No completed assignments yet.</p> : <div className="flex flex-col gap-3">{completed.slice(0,10).map(x => <AssignmentRow key={x.id} assignment={x} />)}</div>}</CardContent></Card>
 </div></div>;
}
