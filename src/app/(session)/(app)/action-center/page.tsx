"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  ListPlus,
  PhoneCall,
  RefreshCw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { MemberPicker } from "@/components/shared/member-picker";
import { PageHero } from "@/components/shared/page-hero";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  useActionSummary,
  useBriefing,
  useGenerateTasks,
  useTasks,
  useUpdateTask,
  type ActionTask,
  type TaskCategory,
  type TaskPriority,
  type TaskView,
} from "@/lib/hooks/use-action-center";
import { AddTaskDialog } from "./add-task-dialog";
import { SettingsDialog } from "./settings-dialog";
import { LogCallDialog } from "./log-call-dialog";
import { QueuePanel, ReportPanel } from "./queue-panel";
import { SuggestionsPanel } from "./suggestions-panel";
import { TaskDetailDialog } from "./task-detail-dialog";
import {
  CategoryBadge,
  PriorityBadge,
  SourceBadge,
  StaffSelect,
  dueLabel,
  personName,
  subjectOf,
} from "./task-ui";

type Tab = "worklist" | TaskView | "suggestions" | "queue" | "report";

const TABS: { value: Tab; label: string }[] = [
  { value: "worklist", label: "Today" },
  { value: "my", label: "My tasks" },
  { value: "queue", label: "Call queue" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "unassigned", label: "Unassigned" },
  { value: "team", label: "Team" },
  { value: "escalated", label: "Escalated" },
  { value: "suggestions", label: "AI suggestions" },
  { value: "completed", label: "Completed" },
  { value: "report", label: "End of day" },
];

const TAB_VALUES = new Set(TABS.map((t) => t.value));

function Kpi({
  label,
  value,
  sub,
  tone = "default",
  onClick,
  active,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "danger" | "warn" | "good" | "ai";
  onClick?: () => void;
  active?: boolean;
}) {
  const toneClass = {
    default: "",
    danger: "text-rose-700 dark:text-rose-300",
    warn: "text-amber-700 dark:text-amber-300",
    good: "text-emerald-700 dark:text-emerald-300",
    ai: "text-violet-700 dark:text-violet-300",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-[54px] flex-col items-start justify-between rounded-lg border border-border bg-card px-2.5 py-1.5 text-left sm:min-h-[64px] sm:px-3 sm:py-2 shadow-[var(--shadow-card)] transition hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active && "border-foreground/40 ring-1 ring-foreground/20",
      )}
    >
      <span className="text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-lg font-semibold tabular-nums leading-tight sm:text-xl",
          toneClass,
        )}
      >
        {value}
      </span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </button>
  );
}

