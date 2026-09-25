"use client";

import * as React from "react";
import { toast } from "sonner";
import { Gift, Headphones, Loader2, ReceiptIndianRupee, Star } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useAccountingAccounts,
  useAddTicketMessage,
  useConvertReferral,
  useCreateAccount,
  useCreateReferral,
  useCreateSupportTicket,
  useCreateSurvey,
  useFeedbackSummary,
  usePostJournal,
  useReferrals,
  useRespondFeedback,
  useSupportTickets,
  useSurveys,
  useTrialBalance,
  useUpdateTicketStatus,
  type JournalLineInput,
} from "@/lib/hooks/use-business-os";
import { displayCurrencyAmount } from "@/lib/utils";

function fail(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError ? error.message : fallback);
}

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

/**
 * The support queue.
 *
 * You could open a ticket here and never answer one: the PATCH that moves
 * a ticket's status and the POST that adds a message were both built and
 * neither was reachable, so every ticket this app created stayed OPEN
 * forever with no reply on it.
 */
export function SupportSection() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("support.read");
  const canManage = hasPermission("support.manage");
  const tickets = useSupportTickets(undefined, canRead);
  const create = useCreateSupportTicket();
  const setStatus = useUpdateTicketStatus();
  const addMessage = useAddTicketMessage();

  const [draft, setDraft] = React.useState({ subject: "", description: "", priority: "NORMAL" });
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");

  if (!canRead) return null;

  return (
    <Panel
      title="Support tickets"
      titleId="support-tickets"
      description="Raised by staff, answered here."
    >
      <DataState
        isLoading={tickets.isPending}
        isError={tickets.isError}
        onRetry={() => void tickets.refetch()}
        errorMessage="Could not load support tickets."
        isEmpty={(tickets.data ?? []).length === 0 && !canManage}
        emptyIcon={Headphones}
        emptyTitle="No tickets"
        emptyDescription="Nothing has been raised yet."
      >
        <div className="flex flex-col gap-2">
          {(tickets.data ?? []).map((ticket) => (
            <div key={ticket.id} className="rounded-lg border border-border px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.priority} · opened{" "}
                    {new Date(ticket.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant={ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "success" : "secondary"}>
                    {ticket.status}
                  </Badge>
                  {canManage && (
                    <>
                      <select
                        aria-label={`Status for ${ticket.subject}`}
                        value={ticket.status}
                        onChange={(e) =>
                          void setStatus
                            .mutateAsync({ id: ticket.id, status: e.target.value })
                            .then(() => toast.success("Ticket updated"))
                            .catch((error) => fail(error, "Could not update the ticket"))
                        }
                        className="h-9 rounded-md border border-input bg-card px-2 text-xs text-foreground"
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyTo(replyTo === ticket.id ? null : ticket.id)}
                      >
                        Reply
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {canManage && replyTo === ticket.id && (
                <div className="mt-2 flex flex-col gap-2">
                  <Textarea
                    aria-label="Reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    className="min-h-20"
                  />
                  <div>
                    <Button
                      size="sm"
                      disabled={!reply.trim() || addMessage.isPending}
                      onClick={() =>
                        void addMessage
                          .mutateAsync({ id: ticket.id, body: reply.trim() })
                          .then(() => {
                            setReply("");
                            setReplyTo(null);
                            toast.success("Reply added");
                          })
                          .catch((error) => fail(error, "Could not add the reply"))
                      }
                    >
                      {addMessage.isPending && (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      )}
                      Send reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {canManage && (
            <div className="mt-1 grid gap-2 border-t border-border pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
              <Input
                aria-label="Ticket subject"
                placeholder="Subject"
                value={draft.subject}
                onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
              />
              <Input
                aria-label="Ticket description"
                placeholder="What is wrong?"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
              <Button
                disabled={!draft.subject || !draft.description || create.isPending}
                onClick={() =>
                  void create
                    .mutateAsync(draft)
                    .then(() => {
                      setDraft({ subject: "", description: "", priority: "NORMAL" });
                      toast.success("Ticket created");
                    })
                    .catch((error) => fail(error, "Could not create the ticket"))
                }
              >
                Create ticket
              </Button>
            </div>
          )}
        </div>
      </DataState>
    </Panel>
  );
}

/**
 * Surveys, and what they came back saying.
 *
 * `/feedback/summary` computes NPS per survey and nothing read it, so
 * responses went in and no score ever came out. Recording a response was
 * also unreachable — `feedback.respond` is its own grant, separate from
 * `feedback.manage`, because answering on a member's behalf at the desk
 * is a different job from designing the survey.
 */
export function FeedbackSection() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("feedback.read");
  const canManage = hasPermission("feedback.manage");
  const canRespond = hasPermission("feedback.respond");

  const surveys = useSurveys(canRead);
  const summary = useFeedbackSummary(canRead);
  const createSurvey = useCreateSurvey();
  const respond = useRespondFeedback();

  const [draft, setDraft] = React.useState({ name: "Member satisfaction", kind: "CSAT" });
  const [response, setResponse] = React.useState({ surveyId: "", memberId: "", score: "9", comment: "" });

  const nameById = React.useMemo(
    () => new Map((surveys.data ?? []).map((s) => [s.id, s.name])),
    [surveys.data],
  );

  if (!canRead) return null;

  return (
    <Panel title="Feedback" titleId="feedback" description="Surveys and their scores.">
      <DataState
        isLoading={surveys.isPending}
        isError={surveys.isError}
        onRetry={() => void surveys.refetch()}
        errorMessage="Could not load surveys."
        isEmpty={(surveys.data ?? []).length === 0 && !canManage}
        emptyIcon={Star}
        emptyTitle="No surveys"
        emptyDescription="Create one to start collecting scores."
      >
        <div className="flex flex-col gap-3">
          {(summary.data ?? []).length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead className="text-right">Responses</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                    <TableHead className="text-right">NPS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary.data ?? []).map((row) => (
                    <TableRow key={row.surveyId}>
                      <TableCell className="font-medium">
                        {nameById.get(row.surveyId) ?? row.surveyId}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.responses}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.avgScore}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {row.nps}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(surveys.data ?? []).map((survey) => (
              <Badge key={survey.id} variant={survey.active ? "secondary" : "outline"}>
                {survey.name} · {survey.kind}
              </Badge>
            ))}
          </div>

          {canRespond && (surveys.data ?? []).length > 0 && (
            <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,0.6fr)_auto]">
              <select
                aria-label="Survey"
                value={response.surveyId}
                onChange={(e) => setResponse((r) => ({ ...r, surveyId: e.target.value }))}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
              >
                <option value="">Select a survey</option>
                {(surveys.data ?? [])
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <Input
                aria-label="Member id"
                placeholder="Member id"
                value={response.memberId}
                onChange={(e) => setResponse((r) => ({ ...r, memberId: e.target.value }))}
              />
              <Input
                aria-label="Score"
                inputMode="numeric"
                placeholder="Score"
                value={response.score}
                onChange={(e) => setResponse((r) => ({ ...r, score: e.target.value }))}
              />
              <Button
                disabled={!response.surveyId || !response.memberId || respond.isPending}
                onClick={() =>
                  void respond
                    .mutateAsync({
                      surveyId: response.surveyId,
                      memberId: response.memberId,
                      score: Number(response.score),
                      ...(response.comment ? { comment: response.comment } : {}),
                    })
                    .then(() => {
                      setResponse((r) => ({ ...r, memberId: "", comment: "" }));
                      toast.success("Response recorded");
                    })
                    .catch((error) => fail(error, "Could not record the response"))
                }
              >
                Record
              </Button>
            </div>
          )}

          {canManage && (
            <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <Input
                aria-label="Survey name"
                placeholder="Survey name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
              <Input
                aria-label="Survey kind"
                placeholder="CSAT or NPS"
                value={draft.kind}
                onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))}
              />
              <Button
                disabled={!draft.name || createSurvey.isPending}
                onClick={() =>
                  void createSurvey
                    .mutateAsync(draft)
                    .then(() => toast.success("Survey created"))
                    .catch((error) => fail(error, "Could not create the survey"))
                }
              >
                Create survey
              </Button>
            </div>
          )}
        </div>
      </DataState>
    </Panel>
  );
}

/**
 * Who introduced whom.
 *
 * The list endpoint and the conversion were both unreachable, so a
 * referral could be created and then never seen again — and converting
 * one, which is the entire point, had no button anywhere.
 */
export function ReferralsSection() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("referrals.read");
  const canManage = hasPermission("referrals.manage");
  const referrals = useReferrals(canRead);
  const create = useCreateReferral();
  const convert = useConvertReferral();

  const [referrer, setReferrer] = React.useState("");
  const [converting, setConverting] = React.useState<{ id: string; memberId: string } | null>(null);

  if (!canRead) return null;

  return (
    <Panel
      title="Referrals"
      titleId="referrals"
      description="Members who brought someone in, and whether that person joined."
    >
      <DataState
        isLoading={referrals.isPending}
        isError={referrals.isError}
        onRetry={() => void referrals.refetch()}
        errorMessage="Could not load referrals."
        isEmpty={(referrals.data ?? []).length === 0 && !canManage}
        emptyIcon={Gift}
        emptyTitle="No referrals"
        emptyDescription="Record one against the member who made the introduction."
      >
        <div className="flex flex-col gap-2">
          {(referrals.data ?? []).map((referral) => (
            <div
              key={referral.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {referral.referrerFirstName
                    ? `${referral.referrerFirstName} ${referral.referrerLastName ?? ""}`.trim()
                    : referral.referrerMemberId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(referral.createdAt).toLocaleDateString("en-IN")}
                  {referral.convertedAt
                    ? ` · converted ${new Date(referral.convertedAt).toLocaleDateString("en-IN")}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={referral.status === "CONVERTED" ? "success" : "secondary"}>
                  {referral.status}
                </Badge>
                {canManage && referral.status === "PENDING" && (
                  <>
                    <Input
                      aria-label="Referred member id"
                      placeholder="Referred member id"
                      className="h-9 w-56"
                      value={converting?.id === referral.id ? converting.memberId : ""}
                      onChange={(e) =>
                        setConverting({ id: referral.id, memberId: e.target.value })
                      }
                    />
                    <Button
                      size="sm"
                      disabled={
                        converting?.id !== referral.id ||
                        !converting.memberId ||
                        convert.isPending
                      }
                      onClick={() =>
                        void convert
                          .mutateAsync({ id: referral.id, memberId: converting!.memberId })
                          .then(() => {
                            setConverting(null);
                            toast.success("Referral converted");
                          })
                          .catch((error) => fail(error, "Could not convert the referral"))
                      }
                    >
                      Convert
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {canManage && (
            <div className="mt-1 grid gap-2 border-t border-border pt-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                aria-label="Referring member id"
                placeholder="Referring member id"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
              />
              <Button
                disabled={!referrer || create.isPending}
                onClick={() =>
                  void create
                    .mutateAsync(referrer)
                    .then(() => {
                      setReferrer("");
                      toast.success("Referral recorded");
                    })
                    .catch((error) => fail(error, "Could not record the referral"))
                }
              >
                Record referral
              </Button>
            </div>
          )}
        </div>
      </DataState>
    </Panel>
  );
}

/**
 * The ledger.
 *
 * A balanced posting and the trial balance it moves. `/accounting/entries`
 * used to sit beside the journal for single-sided postings; it validated
 * its input and then threw unconditionally, so it could only ever answer
 * 400. It has been removed rather than given a button: double-entry
 * bookkeeping has no use for an unbalanced entry.
 */
export function AccountingSection() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("accounting.read");
  const canManage = hasPermission("accounting.manage");
  const accounts = useAccountingAccounts(canRead);
  const trial = useTrialBalance(canRead);
  const createAccount = useCreateAccount();
  const journal = usePostJournal();

  const [account, setAccount] = React.useState({ code: "4000", name: "Membership Revenue", type: "REVENUE" });
  const [memo, setMemo] = React.useState("");
  const [lines, setLines] = React.useState<JournalLineInput[]>([
    { accountId: "", debit: 0 },
    { accountId: "", credit: 0 },
  ]);

  const totals = React.useMemo(
    () => ({
      debit: lines.reduce((n, l) => n + Number(l.debit ?? 0), 0),
      credit: lines.reduce((n, l) => n + Number(l.credit ?? 0), 0),
    }),
    [lines],
  );
  const balanced = totals.debit > 0 && totals.debit === totals.credit;

  if (!canRead) return null;

  return (
    <Panel title="Accounting" titleId="accounting" description="Accounts, postings and the trial balance.">
      <DataState
        isLoading={accounts.isPending}
        isError={accounts.isError}
        onRetry={() => void accounts.refetch()}
        errorMessage="Could not load the chart of accounts."
        isEmpty={(accounts.data ?? []).length === 0 && !canManage}
        emptyIcon={ReceiptIndianRupee}
        emptyTitle="No accounts"
        emptyDescription="Create the chart of accounts before posting."
      >
        <div className="flex flex-col gap-3">
          {(trial.data ?? []).length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(trial.data ?? []).map((row) => (
                    <TableRow key={row.accountId}>
                      <TableCell className="font-medium">
                        {row.code} · {row.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {displayCurrencyAmount(row.debit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {displayCurrencyAmount(row.credit)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {displayCurrencyAmount(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {canManage && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Post a journal entry — debits must equal credits.
              </p>
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <select
                    aria-label={`Account for line ${index + 1}`}
                    value={line.accountId}
                    onChange={(e) =>
                      setLines((ls) =>
                        ls.map((l, i) => (i === index ? { ...l, accountId: e.target.value } : l)),
                      )
                    }
                    className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
                  >
                    <option value="">Select an account</option>
                    {(accounts.data ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} · {a.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label={`Debit for line ${index + 1}`}
                    inputMode="decimal"
                    placeholder="Debit"
                    value={line.debit ?? ""}
                    onChange={(e) =>
                      setLines((ls) =>
                        ls.map((l, i) =>
                          i === index ? { ...l, debit: Number(e.target.value) || 0 } : l,
                        ),
                      )
                    }
                  />
                  <Input
                    aria-label={`Credit for line ${index + 1}`}
                    inputMode="decimal"
                    placeholder="Credit"
                    value={line.credit ?? ""}
                    onChange={(e) =>
                      setLines((ls) =>
                        ls.map((l, i) =>
                          i === index ? { ...l, credit: Number(e.target.value) || 0 } : l,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Memo"
                  placeholder="Memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLines((ls) => [...ls, { accountId: "", debit: 0 }])}
                >
                  Add line
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {displayCurrencyAmount(totals.debit)} / {displayCurrencyAmount(totals.credit)}
                </span>
                <Button
                  disabled={!balanced || lines.some((l) => !l.accountId) || journal.isPending}
                  onClick={() =>
                    void journal
                      .mutateAsync({ lines, ...(memo ? { memo } : {}) })
                      .then(() => {
                        setLines([
                          { accountId: "", debit: 0 },
                          { accountId: "", credit: 0 },
                        ]);
                        setMemo("");
                        toast.success("Journal posted");
                      })
                      .catch((error) => fail(error, "Could not post the journal"))
                  }
                >
                  {journal.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Post journal
                </Button>
              </div>

              <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[minmax(0,0.6fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto]">
                <Input
                  aria-label="Account code"
                  placeholder="Code"
                  value={account.code}
                  onChange={(e) => setAccount((a) => ({ ...a, code: e.target.value }))}
                />
                <Input
                  aria-label="Account name"
                  placeholder="Account name"
                  value={account.name}
                  onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))}
                />
                <select
                  aria-label="Account type"
                  value={account.type}
                  onChange={(e) => setAccount((a) => ({ ...a, type: e.target.value }))}
                  className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
                >
                  {["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  disabled={!account.code || !account.name || createAccount.isPending}
                  onClick={() =>
                    void createAccount
                      .mutateAsync(account)
                      .then(() => toast.success("Account created"))
                      .catch((error) => fail(error, "Could not create the account"))
                  }
                >
                  Add account
                </Button>
              </div>
            </div>
          )}
        </div>
      </DataState>
    </Panel>
  );
}
