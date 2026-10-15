import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import CrmPage from "./page";

let mockPermissions: string[] = [];
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}));

jest.mock("@/lib/hooks/use-leads", () => ({
  useLeads: () => ({ data: { items: [], total: 0 }, isLoading: false, isError: false, refetch: jest.fn() }),
  useLead: () => ({ data: undefined }),
  useCreateLead: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateLeadStatus: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useConvertLead: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useAddFollowUp: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useCompleteFollowUp: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useLeadScore: () => ({ data: undefined, refetch: jest.fn() }),
  useSendLeadMessage: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useCrmSla: () => ({ data: undefined, isLoading: false, isError: false }),
  formatSlaMin: () => "—",
}));

jest.mock("./import-leads-dialog", () => ({ ImportLeadsDialog: () => null }));
jest.mock("@/components/shared/branch-select", () => ({ BranchSelect: () => null }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CrmPage />
    </QueryClientProvider>,
  );
}

describe("CrmPage Ask AI entry", () => {
  it("offers the AI shortcut when the caller can generate", () => {
    mockPermissions = ["leads.read", "ai.generate"];
    renderPage();
    expect(screen.getByRole("link", { name: /Ask AI/ })).toBeInTheDocument();
  });

  it("hides it without ai.generate so it cannot dead-end", () => {
    mockPermissions = ["leads.read"];
    renderPage();
    expect(screen.queryByRole("link", { name: /Ask AI/ })).not.toBeInTheDocument();
  });
});
