"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/types/pagination";

export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskCategory =
  | "CALL"
  | "PAYMENT_FOLLOW_UP"
  | "PAYMENT_PROMISE"
  | "RENEWAL"
  | "LEAD_FOLLOW_UP"
  | "TRIAL"
  | "INACTIVE_MEMBER"
  | "PT_CONFIRMATION"
  | "COMPLAINT"
  | "FOLLOW_UP"
  | "GENERAL";
export type TaskSource = "MANUAL" | "SYSTEM" | "AI_SUGGESTION";
export type TaskView =
  | "my"
  | "today"
  | "upcoming"
  | "overdue"
  | "completed"
  | "team"
  | "unassigned"
  | "escalated"
  | "ai";
export type CallOutcome =
  | "CONNECTED"
  | "NO_ANSWER"
  | "BUSY"
  | "CALL_BACK_REQUESTED"
  | "PAYMENT_PROMISED"
  | "PAYMENT_COMPLETED"
  | "NOT_INTERESTED"
  | "RENEWAL_INTERESTED"
  | "COMPLAINT_RAISED"
  | "WRONG_NUMBER"
  | "OTHER";

export interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface ActionTask {
  id: string;
  branchId: string | null;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  dueAt: string;
  reason: string | null;
  sourceType: string | null;
  sourceId: string | null;
  checklist: ChecklistItem[] | null;
  escalatedAt: string | null;
  escalationReason: string | null;
  completedAt: string | null;
  completionNote: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  member: (Person & { phone: string | null; memberCode: string | null }) | null;
  lead: (Person & { phone: string | null; status: string }) | null;
  assignedToUser: Person | null;
  createdByUser: Person | null;
}

export interface TaskEvent {
  id: string;
  type: string;
  body: string | null;
  data: Record<string, unknown> | null;
  actorUserId: string | null;
  actorName: string;
  createdAt: string;
}

export interface ActionTaskDetail extends ActionTask {
  events: TaskEvent[];
  callLogs: {
    id: string;
    calledAt: string;
    outcome: CallOutcome;
    response: string | null;
    recordedByUser: Person | null;
  }[];
}

export interface ActionSummary {
  date: string;
  timezone: string;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    completionPct: number | null;
    overdue: number;
    highPriority: number;
    unassigned: number;
    escalated: number;
  };
  due: {
    calls: number;
    payments: number;
    renewals: number;
    newLeads: number;
    followUps: number;
    trials: number;
    complaints: number;
    inactive: number;
    ptConfirmations: number;
  };
  callsLogged: number;
  pendingSuggestions: number;
  promisesDue: number;
  completedByStaff: { userId: string; name: string; completed: number }[];
}

export interface Briefing {
  date: string;
  headline: string;
  lines: { text: string; href: string; tone: "urgent" | "warn" | "info" }[];
}

export interface QueueEntry {
  task: ActionTask;
  lastCall: {
    calledAt: string;
    outcome: CallOutcome;
    response: string | null;
  } | null;
  unansweredCalls14d: number;
  outstanding: string | null;
  membership: { status: string; endDate: string; plan: string | null } | null;
  reasons: string[];
}

export interface Proposal {
  id: string;
  callLogId: string;
  memberId: string | null;
  leadId: string | null;
  kind:
    | "FOLLOW_UP_CALL"
    | "PAYMENT_PROMISE"
    | "RENEWAL_FOLLOW_UP"
    | "TRIAL_VISIT"
    | "MANAGER_ESCALATION"
    | "OTHER";
  title: string;
  details: string | null;
  explicit: boolean;
  evidence: string | null;
  suggestedDueAt: string | null;
  dueAtNeedsConfirmation: boolean;
  suggestedPriority: TaskPriority;
  amount: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  taskId: string | null;
  createdAt: string;
  subjectName: string | null;
  summary: string | null;
  callLog: {
    id: string;
    calledAt: string;
    outcome: CallOutcome;
    response: string | null;
    member: Person | null;
    lead: Person | null;
    recordedByUser: Person | null;
  };
}

