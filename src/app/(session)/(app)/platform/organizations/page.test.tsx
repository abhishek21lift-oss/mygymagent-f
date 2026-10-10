import { parseMonths } from "./page";

/**
 * The plan picker clamps months client-side to the server's 1-36 window.
 * Anything outside keeps the confirm shut; the server's 400 stays the
 * backstop, not the UX.
 */
describe("parseMonths", () => {
  it("accepts the bounds and the default", () => {
    expect(parseMonths("1")).toBe(1);
    expect(parseMonths("12")).toBe(12);
    expect(parseMonths("36")).toBe(36);
  });

  it("rejects zero, negatives and above the window", () => {
    expect(parseMonths("0")).toBeNull();
    expect(parseMonths("-3")).toBeNull();
    expect(parseMonths("37")).toBeNull();
  });

  it("rejects non-integers and blanks instead of coercing them", () => {
    expect(parseMonths("")).toBeNull();
    expect(parseMonths("  ")).toBeNull();
    expect(parseMonths("1.5")).toBeNull();
    expect(parseMonths("abc")).toBeNull();
  });
});

import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import OrganizationsPage from "./page";

const mockApiGet = jest.fn();
jest.mock(
  "@/lib/api/client",
  () => ({
    api: { get: (path: string, options?: unknown) => mockApiGet(path, options) },
    ApiError: class ApiError extends Error {},
  }),
  { virtual: false },
);

const mockUser: { current: unknown } = { current: null };
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: mockUser.current, isLoading: false }),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));

const ORG = {
  id: "org-1",
  name: "Iron Temple Gym",
  slug: "iron-temple",
  status: "ACTIVE",
  timezone: "Asia/Kolkata",
  currency: "INR",
  createdAt: "2026-01-01T00:00:00.000Z",
  _count: { branches: 2, users: 5, members: 100 },
};

const PLANS = [
  { key: "trial", name: "Free Trial" },
  { key: "starter", name: "Starter" },
];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <OrganizationsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockApiGet.mockReset();
  mockUser.current = null;
});

describe("OrganizationsPage", () => {
  it("tells a non-platform user the screen is platform-only instead of filling with 403s", async () => {
    mockUser.current = { id: "u-1" };
    renderPage();
    expect(
      await screen.findByText("Platform staff only"),
    ).toBeInTheDocument();
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("lists gyms with status and a plan picker for platform staff", async () => {
    mockUser.current = { id: "p-1", platformRole: "PLATFORM_OWNER" };
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/platform/organizations/plans") return Promise.resolve(PLANS);
      return Promise.resolve({ items: [ORG], total: 1, page: 1, pageSize: 20 });
    });
    renderPage();
    expect(await screen.findByText("Iron Temple Gym")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    // The plan picker exists per row once the catalog loads.
    expect(
      screen.getByRole("combobox", { name: "Change plan for Iron Temple Gym" }),
    ).toBeInTheDocument();
  });
});
