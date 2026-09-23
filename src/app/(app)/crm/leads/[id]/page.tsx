"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ArrowLeft, ArrowRightCircle, CalendarClock, Check, Edit3, Flame, Mail, Phone, Save, Sparkles, Target, UserRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { UserSelect } from "@/components/shared/user-select"
import { PageHero } from "@/components/shared/page-hero"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLead, useUpdateLead } from "@/lib/hooks/use-lead"
import { useUpdateLeadStatus, useAddFollowUp, useCompleteFollowUp } from "@/lib/hooks/use-leads"
import { createLeadSchema, createFollowUpSchema, type CreateLeadInput, type CreateFollowUpInput } from "@/lib/validation/gym"
import type { LeadStatus } from "@/lib/types/gym"
import { ApiError } from "@/lib/api/client"
import { StatCard, toStatTone } from "@/components/shared/stat-card";

const statuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "TRIAL", "PROPOSAL", "WON", "LOST"]
const scoreByStatus: Record<LeadStatus, number> = { NEW: 35, CONTACTED: 50, QUALIFIED: 72, TRIAL: 88, PROPOSAL: 92, WON: 100, LOST: 5 }

function scoreLead(status: LeadStatus, hasPhone: boolean, hasEmail: boolean, hasSource: boolean, openFollowUps: number) {
 return Math.min(100, scoreByStatus[status] + (hasPhone ? 5 : 0) + (hasEmail ? 5 : 0) + (hasSource ? 5 : 0) + Math.min(10, openFollowUps * 2))
}