export interface CallLog {
  id: string;
  phone: string | null;
  direction: "OUTBOUND" | "INBOUND";
  calledAt: string;
  outcome: CallOutcome;
  reason: string | null;
  response: string | null;
  internalNotes: string | null;
  amountDiscussed: string | null;
  promisedPaymentDate: string | null;
  nextFollowUpAt: string | null;
  analysisStatus: "NOT_REQUESTED" | "PENDING" | "COMPLETED" | "FAILED";
  analysisError: string | null;
  analysis: {
    summary?: string;
    intent?: string;
    sentiment?: string;
    renewalLikelihood?: string;
    objections?: string[];
    followUpQuestions?: string[];
  } | null;
  member: (Person & { memberCode: string | null }) | null;
  lead: (Person & { status: string }) | null;
  recordedByUser: Person | null;
  editedAt: string | null;
  proposals: Omit<
    Proposal,
    | "callLog"
    | "subjectName"
    | "summary"
    | "callLogId"
    | "memberId"
    | "leadId"
    | "createdAt"
  >[];
}

export interface DailyReport {
  date: string;
  completed: {
    count: number;
    items: {
      id: string;
      title: string;
      category: TaskCategory;
      completedAt: string;
      completionNote: string | null;
    }[];
  };
  calls: { total: number; byOutcome: Partial<Record<CallOutcome, number>> };
  followUpsScheduled: number;
  payments: {
    promisesKept: number;
    verifiedPayments: number;
    verifiedAmount: string | null;
  };
  leads: { called: number; converted: number };
  unresolved: {
    count: number;
    items: {
      id: string;
      title: string;
      priority: TaskPriority;
      dueAt: string;
      category: TaskCategory;
    }[];
  };
}

export interface TaskFilters {
  view?: TaskView;
  date?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedToUserId?: string;
  memberId?: string;
  leadId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

const KEY = "action-center";

export const OUTCOME_LABELS: Record<CallOutcome, string> = {
  CONNECTED: "Connected",
  NO_ANSWER: "No answer",
  BUSY: "Busy",
  CALL_BACK_REQUESTED: "Call back requested",
  PAYMENT_PROMISED: "Payment promised",
  PAYMENT_COMPLETED: "Payment completed (verified)",
  NOT_INTERESTED: "Not interested",
  RENEWAL_INTERESTED: "Interested in renewing",
  COMPLAINT_RAISED: "Complaint raised",
  WRONG_NUMBER: "Wrong number",
  OTHER: "Other",
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  CALL: "Call",
  PAYMENT_FOLLOW_UP: "Payment due",
  PAYMENT_PROMISE: "Payment promise",
  RENEWAL: "Renewal",
  LEAD_FOLLOW_UP: "Lead",
  TRIAL: "Trial",
  INACTIVE_MEMBER: "Inactive member",
  PT_CONFIRMATION: "PT confirmation",
  COMPLAINT: "Complaint",
  FOLLOW_UP: "Follow-up",
  GENERAL: "General",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function useTasks(
  filters: TaskFilters,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [KEY, "tasks", filters],
    queryFn: () =>
      api.get<Paginated<ActionTask>>("/tasks", {
        query: { page: 1, pageSize: 50, ...filters } as Record<
          string,
          string | number | undefined
        >,
      }),
    enabled,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: [KEY, "task", id],
    queryFn: () => api.get<ActionTaskDetail>(`/tasks/${id}`),
    enabled: Boolean(id),
  });
}

export function useActionSummary(
  params: { date?: string; assignedToUserId?: string },
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: [KEY, "summary", params],
    queryFn: () =>
      api.get<ActionSummary>("/action-center/summary", { query: params }),
    enabled,
    // Other staff, the scheduler and the AI change these numbers.
    refetchInterval: 60_000,
  });
}

export function useBriefing({ enabled = true } = {}) {
  return useQuery({
    queryKey: [KEY, "briefing"],
    queryFn: () => api.get<Briefing>("/action-center/briefing"),
    enabled,
  });
}

export function useFollowUpQueue(
  params: { date?: string; assignedToUserId?: string },
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: [KEY, "queue", params],
    queryFn: () =>
      api.get<QueueEntry[]>("/action-center/queue", { query: params }),
    enabled,
  });
}

export function useDailyReport(
  date: string | undefined,
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: [KEY, "report", date],
    queryFn: () =>
      api.get<DailyReport>("/action-center/report", { query: { date } }),
    enabled,
  });
}

