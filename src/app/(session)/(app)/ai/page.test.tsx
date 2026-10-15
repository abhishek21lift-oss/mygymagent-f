import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import AiPage from "./page";

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
      <AiPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue({ items: [] });
});

describe("AiPage", () => {
  it("renders the assistant for a caller who can ask the agent", async () => {
    mockPermissions = ["ai.generate"];
    renderPage();
    expect(await screen.findByRole("heading", { name: "Ask the agent" })).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/ai/conversations", { query: { pageSize: 20 } });
  });

  it("asks for nothing and denies gracefully without ai.generate", async () => {
    mockPermissions = ["members.read"];
    renderPage();
    expect(await screen.findByText("AI agent needs access")).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
