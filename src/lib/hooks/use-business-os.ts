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
  /** Present now that the list carries the reply count. */
  _count?: { messages: number }
}

export interface SupportTicketMessage {
  id: string
  ticketId: string
  authorUserId: string | null
  body: string
  createdAt: string
  authorUser?: { id: string; firstName: string; lastName: string } | null
}

const TICKETS = "support-tickets"
const TICKET_MESSAGES = "support-ticket-messages"

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

/**
 * The thread on one ticket.
 *
 * This is the read half of a write that already existed. `addTicketMessage`
 * has been on the page for a while, but nothing ever read the messages
 * back, so a reply was accepted, the ticket list was re-fetched (which
 * does not carry messages), and the page looked exactly as it had before
 * the reply. The backend grew `GET /support/tickets/:id/messages` to match.
 *
 * `enabled` is false until a ticket is opened, so the list does not fan
 * out one request per row.
 */
export function useTicketMessages(ticketId: string | null, enabled = true) {
  return useQuery({
    queryKey: [TICKET_MESSAGES, ticketId],
    queryFn: () =>
      api.get<SupportTicketMessage[]>(`/support/tickets/${ticketId}/messages`),
    enabled: enabled && Boolean(ticketId),
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
    // Both keys, not just the ticket list. The list carries the reply
    // count, so its badge has to move, and the open thread has to append.
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [TICKETS] })
      void qc.invalidateQueries({ queryKey: [TICKET_MESSAGES, variables.id] })
    },
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
    // Field names are the API's (`PostJournalDto`), which rejects anything
    // else with a 400: `memo` labels any line without its own description,
    // `entryDate` (YYYY-MM-DD or ISO) defaults to today.
    mutationFn: (input: { lines: JournalLineInput[]; memo?: string; entryDate?: string }) =>
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

/**
 * The ledger behind the trial balance.
 *
 * The trial balance says what each account adds up to; it does not say
 * which transactions got it there. Until this existed, a book could be
 * posted to and totalled but never read back a line at a time, so it
 * could not be reconciled against anything. `accountingEntries` is
 * disabled until an account is actually being looked at, so the page
 * does not fetch 500 rows nobody scrolls to.
 */
export interface LedgerEntry {
  id: string
  entryDate: string
  description: string
  debit: number
  credit: number
  referenceType: string | null
  referenceId: string | null
  account: { id: string; code: string; name: string; type: string }
  branch: { id: string; name: string } | null
}

const LEDGER = "accounting-ledger"

export function useAccountingEntries(accountId: string | null, enabled = true) {
  return useQuery({
    queryKey: [LEDGER, accountId ?? "all"],
    queryFn: () =>
      api.get<LedgerEntry[]>("/accounting/entries", {
        query: accountId ? { accountId } : {},
      }),
    enabled: enabled && Boolean(accountId),
  })
}

export interface TaxSummaryRow {
  totalDebit: number
  totalCredit: number
  net: number
}

/** Totals across the accounting ledger for a period. Answers "what did we
 * book" without reading the trial balance account by account. */
export function useTaxSummary(range: { from?: string; to?: string } = {}, enabled = true) {
  return useQuery({
    queryKey: ["accounting-tax-summary", range],
    queryFn: () => api.get<TaxSummaryRow[]>("/accounting/tax-summary", { query: range }),
    enabled,
  })
}
