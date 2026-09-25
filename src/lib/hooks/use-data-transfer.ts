import { useMutation } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { MEMBERS_QUERY_KEY } from "@/lib/hooks/use-members"

/**
 * Bulk member import and export.
 *
 * `/data/*` was complete on the server and had no screen: the CSV export,
 * the blank template and both importers were reachable only with a token
 * and a terminal, which is how this deployment's 1342-row enquiry file
 * came to be imported by a script rather than by its owner.
 *
 * The enquiry importer answers a full report before it writes anything
 * when `dryRun` is set, so the dialog previews first and commits second --
 * the same shape as the bulk membership assignment, and for the same
 * reason: an import that silently creates 900 people is not something to
 * discover afterwards.
 */
export interface MemberImportResult {
  created: number
  skipped: number
  errors: { row: number; message: string }[]
}

export interface CustomerEnquiryImportReport {
  dryRun: boolean
  branchId: string
  sourceRows: number
  classified: { members: number; leads: number; ambiguous: number }
  members: { toCreate: number; alreadyPresent: number; created: number }
  leads: { toCreate: number; alreadyPresent: number; created: number }
  trainers: { matched: number; backfilled: number; unmatched: string[] }
  warnings: {
    unparseableJoinDate: string[]
    unparseableDateOfBirth: string[]
    missingPhone: string[]
    phoneDisagreement: string[]
    singleWordName: string[]
    activeWithoutMembership: number
  }
}

export function useExportMembers() {
  return useMutation({
    mutationFn: () => api.getText("/data/members/export"),
  })
}

export function useMemberTemplate() {
  return useMutation({
    mutationFn: () => api.getText("/data/members/template"),
  })
}

export function useImportMembers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: Record<string, string>[]) =>
      api.post<MemberImportResult>("/data/members/import", { rows }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MEMBERS_QUERY_KEY] }),
  })
}

export function useImportCustomerEnquiry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      rows: Record<string, string>[]
      branchId?: string
      dryRun?: boolean
    }) => api.post<CustomerEnquiryImportReport>("/data/imports/customer-enquiry", input),
    onSuccess: (report) => {
      // A dry run wrote nothing, so nothing cached is stale.
      if (!report.dryRun) qc.invalidateQueries({ queryKey: [MEMBERS_QUERY_KEY] })
    },
  })
}
