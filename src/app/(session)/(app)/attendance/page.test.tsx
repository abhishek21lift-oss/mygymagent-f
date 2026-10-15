import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import AttendancePage from "./page";

let mockPermissions: string[] = [];
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}));

jest.mock("@/lib/hooks/use-attendance", () => ({
  useAttendance: () => ({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() }),
  useAttendanceLive: () => ({ data: undefined, isLoading: true, isError: false }),
  useCheckIn: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useCheckOut: () => ({ mutateAsync: jest.fn(), isPending: false }),
  normalizeGateResult: (result: unknown) => result,
}));

// The check-in form (and the pickers inside it) only renders with
// `attendance.create`, which none of these cases hold; stub them anyway so
// the page never reaches for an unmocked hook.
jest.mock("@/components/shared/branch-select", () => ({ BranchSelect: () => null }));
jest.mock("@/components/shared/member-picker", () => ({ MemberPicker: () => null }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AttendancePage />
    </QueryClientProvider>,
  );
}

describe("AttendancePage Ask AI entry", () => {
  it("offers the AI shortcut when the caller can generate", () => {
    mockPermissions = ["attendance.read", "ai.generate"];
    renderPage();
    expect(screen.getByRole("link", { name: /Ask AI/ })).toBeInTheDocument();
  });

  it("hides it without ai.generate so it cannot dead-end", () => {
    mockPermissions = ["attendance.read"];
    renderPage();
    expect(screen.queryByRole("link", { name: /Ask AI/ })).not.toBeInTheDocument();
  });
});