function TaskRow({
  task,
  canWork,
  userId,
  isManager,
  onOpen,
  onLogCall,
}: {
  task: ActionTask;
  canWork: boolean;
  userId?: string;
  isManager: boolean;
  onOpen: () => void;
  onLogCall: () => void;
}) {
  const update = useUpdateTask();
  const subject = subjectOf(task);
  const isOpen = ["PENDING", "IN_PROGRESS", "BLOCKED"].includes(task.status);
  const mine = !task.assignedToUser || task.assignedToUser.id === userId;
  const actionable = canWork && (isManager || mine);

  async function complete() {
    try {
      await update.mutateAsync({ id: task.id, status: "COMPLETED" });
      toast.success("Done", { description: task.title });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not complete the task.",
      );
    }
  }

  return (
    <li className="group flex items-start gap-3 border-b border-border px-3 py-2.5 last:border-b-0 sm:px-4">
      <div className="pt-0.5">
        {isOpen ? (
          <Checkbox
            aria-label={`Complete ${task.title}`}
            disabled={!actionable || update.isPending}
            onCheckedChange={(v) => v === true && complete()}
          />
        ) : (
          <CheckCircle2
            className={cn(
              "size-4",
              task.status === "COMPLETED"
                ? "text-emerald-600"
                : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "block text-left text-sm font-semibold hover:underline",
            !isOpen && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <PriorityBadge priority={task.priority} />
          <CategoryBadge category={task.category} />
          <SourceBadge source={task.source} />
          {task.escalatedAt && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="size-3" aria-hidden="true" />
              Escalated
            </span>
          )}
          <span
            className={cn(
              task.isOverdue &&
                isOpen &&
                "font-semibold text-rose-700 dark:text-rose-300",
            )}
          >
            {task.status === "COMPLETED"
              ? "Completed"
              : dueLabel(task.dueAt, task.isOverdue && isOpen)}
          </span>
          {subject && (
            <Link
              href={subject.href}
              className="font-medium text-foreground/80 hover:underline"
            >
              {subject.name}
            </Link>
          )}
          <span>
            ·{" "}
            {task.assignedToUser
              ? personName(task.assignedToUser)
              : "Unassigned"}
          </span>
        </div>
      </div>
      {isOpen && subject && actionable && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={onLogCall}
          aria-label={`Log a call for ${task.title}`}
        >
          <PhoneCall className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Log call</span>
        </Button>
      )}
    </li>
  );
}

function ActionCenter() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canRead = hasPermission("tasks.read");
  const canWork = hasPermission("tasks.work");
  const isManager = hasPermission("tasks.manage");

  const initialTab = (params.get("view") as Tab) ?? "worklist";
  const [tab, setTabState] = React.useState<Tab>(
    TAB_VALUES.has(initialTab) ? initialTab : "worklist",
  );
  const [category, setCategory] = React.useState<TaskCategory | "ALL">(
    (params.get("category") as TaskCategory) ?? "ALL",
  );
  const [priority, setPriority] = React.useState<TaskPriority | "ALL">("ALL");
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [member, setMember] = React.useState<{
    id: string;
    label: string;
  } | null>(null);
  const [date, setDate] = React.useState("");
  const [search, setSearch] = React.useState("");
  // Phones: filters fold away so the list starts near the top.
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(
    params.get("task"),
  );
  const [callFor, setCallFor] = React.useState<ActionTask | null>(null);
  const [callOpen, setCallOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [followUpOpen, setFollowUpOpen] = React.useState(false);

  function setTab(next: Tab) {
    setTabState(next);
    const q = new URLSearchParams(params.toString());
    if (next === "worklist") q.delete("view");
    else q.set("view", next);
    router.replace(`${pathname}${q.toString() ? `?${q}` : ""}`, {
      scroll: false,
    });
  }

  function openTask(id: string | null) {
    setOpenTaskId(id);
    const q = new URLSearchParams(params.toString());
    if (id) q.set("task", id);
    else q.delete("task");
    router.replace(`${pathname}${q.toString() ? `?${q}` : ""}`, {
      scroll: false,
    });
  }

  function logCall(task: ActionTask | null) {
    setCallFor(task);
    setCallOpen(true);
  }

  const listTab = !["suggestions", "queue", "report"].includes(tab);
  const summary = useActionSummary(
    { date: date || undefined, assignedToUserId: assignee ?? undefined },
    { enabled: canRead },
  );
  const briefing = useBriefing({ enabled: canRead });
  const generate = useGenerateTasks();
  const tasks = useTasks(
    {
      view: tab === "worklist" ? undefined : (tab as TaskView),
      date: date || undefined,
      category: category === "ALL" ? undefined : category,
      priority: priority === "ALL" ? undefined : priority,
      assignedToUserId: assignee ?? undefined,
      memberId: member?.id,
      search: search.trim() || undefined,
      pageSize: 100,
    },
    { enabled: canRead && listTab },
  );

  if (!canRead) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="The Action Center is not part of your role"
        description="Ask a manager for task access (tasks.read) to see the front desk's daily list."
      />
    );
  }

  const s = summary.data;
  const n = (v: number | undefined) => (summary.isLoading ? "…" : (v ?? 0));
  const filterBy = (next: Tab, cat: TaskCategory | "ALL" = "ALL") => {
    setCategory(cat);
    setTab(next);
  };

  async function runGenerator() {
    try {
      const result = await generate.mutateAsync();
      toast.success(
        result.created
          ? `${result.created} new task${result.created === 1 ? "" : "s"} added`
          : "The list is up to date",
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not refresh the list.",
      );
    }
  }

  return (
    <div className="pb-4">
      <div className="flex flex-col gap-4">
        <PageHero
          id="action-center-title"
          icon={ClipboardList}
          title="Action Center"
          description={
            s
              ? `${s.date} · ${s.tasks.pending} open today${s.tasks.overdue ? `, ${s.tasks.overdue} overdue` : ""}`
              : "Today's calls, follow-ups and tasks"
          }
          compact
          actions={
            <div className="flex flex-wrap gap-2">
              {canWork && (
                <>
                  <Button onClick={() => logCall(null)}>
                    <PhoneCall className="size-4" aria-hidden="true" /> Log a
                    call
                  </Button>
                  <Button variant="outline" onClick={() => setAddOpen(true)}>
                    <ListPlus className="size-4" aria-hidden="true" /> Add TODO
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFollowUpOpen(true)}
                  >
                    <CalendarPlus className="size-4" aria-hidden="true" />{" "}
                    Schedule follow-up
                  </Button>
                </>
              )}
              {isManager && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setSettingsOpen(true)}
                    aria-label="Action Center rules"
                  >
                    <Settings2 className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={runGenerator}
                    disabled={generate.isPending}
                    aria-label="Refresh generated tasks"
                  >
                    <RefreshCw
                      className={cn(
                        "size-4",
                        generate.isPending && "animate-spin",
                      )}
                      aria-hidden="true"
                    />
                  </Button>
                </>
              )}
            </div>
          }
        />

        {briefing.data && briefing.data.lines.length > 0 && (
          <section
            aria-label="Today's briefing"
            className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-[var(--shadow-card)]"
          >
            <p className="text-sm font-semibold">{briefing.data.headline}</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {briefing.data.lines.map((line, i) => (
                <li key={i}>
                  <Link
                    href={line.href}
                    onClick={(e) => {
                      // Same page: switch tab or open the task in place.
                      const url = new URL(line.href, "http://x");
                      if (url.pathname !== pathname) return;
                      e.preventDefault();
                      const task = url.searchParams.get("task");
                      const view = url.searchParams.get("view") as Tab | null;
                      const cat = url.searchParams.get(
                        "category",
                      ) as TaskCategory | null;
                      if (task) openTask(task);
                      else if (cat) filterBy("worklist", cat);
                      else if (view && TAB_VALUES.has(view)) setTab(view);
                    }}
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium hover:underline",
                      line.tone === "urgent"
                        ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                        : line.tone === "warn"
                          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                          : "border-border bg-muted/40 text-foreground/80",
                    )}
                  >
                    {line.text}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section
          aria-label="Today at a glance"
          className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2 xl:grid-cols-10"
        >
          <Kpi
            label="Today's tasks"
            value={s ? `${s.tasks.completed}/${s.tasks.total}` : n(undefined)}
            sub={
              s?.tasks.completionPct != null
                ? `${s.tasks.completionPct}% done`
                : "nothing due"
            }
            tone="good"
            onClick={() => filterBy("worklist")}
            active={tab === "worklist" && category === "ALL"}
          />
          <Kpi
            label="Pending"
            value={n(s?.tasks.pending)}
            onClick={() => filterBy("worklist")}
          />
          <Kpi
            label="Overdue"
            value={n(s?.tasks.overdue)}
            tone={s?.tasks.overdue ? "danger" : "default"}
            onClick={() => filterBy("overdue")}
            active={tab === "overdue"}
          />
          <Kpi
            label="High priority"
            value={n(s?.tasks.highPriority)}
            tone={s?.tasks.highPriority ? "warn" : "default"}
            onClick={() => {
              setPriority("HIGH");
              setTab("worklist");
            }}
          />
          <Kpi
            label="Calls due"
            value={n(s?.due.calls)}
            onClick={() => filterBy("queue")}
            active={tab === "queue"}
          />
          <Kpi
            label="Payments due"
            value={n(s && s.due.payments)}
            tone={s?.due.payments ? "warn" : "default"}
            sub={s?.promisesDue ? `${s.promisesDue} promised` : undefined}
            onClick={() => filterBy("worklist", "PAYMENT_FOLLOW_UP")}
            active={category === "PAYMENT_FOLLOW_UP"}
          />
          <Kpi
            label="Renewals"
            value={n(s?.due.renewals)}
            onClick={() => filterBy("worklist", "RENEWAL")}
            active={category === "RENEWAL"}
          />
          <Kpi
            label="New leads"
            value={n(s?.due.newLeads)}
            onClick={() => filterBy("worklist", "LEAD_FOLLOW_UP")}
            active={category === "LEAD_FOLLOW_UP"}
          />
          <Kpi
            label="Follow-ups"
            value={n(s?.due.followUps)}
            onClick={() => filterBy("worklist", "FOLLOW_UP")}
            active={category === "FOLLOW_UP"}
          />
          <Kpi
            label="AI suggestions"
            value={n(s?.pendingSuggestions)}
            tone={s?.pendingSuggestions ? "ai" : "default"}
            sub={
              s
                ? `${s.callsLogged} call${s.callsLogged === 1 ? "" : "s"} logged`
                : undefined
            }
            onClick={() => setTab("suggestions")}
            active={tab === "suggestions"}
          />
        </section>

        {s && s.completedByStaff.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Completed today:{" "}
            {s.completedByStaff
              .map((p) => `${p.name} ${p.completed}`)
              .join(" · ")}
          </p>
        )}

        <section
          aria-labelledby="ac-list"
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <h2 id="ac-list" className="sr-only">
            Tasks
          </h2>
          <div className="flex flex-col gap-2 border-b border-border px-3 py-2 sm:px-4">
            <div
              role="tablist"
              aria-label="Task views"
              className="-mx-1 flex gap-1 overflow-x-auto pb-1"
            >
              {TABS.map((t) => (
                <button
                  key={t.value}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "min-h-9 shrink-0 rounded-md px-2.5 text-sm font-medium transition",
                    tab === t.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {t.label}
                  {t.value === "suggestions" && s?.pendingSuggestions ? (
                    <Sparkles
                      className="ml-1 inline size-3"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              ))}
            </div>
            {tab !== "suggestions" && (
              <>
                <div className="flex items-center justify-between md:hidden">
                  <button
                    type="button"
                    aria-expanded={filtersOpen}
                    aria-controls="ac-filters"
                    onClick={() => setFiltersOpen((v) => !v)}
                    className="min-h-9 rounded-md border border-border px-3 text-sm font-medium"
                  >
                    Filters
                    {[
                      date,
                      category !== "ALL",
                      priority !== "ALL",
                      assignee,
                      member,
                      search,
                    ].filter(Boolean).length
                      ? ` (${[date, category !== "ALL", priority !== "ALL", assignee, member, search].filter(Boolean).length})`
                      : ""}
                  </button>
                </div>
                <div
                  id="ac-filters"
                  className={cn(
                    "grid-cols-2 gap-2 md:grid md:grid-cols-6",
                    filtersOpen ? "grid" : "hidden",
                  )}
                >
                  <Input
                    type="date"
                    aria-label="Day"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory(v as TaskCategory | "ALL")
                    }
                  >
                    <SelectTrigger aria-label="Category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All categories</SelectItem>
                      {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map(
                        (c) => (
                          <SelectItem key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    value={priority}
                    onValueChange={(v) =>
                      setPriority(v as TaskPriority | "ALL")
                    }
                  >
                    <SelectTrigger aria-label="Priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Any priority</SelectItem>
                      {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map(
                        (p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORITY_LABELS[p]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <StaffSelect
                    value={assignee}
                    onChange={setAssignee}
                    placeholder="All staff"
                  />
                  <MemberPicker value={member} onChange={setMember} />
                  <Input
                    type="search"
                    aria-label="Search tasks"
                    placeholder="Search tasks"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className={listTab ? "" : "p-3 sm:p-4"}>
            {tab === "suggestions" && <SuggestionsPanel canAct={canWork} />}
            {tab === "queue" && (
              <QueuePanel
                assignedToUserId={assignee ?? undefined}
                onLogCall={logCall}
                onOpen={openTask}
                canWork={canWork}
              />
            )}
            {tab === "report" && (
              <ReportPanel date={date || undefined} onOpen={openTask} />
            )}
            {listTab && (
              <>
                {tasks.isLoading && (
                  <div className="grid gap-2 p-3" aria-label="Loading tasks">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-md bg-muted/50"
                      />
                    ))}
                  </div>
                )}
                {tasks.isError && (
                  <div role="alert" className="p-6 text-center text-sm">
                    Could not load tasks.{" "}
                    <Button variant="link" onClick={() => tasks.refetch()}>
                      Retry
                    </Button>
                  </div>
                )}
                {tasks.data && tasks.data.items.length === 0 && (
                  <EmptyState
                    icon={CheckCircle2}
                    title={
                      tab === "worklist"
                        ? "All clear for today"
                        : "Nothing here"
                    }
                    description={
                      tab === "worklist"
                        ? "No open tasks are due. New ones arrive as memberships near expiry, payments fall due and leads come in."
                        : "No tasks match this view and these filters."
                    }
                    className="py-10"
                  />
                )}
                {tasks.data && tasks.data.items.length > 0 && (
                  <>
                    <ul>
                      {tasks.data.items.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          canWork={canWork}
                          userId={user?.id}
                          isManager={isManager}
                          onOpen={() => openTask(t.id)}
                          onLogCall={() => logCall(t)}
                        />
                      ))}
                    </ul>
                    {tasks.data.total > tasks.data.items.length && (
                      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                        Showing {tasks.data.items.length} of {tasks.data.total}.
                        Narrow the filters to see the rest.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <TaskDetailDialog
        taskId={openTaskId}
        onOpenChange={(o) => !o && openTask(null)}
        onLogCall={(t) => {
          openTask(null);
          logCall(t);
        }}
      />
      <LogCallDialog
        open={callOpen}
        onOpenChange={setCallOpen}
        task={callFor}
      />
      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} />
      {isManager && (
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
      <AddTaskDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        presetCategory="FOLLOW_UP"
        title="Schedule a follow-up"
      />
    </div>
  );
}

export default function ActionCenterPage() {
  return (
    <React.Suspense
      fallback={<div className="h-40 animate-pulse rounded-xl bg-muted/50" />}
    >
      <ActionCenter />
    </React.Suspense>
  );
}
