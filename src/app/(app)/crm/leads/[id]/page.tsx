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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="lead-title"
          icon={UserRound}
          title={`${currentLead.firstName} ${currentLead.lastName}`}
          variant="light"
          accent="violet"
          actions={
            <>
              <Button asChild variant="outline" className="min-h-11 rounded-2xl border-blue-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <Link href="/crm"><ArrowLeft className="size-4" aria-hidden="true" /> Back to Sales</Link>
              </Button>
              {currentLead.status !== "WON" ? (
                <Button asChild className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  <Link href={`/crm/leads/${currentLead.id}/convert`}><ArrowRightCircle className="size-4" aria-hidden="true" /> Convert to member</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="min-h-11 rounded-2xl border-emerald-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
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
          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/60 px-5 py-5 sm:px-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
                <Edit3 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Lead profile</h2>
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
                    <Button type="submit" disabled={update.isPending} className="min-h-11 rounded-2xl bg-stone-950 text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">
                      <Save className="size-4" aria-hidden="true" /> {update.isPending ? "Saving..." : "Save profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="border-b border-stone-100/80 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/60 px-5 py-5">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Pipeline control</h2>
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
                <div className="rounded-[20px] border border-blue-100/70 bg-gradient-to-br from-blue-50/70 to-cyan-50/40 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Contact</p>
                  <div className="mt-2 space-y-1 text-sm font-medium text-stone-800">
                    {currentLead.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 text-blue-600" aria-hidden="true" />{currentLead.phone}</p>}
                    {currentLead.email && <p className="flex items-center gap-2"><Mail className="size-3.5 text-violet-600" aria-hidden="true" />{currentLead.email}</p>}
                    {!currentLead.phone && !currentLead.email && <p className="text-stone-600">No contact details yet.</p>}
                  </div>
                </div>
                <div className="rounded-[20px] border border-stone-200/70 bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Created</p>
                  <p className="mt-2 text-sm font-bold text-stone-900">{new Date(currentLead.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="lead-followups" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-violet-50/60 px-5 py-5 sm:px-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-md shadow-cyan-500/25">
              <CalendarClock className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="lead-followups" className="font-serif text-xl font-semibold tracking-tight text-stone-950">Follow-ups</h2>
            </div>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <Form {...followUpForm}>
              <form onSubmit={followUpForm.handleSubmit(createFollowUp)} className="grid gap-3 rounded-[20px] border border-blue-100/70 bg-blue-50/40 p-4 sm:grid-cols-[180px_1fr_auto]">
                <FormField control={followUpForm.control} name="dueAt" render={({ field }) => <FormItem><FormLabel>Due date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={followUpForm.control} name="note" render={({ field }) => <FormItem><FormLabel>Next action</FormLabel><FormControl><Input placeholder="Call, WhatsApp, trial reminder..." {...field} /></FormControl><FormMessage /></FormItem>} />
                <div className="flex items-end">
                  <Button type="submit" disabled={addFollowUp.isPending} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    {addFollowUp.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                </div>
              </form>
            </Form>
            <div className="space-y-3">
              {currentLead.followUps?.map((followUp) => (
                <div key={followUp.id} className="flex flex-col gap-3 rounded-[20px] border border-white/90 bg-white/80 p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
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
                <div className="rounded-[20px] border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center text-sm font-medium text-stone-600">
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

function Metric({ icon: Icon, label, value, tone, hint }: { icon: LucideIcon; label: string; value: string | number; tone: "violet" | "rose" | "amber" | "cyan"; hint?: string }) {
  const tones = {
    violet: { bar: "from-violet-600 via-purple-600 to-fuchsia-600", tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30", orb: "bg-fuchsia-400/20", ring: "hover:border-violet-200 hover:shadow-violet-500/10" },
    rose: { bar: "from-rose-500 via-red-500 to-orange-500", tile: "from-rose-500 to-orange-500 shadow-rose-500/30", orb: "bg-rose-400/20", ring: "hover:border-rose-200 hover:shadow-rose-500/10" },
    amber: { bar: "from-amber-400 via-orange-500 to-rose-500", tile: "from-amber-500 to-orange-600 shadow-amber-500/30", orb: "bg-amber-400/20", ring: "hover:border-amber-200 hover:shadow-amber-500/10" },
    cyan: { bar: "from-cyan-400 via-sky-500 to-blue-600", tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30", orb: "bg-cyan-400/20", ring: "hover:border-cyan-200 hover:shadow-cyan-500/10" },
  }
  const t = tones[tone]
  return (
    <Card className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <CardContent className="relative flex items-center gap-4 p-5">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg ${t.tile} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-[11px] font-medium text-stone-600">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
