"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

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
import { PageHeader } from "@/components/shared/page-header"
import { BranchSelect } from "@/components/shared/branch-select"
import { UserSelect } from "@/components/shared/user-select"
import { useLead, useConvertLead } from "@/lib/hooks/use-lead"
import { ApiError } from "@/lib/api/client"
import { useForm } from "react-hook-form"

export default function ConvertLeadPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const leadQuery = useLead(params.id)
  const convertMutation = useConvertLead()

  const lead = leadQuery.data

  const form = useForm<{ primaryBranchId: string; assignedTrainerId?: string }>({
    defaultValues: {
      primaryBranchId: lead?.branchId ?? "",
      assignedTrainerId: lead?.assignedToUserId ?? undefined,
    },
  })

  React.useEffect(() => {
    if (lead) {
      form.reset({
        primaryBranchId: lead.branchId ?? "",
        assignedTrainerId: lead.assignedToUserId ?? undefined,
      })
    }
  }, [lead, form])

  async function onSubmit(values: { primaryBranchId: string; assignedTrainerId?: string }) {
    try {
      const result = await convertMutation.mutateAsync({ id: params.id, dto: values })
      toast.success("Lead converted to member")
      router.push(`/members/${result.memberId}`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to convert lead")
    }
  }

  if (leadQuery.isLoading) {
    return <div>Loading...</div>
  }

  if (!lead) {
    return <div>Lead not found</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <PageHeader
        title="Convert Lead to Member"
        description={`${lead.firstName} ${lead.lastName} will become an active member.`}
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="mb-6 rounded-lg bg-muted/50 p-4">
            <h3 className="font-medium">Lead Information</h3>
            <p className="text-sm text-muted-foreground">
              {lead.firstName} {lead.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{lead.email ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{lead.phone ?? "—"}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="primaryBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
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
                    <FormLabel>Assign Trainer (optional)</FormLabel>
                    <FormControl>
                      <UserSelect value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
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
