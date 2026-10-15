import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import AiActionsPage from "./page";

let mockPermissions: string[] = [];
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}));

const mockGet = jest.fn();
jest.mock("@/lib/api/client", () => ({
  api: {
    get: (path: string, options?: unknown) => mockGet(path, options),
    patch: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AiActionsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
});

describe("AiActionsPage", () => {
  it("shows the queue to a caller who can approve", async () => {
    mockPermissions = ["ai.approve"];
    renderPage();
    expect(await screen.findByRole("heading", { name: "Action queue" })).toBeInTheDocument();
    expect(await screen.findByText("No pending AI actions")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/ai-actions?status=PENDING_APPROVAL", undefined);
    // No ai.generate: the Ask AI shortcuts are hidden rather than dead-ending.
    expect(screen.queryByRole("link", { name: /Ask AI/ })).not.toBeInTheDocument();
  });

  it("shows the Ask AI shortcuts when the approver can also generate", async () => {
    mockPermissions = ["ai.approve", "ai.generate"];
    renderPage();
    // The hero shortcut and the empty-state shortcut both appear.
    expect(await screen.findByText("No pending AI actions")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Ask AI/ })).toHaveLength(2);
  });

  it("asks for nothing and denies gracefully without ai.approve", async () => {
    mockPermissions = ["ai.generate"];
    renderPage();
    expect(await screen.findByText("Approvals need access")).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