export default function Lead360Page({ params }: { params: { id: string } }) {
 const query = useLead(params.id)
 const update = useUpdateLead()
 const statusMutation = useUpdateLeadStatus()
 const addFollowUp = useAddFollowUp()
 const completeFollowUp = useCompleteFollowUp()
 const lead = query.data
 const form = useForm<CreateLeadInput>({ resolver: zodResolver(createLeadSchema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", source: "", notes: "" } })
 const followUpForm = useForm<CreateFollowUpInput>({ resolver: zodResolver(createFollowUpSchema), defaultValues: { dueAt: "", note: "" } })

 React.useEffect(() => {
 if (lead) form.reset({ firstName: lead.firstName, lastName: lead.lastName, email: lead.email ?? "", phone: lead.phone ?? "", source: lead.source ?? "", notes: lead.notes ?? "" })
 }, [lead, form])

 if (query.isLoading) return <div className="p-6 text-sm font-medium text-stone-600">Loading lead workspace...</div>
 if (!lead) return <div className="p-6 text-sm font-medium text-stone-600">Lead not found.</div>

 const currentLead = lead
 const openFollowUps = currentLead.followUps?.filter((item) => !item.completedAt).length ?? 0
 const score = scoreLead(currentLead.status, Boolean(currentLead.phone), Boolean(currentLead.email), Boolean(currentLead.source), openFollowUps)

 async function save(values: CreateLeadInput) {
 try { await update.mutateAsync({ id: currentLead.id, input: values }); toast.success("Lead updated") }
 catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to update lead") }
 }
 async function changeStatus(value: string) {
 try { await statusMutation.mutateAsync({ id: currentLead.id, status: value as LeadStatus }); toast.success("Pipeline stage updated") }
 catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to update stage") }
 }
 async function createFollowUp(values: CreateFollowUpInput) {
 try { await addFollowUp.mutateAsync({ leadId: currentLead.id, input: { ...values, dueAt: new Date(`${values.dueAt}T12:00:00`).toISOString() } }); toast.success("Follow-up scheduled"); followUpForm.reset() }
 catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to schedule follow-up") }
 }
 async function finishFollowUp(followUpId: string) {
 try { await completeFollowUp.mutateAsync({ leadId: currentLead.id, followUpId }); toast.success("Follow-up completed") }
 catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to complete follow-up") }
 }

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="lead-title"
 icon={UserRound}
 title={`${currentLead.firstName} ${currentLead.lastName}`}
 variant="light"
 accent="violet"
 actions={
 <>
 <Button asChild variant="outline" className="min-h-11 rounded-lg border-blue-200 bg-card hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <Link href="/crm"><ArrowLeft className="size-4" aria-hidden="true" /> Back to Sales</Link>
 </Button>
 {currentLead.status !== "WON" ? (
 <Button asChild className="min-h-11 rounded-lg bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <Link href={`/crm/leads/${currentLead.id}/convert`}><ArrowRightCircle className="size-4" aria-hidden="true" /> Convert to member</Link>
 </Button>
 ) : (
 <Button asChild variant="outline" className="min-h-11 rounded-lg border-emerald-200 bg-card hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
 <Link href={`/members/${currentLead.convertedMemberId}`}><UserRound className="size-4" aria-hidden="true" /> Open member</Link>
 </Button>
 )}
 </>
 }
 />

 <section aria-label="Lead snapshot">
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 <Metric icon={Sparkles} label="Sales priority score" value={score} tone="violet" />
 <Metric icon={Flame} label="Pipeline stage" value={currentLead.status} tone="rose" />
 <Metric icon={CalendarClock} label="Open follow-ups" value={openFollowUps} tone="amber" />
 <Metric icon={Target} label="Lead source" value={currentLead.source ?? "Unknown"} tone="cyan" />
 </div>
 </section>

 <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
 <div className="overflow-hidden rounded-xl border border-border bg-card">
 <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 sm:px-5">
 <div>
 <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Lead profile</h2>
 </div>
 </div>
 <div className="p-5 sm:p-6">
 <Form {...form}>
 <form onSubmit={form.handleSubmit(save)} className="grid gap-5 sm:grid-cols-2">
 {(["firstName", "lastName", "email", "phone", "source"] as const).map((name) => (
 <FormField
 key={name}
 control={form.control}
 name={name}
 render={({ field }) => (
 <FormItem className={name === "source" ? "sm:col-span-2" : ""}>
 <FormLabel>{name === "firstName" ? "First name" : name === "lastName" ? "Last name" : name === "email" ? "Email" : name === "phone" ? "Phone" : "Source"}</FormLabel>
 <FormControl><Input type={name === "email" ? "email" : "text"} {...field} /></FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 ))}
 <FormField
 control={form.control}
 name="notes"
 render={({ field }) => (
 <FormItem className="sm:col-span-2">
 <FormLabel>Notes</FormLabel>
 <FormControl><Textarea rows={5} placeholder="Context, objections, preferences..." {...field} /></FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <div className="flex justify-end sm:col-span-2">
 <Button type="submit" disabled={update.isPending} className="min-h-11 rounded-lg bg-stone-950 text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">
 <Save className="size-4" aria-hidden="true" /> {update.isPending ? "Saving..." : "Save profile"}
 </Button>
 </div>
 </form>
 </Form>
 </div>
 </div>

 <div className="overflow-hidden rounded-xl border border-border bg-card">
 <div className="border-b border-border px-4 py-2.5 sm:px-5">
 <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Pipeline control</h2>
 </div>
 <div className="space-y-5 p-5 sm:p-6">
 <div>
 <p className="mb-2 text-xs font-bold text-stone-600">Stage</p>
 <Select value={currentLead.status} onValueChange={changeStatus} disabled={statusMutation.isPending || currentLead.status === "WON"}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {statuses.filter((status) => status !== "WON").map((status) => (
 <SelectItem key={status} value={status}>{status}</SelectItem>
 ))}
 {currentLead.status === "WON" && <SelectItem value="WON">WON</SelectItem>}
 </SelectContent>
 </Select>
 </div>
 <div>
 <p className="mb-2 text-xs font-bold text-stone-600">Assigned salesperson</p>
 <UserSelect value={currentLead.assignedToUserId ?? undefined} onChange={(value) => update.mutate({ id: currentLead.id, input: { assignedToUserId: value } })} placeholder="Unassigned" />
 </div>
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
 <div className="rounded-xl border border-blue-100/70 bg-muted/40 p-4">
 <p className="text-xs font-black uppercase tracking-[.16em] text-stone-500">Contact</p>
 <div className="mt-2 space-y-1 text-sm font-medium text-stone-800">
 {currentLead.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 text-blue-600" aria-hidden="true" />{currentLead.phone}</p>}
 {currentLead.email && <p className="flex items-center gap-2"><Mail className="size-3.5 text-violet-600" aria-hidden="true" />{currentLead.email}</p>}
 {!currentLead.phone && !currentLead.email && <p className="text-stone-600">No contact details yet.</p>}
 </div>
 </div>
 <div className="rounded-xl border border-stone-200/70 bg-card p-4">
 <p className="text-xs font-black uppercase tracking-[.16em] text-stone-500">Created</p>
 <p className="mt-2 text-sm font-bold text-stone-900">{new Date(currentLead.createdAt).toLocaleDateString()}</p>
 </div>
 </div>
 </div>
 </div>
 </section>

 <section aria-labelledby="lead-followups" className="overflow-hidden rounded-xl border border-border bg-card">
 <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 sm:px-5">
 <div>
 <h2 id="lead-followups" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Follow-ups</h2>
 </div>
 </div>
 <div className="space-y-5 p-5 sm:p-6">
 <Form {...followUpForm}>
 <form onSubmit={followUpForm.handleSubmit(createFollowUp)} className="grid gap-3 rounded-xl border border-blue-100/70 bg-blue-50/40 p-4 sm:grid-cols-[180px_1fr_auto]">
 <FormField control={followUpForm.control} name="dueAt" render={({ field }) => <FormItem><FormLabel>Due date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
 <FormField control={followUpForm.control} name="note" render={({ field }) => <FormItem><FormLabel>Next action</FormLabel><FormControl><Input placeholder="Call, WhatsApp, trial reminder..." {...field} /></FormControl><FormMessage /></FormItem>} />
 <div className="flex items-end">
 <Button type="submit" disabled={addFollowUp.isPending} className="min-h-11 rounded-lg bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 {addFollowUp.isPending ? "Scheduling..." : "Schedule"}
 </Button>
 </div>
 </form>
 </Form>
 <div className="space-y-3">
 {currentLead.followUps?.map((followUp) => (
 <div key={followUp.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <Badge variant={followUp.completedAt ? "secondary" : "warning"}>{followUp.completedAt ? "Completed" : "Open"}</Badge>
 <span className="text-sm font-bold text-stone-800">{new Date(followUp.dueAt).toLocaleDateString()}</span>
 </div>
 <p className={followUp.completedAt ? "mt-2 text-sm font-medium text-stone-600 line-through" : "mt-2 text-sm font-medium text-stone-900"}>{followUp.note}</p>
 </div>
 {!followUp.completedAt && (
 <Button size="sm" variant="outline" onClick={() => finishFollowUp(followUp.id)} disabled={completeFollowUp.isPending} className="min-h-11 shrink-0 rounded-xl border-blue-200 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <Check className="size-3.5" aria-hidden="true" /> Done
 </Button>
 )}
 </div>
 ))}
 {(!currentLead.followUps || currentLead.followUps.length === 0) && (
 <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center text-sm font-medium text-stone-600">
 No follow-ups yet.
 </div>
 )}
 </div>
 </div>
 </section>
 </div>
 </div>
 )
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
