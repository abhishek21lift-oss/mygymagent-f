import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

/**
 * The six domains behind `/business-os`.
 *
 * Accounting, loyalty, marketing, referrals, support and feedback each
 * have their own permission pair and their own tables, and each was
 * reachable only through one create-only form on a single page: you could
 * open a support ticket but never answer one, create a campaign but never
 * run it, take a survey response but never read the score.
 *
 * These are the hooks for the whole surface, so the page can be a
 * composition of real sections rather than a form per domain.
 */

/* ---------------------------------------------------------------- referrals */

export interface Referral {
  id: string
  organizationId: string
  referrerMemberId: string
  referredMemberId: string | null
  status: "PENDING" | "CONVERTED" | string
  convertedAt: string | null
  createdAt: string
  referrerFirstName: string | null
  referrerLastName: string | null
}

const REFERRALS = "referrals"

export function useReferrals(enabled = true) {
  return useQuery({
    queryKey: [REFERRALS],
    queryFn: () => api.get<Referral[]>("/referrals"),
    enabled,
  })
}

export function useCreateReferral() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (referrerMemberId: string) =>
      api.post<Referral>(`/referrals/${referrerMemberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [REFERRALS] }),
  })
}

export function useConvertReferral() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      api.post<Referral>(`/referrals/${id}/convert`, { memberId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [REFERRALS] }),
  })
}

/* ------------------------------------------------------------------ support */

export interface SupportTicket {
  id: string
  organizationId: string
  subject: string
  description: string | null
  status: string
  priority: string
  resolvedAt: string | null
  createdAt: string
}

export interface SupportTicketMessage {
  id: string
  ticketId: string
  authorUserId: string
  body: string
  createdAt: string
}

const TICKETS = "support-tickets"

export function useSupportTickets(status?: string, enabled = true) {
  return useQuery({
    queryKey: [TICKETS, status ?? "all"],
    queryFn: () =>
      api.get<SupportTicket[]>("/support/tickets", {
        query: status ? { status } : {},
      }),
    enabled,
  })
}

export function useCreateSupportTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { subject: string; description: string; priority?: string }) =>
      api.post<SupportTicket>("/support/tickets", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TICKETS] }),
  })
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    // The endpoint takes `status` alone; it sets `resolvedAt` itself.
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<SupportTicket>(`/support/tickets/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TICKETS] }),
  })
}

export function useAddTicketMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.post<SupportTicketMessage>(`/support/tickets/${id}/messages`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TICKETS] }),
  })
}

/* ----------------------------------------------------------------- feedback */

export interface Survey {
  id: string
  name: string
  kind: string
  active: boolean
}

export interface FeedbackSummaryRow {
  surveyId: string
  responses: number
  avgScore: number
  promoters: number
  detractors: number
  /** Promoters minus detractors as a percentage — the standard NPS. */
  nps: number
}

const SURVEYS = "feedback-surveys"
const FEEDBACK_SUMMARY = "feedback-summary"

export function useSurveys(enabled = true) {
  return useQuery({
    queryKey: [SURVEYS],
    queryFn: () => api.get<Survey[]>("/feedback/surveys"),
    enabled,
  })
}

export function useFeedbackSummary(enabled = true) {
  return useQuery({
    queryKey: [FEEDBACK_SUMMARY],
    queryFn: () => api.get<FeedbackSummaryRow[]>("/feedback/summary"),
    enabled,
  })
}

export function useCreateSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; kind: string }) =>
      api.post<Survey>("/feedback/surveys", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SURVEYS] }),
  })
}

export function useRespondFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      surveyId: string
      memberId: string
      score: number
      comment?: string
    }) => api.post<{ id: string }>("/feedback/respond", input),
    // A response moves the score, so the summary is stale too.
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [FEEDBACK_SUMMARY] })
      void qc.invalidateQueries({ queryKey: [SURVEYS] })
    },
  })
}

/* --------------------------------------------------------------- accounting */

export interface AccountingAccount {
  id: string
  code: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | string
  active: boolean
}

export interface JournalLineInput {
  accountId: string
  debit?: number
  credit?: number
  branchId?: string
  description?: string
}

const ACCOUNTS = "accounting-accounts"
const TRIAL_BALANCE = "accounting-trial-balance"

export function useAccountingAccounts(enabled = true) {
  return useQuery({
    queryKey: [ACCOUNTS],
    queryFn: () => api.get<AccountingAccount[]>("/accounting/accounts"),
    enabled,
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { code: string; name: string; type: string }) =>
      api.post<AccountingAccount>("/accounting/accounts", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ACCOUNTS] }),
  })
}

/**
 * A balanced posting.
 *
 * `/accounting/entries` used to sit beside this for single-sided
 * postings; it validated its input and then threw unconditionally, so it
 * could only ever answer 400. It is gone -- double-entry bookkeeping has
 * no use for an unbalanced entry, and an endpoint that cannot succeed is
 * a contract lie rather than a feature.
 */
export function usePostJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { lines: JournalLineInput[]; memo?: string; occurredAt?: string }) =>
      api.post<unknown>("/accounting/journal", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [TRIAL_BALANCE] })
      void qc.invalidateQueries({ queryKey: [ACCOUNTS] })
    },
  })
}

export interface TrialBalanceRow {
  accountId: string
  code: string
  name: string
  type: string
  debit: string | number
  credit: string | number
  balance: string | number
}

export function useTrialBalance(enabled = true) {
  return useQuery({
    queryKey: [TRIAL_BALANCE],
    queryFn: () => api.get<TrialBalanceRow[]>("/accounting/trial-balance"),
    enabled,
  })
}

/* ----------------------------------------------------------- portal invites */

const PORTAL_INVITES = "portal-invites"

export function useCreatePortalInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) =>
      api.post<{ token?: string; id?: string }>(`/portal/invites/${memberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PORTAL_INVITES] }),
  })
}

export function useRevokePortalInvites() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) =>
      api.post<unknown>(`/portal/invites/${memberId}/revoke`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PORTAL_INVITES] }),
  })
}
