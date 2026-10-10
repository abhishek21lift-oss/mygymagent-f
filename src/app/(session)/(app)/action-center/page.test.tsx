import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import ActionCenterPage from "./page";

const mockReplace = jest.fn();
let mockSearch = "";
jest.mock("next/navigation", () => ({
  usePathname: () => "/action-center",
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

let mockPermissions: string[] = [];
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u-riya", firstName: "Riya" },
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) =>
        mockPermissions.includes(k),
      ),
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockPost = jest.fn();
jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return {
    ...actual,
    api: {
      get: (path: string, options?: unknown) => mockGet(path, options),
      patch: (path: string, body?: unknown) => mockPatch(path, body),
      post: (path: string, body?: unknown) => mockPost(path, body),
    },
  };
});

const TASK = {
  id: "t-1",
  branchId: null,
  title: "Collect ₹1,500 due — Pooja Sharma",
  description: null,
  category: "PAYMENT_FOLLOW_UP",
  priority: "HIGH",
  status: "PENDING",
  source: "SYSTEM",
  dueAt: new Date().toISOString(),
  reason: "₹1,500 is outstanding on this membership.",
  sourceType: "MEMBERSHIP",
  sourceId: "m-1",
  checklist: null,
  escalatedAt: null,
  escalationReason: null,
  completedAt: null,
  completionNote: null,
  cancelledAt: null,
  cancelReason: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isOverdue: false,
  member: {
    id: "mem-1",
    firstName: "Pooja",
    lastName: "Sharma",
    phone: "+919800000001",
    memberCode: "M1",
  },
  lead: null,
  assignedToUser: null,
  createdByUser: null,
};

const SUMMARY = {
  date: "2026-10-10",
  timezone: "Asia/Kolkata",
  tasks: {
    total: 8,
    completed: 3,
    pending: 5,
    completionPct: 38,
    overdue: 2,
    highPriority: 4,
    unassigned: 1,
    escalated: 0,
  },
  due: {
    calls: 3,
    payments: 2,
    renewals: 4,
    newLeads: 1,
    followUps: 0,
    trials: 0,
    complaints: 0,
    inactive: 0,
    ptConfirmations: 0,
  },
  callsLogged: 6,
  pendingSuggestions: 1,
  promisesDue: 1,
  completedByStaff: [{ userId: "u-riya", name: "Riya Staff", completed: 3 }],
};

const PROPOSAL = {
  id: "p-1",
  callLogId: "c-1",
  memberId: "mem-1",
  leadId: null,
  kind: "PAYMENT_PROMISE",
  title: "Payment promised: ₹2,000",
  details: null,
  explicit: true,
  evidence: "Salary will arrive on 12 October; I will pay ₹2,000.",
  suggestedDueAt: null,
  dueAtNeedsConfirmation: true,
  suggestedPriority: "HIGH",
  amount: "2000.00",
  status: "PENDING",
  taskId: null,
  createdAt: new Date().toISOString(),
  subjectName: "Pooja Sharma",
  summary: "Will pay after salary.",
  callLog: {
    id: "c-1",
    calledAt: new Date().toISOString(),
    outcome: "PAYMENT_PROMISED",
    response: "Salary will arrive on 12 October; I will pay ₹2,000.",
    member: { id: "mem-1", firstName: "Pooja", lastName: "Sharma" },
    lead: null,
    recordedByUser: { id: "u-riya", firstName: "Riya", lastName: "Staff" },
  },
};

function routes(path: string) {
  switch (path) {
    case "/action-center/summary":
      return SUMMARY;
    case "/action-center/briefing":
      return {
        date: "2026-10-10",
        headline: "5 of 8 tasks still open today, plus 2 overdue.",
        lines: [
          {
            text: "2 tasks overdue from earlier days",
            href: "/action-center?view=overdue",
            tone: "warn",
          },
        ],
      };
    case "/tasks":
      return { items: [TASK], page: 1, pageSize: 100, total: 1, totalPages: 1 };
    case "/action-center/staff":
      return [{ id: "u-riya", name: "Riya Staff" }];
    case "/action-center/proposals":
      return [PROPOSAL];
    default:
      throw new Error(`unexpected GET ${path}`);
  }
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ActionCenterPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGet.mockReset().mockImplementation(async (path: string) => routes(path));
  mockPatch.mockReset();
  mockPost.mockReset();
  mockReplace.mockReset();
  mockSearch = "";
  mockPermissions = ["tasks.read", "tasks.work"];
});

describe("Action Center", () => {
  it("shows today's counts from the API, the briefing and the worklist", async () => {
    renderPage();
    const glance = await screen.findByRole("region", {
      name: "Today at a glance",
    });
    await waitFor(() =>
      expect(within(glance).getByText("3/8")).toBeInTheDocument(),
    );
    expect(within(glance).getByText("38% done")).toBeInTheDocument();
    expect(
      within(glance).getByRole("button", { name: /Overdue 2/ }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("5 of 8 tasks still open today, plus 2 overdue."),
    ).toBeInTheDocument();
    expect(await screen.findByText(TASK.title)).toBeInTheDocument();
    expect(
      screen.getByText("Completed today: Riya Staff 3"),
    ).toBeInTheDocument();
  });

  it("completes a task from the list", async () => {
    mockPatch.mockResolvedValue({
      ...TASK,
      status: "COMPLETED",
      events: [],
      callLogs: [],
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("checkbox", { name: `Complete ${TASK.title}` }),
    );
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/tasks/t-1", {
        status: "COMPLETED",
      }),
    );
  });

  it("switches views through the URL and filters by KPI", async () => {
    renderPage();
    const glance = await screen.findByRole("region", {
      name: "Today at a glance",
    });
    fireEvent.click(within(glance).getByRole("button", { name: /Overdue/ }));
    expect(mockReplace).toHaveBeenCalledWith("/action-center?view=overdue", {
      scroll: false,
    });
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "/tasks",
        expect.objectContaining({
          query: expect.objectContaining({ view: "overdue" }),
        }),
      ),
    );
  });

  it("will not approve an AI suggestion with an unclear date until staff pick one", async () => {
    mockSearch = "view=suggestions";
    renderPage();
    expect(await screen.findByText("Member said this")).toBeInTheDocument();
    expect(
      screen.getByText(
        /“Salary will arrive on 12 October; I will pay ₹2,000.”/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve as task" }));
    expect(mockPost).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Due"), {
      target: { value: "2026-10-12T10:00" },
    });
    mockPost.mockResolvedValue({
      ...TASK,
      id: "t-2",
      events: [],
      callLogs: [],
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve as task" }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "/action-center/proposals/p-1/approve",
        expect.objectContaining({
          dueAt: new Date("2026-10-12T10:00").toISOString(),
          priority: "HIGH",
          amount: 2000,
        }),
      ),
    );
  });

  it("hides the work buttons from read-only staff", async () => {
    mockPermissions = ["tasks.read"];
    renderPage();
    expect(await screen.findByText(TASK.title)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Log a call" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: `Complete ${TASK.title}` }),
    ).toBeDisabled();
  });

  it("explains itself to roles without task access, without calling the API", () => {
    mockPermissions = ["members.read"];
    renderPage();
    expect(
      screen.getByText("The Action Center is not part of your role"),
    ).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
