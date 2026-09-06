"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PageHeader } from "@/components/shared/page-header"
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

  if (leadQuery.isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading lead...</div>
  if (!lead) return <div className="p-6 text-sm text-muted-foreground">Lead not found.</div>

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Back to Sales
      </Button>

      <PageHeader
        title="Convert Lead to Member"
        description={`${lead.firstName} ${lead.lastName} is ready to enter the member lifecycle.`}
      />

      <Card className="max-w-3xl overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="bg-gradient-to-r from-emerald-500/[0.10] via-card to-violet-500/[0.08]">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-5 text-emerald-600" /> Conversion handoff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="rounded-2xl border bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{lead.firstName} {lead.lastName}</h3>
                <p className="text-sm text-muted-foreground">{lead.email ?? "No email"} · {lead.phone ?? "No phone"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Source: {lead.source ?? "Unknown"}</p>
              </div>
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
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={convertMutation.isPending}>
                  {convertMutation.isPending ? "Converting..." : "Convert to Member"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
