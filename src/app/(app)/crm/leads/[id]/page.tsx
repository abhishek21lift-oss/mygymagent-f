"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ArrowLeft, ArrowRightCircle, CalendarClock, Check, Edit3, Flame, Mail, Phone, Save, Sparkles, Target, UserRound } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { BranchSelect } from "@/components/shared/branch-select"
import { UserSelect } from "@/components/shared/user-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLead, useUpdateLead, useConvertLead } from "@/lib/hooks/use-lead"
import { useUpdateLeadStatus, useAddFollowUp, useCompleteFollowUp } from "@/lib/hooks/use-leads"
import { createLeadSchema, createFollowUpSchema, type CreateLeadInput, type CreateFollowUpInput } from "@/lib/validation/gym"
import type { LeadStatus } from "@/lib/types/gym"
import { ApiError } from "@/lib/api/client"

const statuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "TRIAL", "WON", "LOST"]
const scoreByStatus: Record<LeadStatus, number> = { NEW: 35, CONTACTED: 50, QUALIFIED: 72, TRIAL: 88, WON: 100, LOST: 5 }

function scoreLead(status: LeadStatus, hasPhone: boolean, hasEmail: boolean, hasSource: boolean, openFollowUps: number) {
  return Math.min(100, scoreByStatus[status] + (hasPhone ? 5 : 0) + (hasEmail ? 5 : 0) + (hasSource ? 5 : 0) + Math.min(10, openFollowUps * 2))
}