export function useProposals(
  status: "PENDING" | "ALL" = "PENDING",
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: [KEY, "proposals", status],
    queryFn: () =>
      api.get<Proposal[]>("/action-center/proposals", { query: { status } }),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useCallLogs(
  params: {
    memberId?: string;
    leadId?: string;
    search?: string;
    page?: number;
  },
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: [KEY, "calls", params],
    queryFn: () =>
      api.get<Paginated<CallLog>>("/call-logs", {
        query: { page: 1, pageSize: 20, ...params },
      }),
    enabled,
    // A just-logged note is analysed in the background: look again shortly.
    refetchInterval: (query) =>
      query.state.data?.items.some((c) => c.analysisStatus === "PENDING")
        ? 5000
        : false,
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: [KEY] });
    void client.invalidateQueries({ queryKey: ["daily-briefing"] });
    void client.invalidateQueries({ queryKey: ["member-details"] });
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueAt: string;
  memberId?: string;
  leadId?: string;
  assignedToUserId?: string;
  checklist?: ChecklistItem[];
}

export function useCreateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      api.post<ActionTask>("/tasks", input),
    onSuccess: invalidate,
  });
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueAt?: string;
  assignedToUserId?: string | null;
  completionNote?: string;
  cancelReason?: string;
  checklist?: ChecklistItem[];
}

export function useUpdateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      api.patch<ActionTaskDetail>(`/tasks/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useTaskComment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.post<ActionTaskDetail>(`/tasks/${id}/comments`, { body }),
    onSuccess: invalidate,
  });
}

export function useEscalateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<ActionTaskDetail>(`/tasks/${id}/escalate`, { reason }),
    onSuccess: invalidate,
  });
}

export interface LogCallInput {
  memberId?: string;
  leadId?: string;
  phone?: string;
  direction?: "OUTBOUND" | "INBOUND";
  calledAt?: string;
  outcome: CallOutcome;
  reason?: string;
  response?: string;
  internalNotes?: string;
  amountDiscussed?: number;
  promisedPaymentDate?: string;
  nextFollowUpAt?: string;
  priority?: TaskPriority;
  assignedToUserId?: string;
  paymentId?: string;
  taskId?: string;
  completeTask?: boolean;
}

export function useLogCall() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: LogCallInput) => api.post<CallLog>("/call-logs", input),
    onSuccess: (call) => {
      invalidate();
      // The note is analysed in the background and its suggestions land a
      // few seconds later: look again then rather than wait for the poll.
      if (call.analysisStatus === "PENDING") {
        for (const delay of [5_000, 15_000]) setTimeout(invalidate, delay);
      }
    },
  });
}

export function useRetryAnalysis() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<CallLog>(`/call-logs/${id}/analyze`, {}),
    onSuccess: invalidate,
  });
}

export interface ApproveInput {
  title?: string;
  description?: string;
  dueAt?: string;
  priority?: TaskPriority;
  assignedToUserId?: string;
  amount?: number;
}

export function useApproveProposal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: ApproveInput & { id: string }) =>
      api.post<ActionTaskDetail>(
        `/action-center/proposals/${id}/approve`,
        input,
      ),
    onSuccess: invalidate,
  });
}

export function useRejectProposal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/action-center/proposals/${id}/reject`, { reason }),
    onSuccess: invalidate,
  });
}

export function useGenerateTasks() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () =>
      api.post<{ created: number; resolved: number }>(
        "/action-center/generate",
        {},
      ),
    onSuccess: invalidate,
  });
}

/** Staff a task can be assigned to (names only; tasks.read). */
export function useAssignableStaff({ enabled = true } = {}) {
  return useQuery({
    queryKey: [KEY, "staff"],
    queryFn: () =>
      api.get<{ id: string; name: string }[]>("/action-center/staff"),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export interface ActionCenterSettings {
  renewalReminderDays: number[]
  expiredLookbackDays: number
  duesFollowUpIntervalDays: number
  inactiveDays: number
  promiseGraceDays: number
  newLeadContactHours: number
  reminderLeadMinutes: number
  overdueEscalationHours: number
  quietHoursStart: number | null
  quietHoursEnd: number | null
  maxNewTasksPerSource: number
  maxOpenInactiveTasks: number
}

/** The generator/reminder rules (tasks.read). The server fills every gap
 * with its default, so the dialog always edits complete values. */
export function useActionCenterSettings({ enabled = true } = {}) {
  return useQuery({
    queryKey: [KEY, "settings"],
    queryFn: () => api.get<ActionCenterSettings>("/action-center/settings"),
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** tasks.manage, audited server-side. PATCH merges over the stored rules. */
export function useUpdateActionCenterSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<ActionCenterSettings>) =>
      api.patch<ActionCenterSettings>("/action-center/settings", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, "settings"] })
    },
  })
}
