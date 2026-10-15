import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import OperationsPage from "./page";

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
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Radix's Select positions itself with ResizeObserver; jsdom has none.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OperationsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/branches") {
      return {
        items: [
          { id: "b1", name: "Indiranagar" },
          { id: "b2", name: "Koramangala" },
        ],
        total: 2,
        page: 1,
        pageSize: 100,
      };
    }
    // Analytics payloads: the panels render their empty states.
    return undefined;
  });
});

describe("OperationsPage", () => {
  it("fetches branches when the caller holds branches.read, so the filter renders", async () => {
    mockPermissions = ["reports.view", "branches.read"];
    renderPage();
    expect(await screen.findByRole("combobox", { name: "Branch" })).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/branches", { query: { pageSize: 100 } });
  });

  it("never asks for branches without branches.read (HEAD_TRAINER, ACCOUNTANT)", async () => {
    mockPermissions = ["reports.view"];
    renderPage();
    expect(screen.getByRole("heading", { name: "Operations" })).toBeInTheDocument();
    // The page's own analytics still fetch; branches never does.
    await waitFor(() =>
      expect(
        mockGet.mock.calls.some(([path]) => path === "/analytics/operations-health"),
      ).toBe(true),
    );
    expect(mockGet.mock.calls.some(([path]) => path === "/branches")).toBe(false);
    expect(screen.queryByRole("combobox", { name: "Branch" })).not.toBeInTheDocument();
  });
});