export default function Lead360Page({ params }: { params: { id: string } }) {
  const router = useRouter()
  const query = useLead(params.id)
  const update = useUpdateLead()
  const statusMutation = useUpdateLeadStatus()
  const addFollowUp = useAddFollowUp()
  const completeFollowUp = useCompleteFollowUp()

  const lead = query.data
  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", source: "", notes: "" },
  })
  const followUpForm = useForm<CreateFollowUpInput>({
    resolver: zodResolver(createFollowUpSchema),
    defaultValues: { dueAt: "", note: "" },
  })

  React.useEffect(() => {
    if (lead) {
      form.reset({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        source: lead.source ?? "",
        notes: lead.notes ?? "",
      })
    }
  }, [lead, form])

  if (query.isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading lead workspace...</div>
  if (!lead) return <div className="p-6 text-sm text-muted-foreground">Lead not found.</div>

  const openFollowUps = lead.followUps?.filter((item) => !item.completedAt).length ?? 0
  const score = scoreLead(lead.status, Boolean(lead.phone), Boolean(lead.email), Boolean(lead.source), openFollowUps)

  async function save(values: CreateLeadInput) {
    try {
      await update.mutateAsync({ id: lead.id, input: values })
      toast.success("Lead updated")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update lead")
    }
  }

  async function changeStatus(value: string) {
    try {
      await statusMutation.mutateAsync({ id: lead.id, status: value as LeadStatus })
      toast.success("Pipeline stage updated")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update stage")
    }
  }

  async function createFollowUp(values: CreateFollowUpInput) {
    try {
      await addFollowUp.mutateAsync({ leadId: lead.id, input: { ...values, dueAt: new Date(`${values.dueAt}T12:00:00`).toISOString() } })
      toast.success("Follow-up scheduled")
      followUpForm.reset()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to schedule follow-up")
    }
  }

  async function finishFollowUp(followUpId: string) {
    try {
      await completeFollowUp.mutateAsync({ leadId: lead.id, followUpId })
      toast.success("Follow-up completed")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to complete follow-up")
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/crm"><ArrowLeft className="size-4" /> Back to Sales</Link>
      </Button>

      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description="Lead 360 · pipeline, ownership, follow-ups and conversion handoff"
        actions={
          lead.status !== "WON" ? (
            <Button asChild className="rounded-xl"><Link href={`/crm/leads/${lead.id}/convert`}><ArrowRightCircle className="size-4" /> Convert to member</Link></Button>
          ) : (
            <Button asChild variant="outline" className="rounded-xl"><Link href={`/members/${lead.convertedMemberId}`}><UserRound className="size-4" /> Open member</Link></Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="rounded-xl bg-violet-500/10 p-2 text-violet-600"><Sparkles className="size-4" /></span><span className="text-2xl font-semibold">{score}</span></div><p className="mt-3 text-xs text-muted-foreground">Sales priority score</p></CardContent></Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-5"><span className="rounded-xl bg-rose-500/10 p-2 text-rose-600 inline-flex"><Flame className="size-4" /></span><p className="mt-3 text-2xl font-semibold">{lead.status}</p><p className="text-xs text-muted-foreground">Pipeline stage</p></CardContent></Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-5"><span className="rounded-xl bg-amber-500/10 p-2 text-amber-600 inline-flex"><CalendarClock className="size-4" /></span><p className="mt-3 text-2xl font-semibold">{openFollowUps}</p><p className="text-xs text-muted-foreground">Open follow-ups</p></CardContent></Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-5"><span className="rounded-xl bg-cyan-500/10 p-2 text-cyan-600 inline-flex"><Target className="size-4" /></span><p className="mt-3 text-2xl font-semibold">{lead.source ?? "Unknown"}</p><p className="text-xs text-muted-foreground">Lead source</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/15"><CardTitle className="flex items-center gap-2 text-base"><Edit3 className="size-4 text-primary" /> Lead profile</CardTitle></CardHeader>
          <CardContent className="p-6">
            <Form {...form}><form onSubmit={form.handleSubmit(save)} className="grid gap-5 sm:grid-cols-2">
              {(["firstName", "lastName", "email", "phone", "source"] as const).map((name) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => <FormItem className={name === "source" ? "sm:col-span-2" : ""}><FormLabel>{name === "firstName" ? "First name" : name === "lastName" ? "Last name" : name === "email" ? "Email" : name === "phone" ? "Phone" : "Source"}</FormLabel><FormControl><Input type={name === "email" ? "email" : "text"} {...field} /></FormControl><FormMessage /></FormItem>}/>
              ))}
              <FormField control={form.control} name="notes" render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea rows={5} placeholder="Context, objections, preferences..." {...field} /></FormControl><FormMessage /></FormItem>}/>
              <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={update.isPending}><Save className="size-4" /> {update.isPending ? "Saving..." : "Save profile"}</Button></div>
            </form></Form>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-card to-cyan-500/[0.06] shadow-sm ring-1 ring-primary/15">
          <CardHeader><CardTitle className="text-base">Pipeline control</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div><p className="mb-2 text-xs font-medium text-muted-foreground">Stage</p><Select value={lead.status} onValueChange={changeStatus} disabled={statusMutation.isPending || lead.status === "WON"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.filter((status) => status !== "WON").map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}{lead.status === "WON" && <SelectItem value="WON">WON</SelectItem>}</SelectContent></Select></div>
            <div><p className="mb-2 text-xs font-medium text-muted-foreground">Assigned salesperson</p><UserSelect value={lead.assignedToUserId ?? undefined} onChange={(value) => update.mutate({ id: lead.id, input: { assignedToUserId: value } })} placeholder="Unassigned" /></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><div className="rounded-2xl border bg-background/55 p-4"><p className="text-xs text-muted-foreground">Contact</p><div className="mt-2 space-y-1 text-sm">{lead.phone && <p className="flex items-center gap-2"><Phone className="size-3.5" />{lead.phone}</p>}{lead.email && <p className="flex items-center gap-2"><Mail className="size-3.5" />{lead.email}</p>}</div></div><div className="rounded-2xl border bg-background/55 p-4"><p className="text-xs text-muted-foreground">Created</p><p className="mt-2 text-sm font-medium">{new Date(lead.createdAt).toLocaleDateString()}</p></div></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/70">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="size-4 text-primary" /> Follow-up command center</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Form {...followUpForm}><form onSubmit={followUpForm.handleSubmit(createFollowUp)} className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <FormField control={followUpForm.control} name="dueAt" render={({ field }) => <FormItem><FormLabel>Due date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={followUpForm.control} name="note" render={({ field }) => <FormItem><FormLabel>Next action</FormLabel><FormControl><Input placeholder="Call, WhatsApp, trial reminder..." {...field} /></FormControl><FormMessage /></FormItem>} />
            <div className="flex items-end"><Button type="submit" disabled={addFollowUp.isPending}>{addFollowUp.isPending ? "Scheduling..." : "Schedule"}</Button></div>
          </form></Form>

          <div className="space-y-3">
            {lead.followUps?.map((followUp) => <div key={followUp.id} className="flex flex-col gap-3 rounded-2xl border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge variant={followUp.completedAt ? "secondary" : "warning"}>{followUp.completedAt ? "Completed" : "Open"}</Badge><span className="text-sm font-medium">{new Date(followUp.dueAt).toLocaleDateString()}</span></div><p className={followUp.completedAt ? "mt-2 text-sm text-muted-foreground line-through" : "mt-2 text-sm"}>{followUp.note}</p></div>{!followUp.completedAt && <Button size="sm" variant="outline" onClick={() => finishFollowUp(followUp.id)} disabled={completeFollowUp.isPending}><Check className="size-3.5" /> Done</Button>}</div>)}
            {(!lead.followUps || lead.followUps.length === 0) && <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No follow-ups yet. Schedule the next sales action above.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
