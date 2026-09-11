"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { BranchSelect } from "@/components/shared/branch-select"
import { UserSelect } from "@/components/shared/user-select"
import { useLead, useConvertLead } from "@/lib/hooks/use-lead"
import { ApiError } from "@/lib/api/client"
import { useForm } from "react-hook-form"

interface ConvertValues {
  branchId: string
  assignedTrainerId?: string
}

export default function ConvertLeadPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const leadQuery = useLead(params.id)
  const convertMutation = useConvertLead()
  const lead = leadQuery.data

  const form = useForm<ConvertValues>({
    defaultValues: { branchId: "", assignedTrainerId: undefined },
  })

  React.useEffect(() => {
    if (lead) {
      form.reset({
        branchId: lead.branchId ?? "",
        assignedTrainerId: lead.assignedToUserId ?? undefined,
      })
    }
  }, [lead, form])

  async function onSubmit(values: ConvertValues) {
    try {
      const result = await convertMutation.mutateAsync({
        id: params.id,
        dto: {
          branchId: values.branchId || undefined,
          assignedTrainerId: values.assignedTrainerId || undefined,
        },
      })
      toast.success("Lead converted to member")
      router.push(`/members/${result.member.id}`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to convert lead")
    }
  }

  if (leadQuery.isLoading) return <div className="p-6 text-sm font-medium text-stone-600">Loading lead...</div>
  if (!lead) return <div className="p-6 text-sm font-medium text-stone-600">Lead not found.</div>

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section
          aria-labelledby="convert-title"
          className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-blue-300/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-cyan-300/30 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-violet-300/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Button variant="ghost" size="sm" className="mb-3 w-fit min-h-11 rounded-xl hover:bg-blue-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" onClick={() => router.back()}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to Sales
              </Button>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-blue-700">
                <CheckCircle2 className="size-3.5" aria-hidden="true" /> Conversion handoff
              </div>
              <h1 id="convert-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl">
                Convert Lead to Member
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600">
                {lead.firstName} {lead.lastName} is ready to enter the member lifecycle.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="min-h-11 rounded-2xl border-violet-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                <Link href={`/crm/leads/${lead.id}`}><Sparkles className="size-4" aria-hidden="true" /> Lead 360</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <Card className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/60 px-5 py-5 sm:px-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <CheckCircle2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Conversion handoff</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">Choose where this member lives and who coaches them.</p>
              </div>
            </div>
            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-[20px] border border-blue-100/70 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/50 p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold tracking-tight text-stone-950">{lead.firstName} {lead.lastName}</h3>
                  <p className="mt-0.5 truncate text-sm font-medium text-stone-600">{lead.email ?? "No email"} · {lead.phone ?? "No phone"}</p>
                  <p className="mt-1 text-xs font-medium text-stone-600">Source: {lead.source ?? "Unknown"}</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                  <FormField
                    control={form.control}
                    name="branchId"
                    rules={{ required: "Branch is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member branch</FormLabel>
                        <FormControl>
                          <BranchSelect value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTrainerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign trainer (optional)</FormLabel>
                        <FormControl>
                          <UserSelect value={field.value} onChange={field.onChange} placeholder="Keep unassigned" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="min-h-11 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">Cancel</Button>
                    <Button
                      type="submit"
                      disabled={convertMutation.isPending}
                      className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_50%,#4f46e5)] shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                      {convertMutation.isPending ? "Converting..." : "Convert to Member"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <aside aria-label="What happens next" className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#172554,#3730a3_45%,#a21caf)] p-6 text-white shadow-[0_28px_75px_-38px_rgba(79,70,229,.78)] lg:p-7">
            <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-cyan-400/25 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-fuchsia-400/25 blur-3xl" aria-hidden="true" />
            <div className="relative flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-[15px] bg-white/15 ring-1 ring-white/20 backdrop-blur">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight">What happens next</h2>
                <p className="mt-0.5 text-xs font-medium text-white/70">A clean handoff into the member lifecycle.</p>
              </div>
            </div>
            <ul className="relative mt-6 space-y-3 text-sm">
              <li className="rounded-[18px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="font-extrabold">Member profile is created</p>
                <p className="mt-1 text-xs leading-5 text-white/70">Contact, source and notes carry over automatically.</p>
              </li>
              <li className="rounded-[18px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="font-extrabold">Branch + trainer attached</p>
                <p className="mt-1 text-xs leading-5 text-white/70">Billing, attendance and coaching route correctly.</p>
              </li>
              <li className="rounded-[18px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="font-extrabold">Pipeline marked won</p>
                <p className="mt-1 text-xs leading-5 text-white/70">Sales analytics reflect the win instantly.</p>
              </li>
            </ul>
            <span className="relative mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-indigo-950">
              Ready when you are <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </aside>
        </div>
      </div>
    </div>
  )
}
