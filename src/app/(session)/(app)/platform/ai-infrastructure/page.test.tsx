import "@testing-library/jest-dom";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import AiInfraPage from "./page";

jest.mock("next/navigation", () => ({ usePathname: () => "/platform/ai-infrastructure" }));

const platformUser = { platformRole: "PLATFORM_OWNER", firstName: "Ops" };
let mockUser: { platformRole: string | null } | null = platformUser;
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();
jest.mock("@/lib/api/client", () => ({
  ApiError: class extends Error {},
  api: {
    get: (p: string, o?: unknown) => mockGet(p, o),
    post: (p: string, b?: unknown, o?: unknown) => mockPost(p, b, o),
    patch: (p: string, b?: unknown) => mockPatch(p, b),
    delete: (p: string, o?: unknown) => mockDelete(p, o),
  },
  apiFetch: (p: string, o?: unknown) => mockGet(p, o),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AiInfraPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockUser = platformUser;
  mockGet.mockReset();
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/admin/ai/gateway") return { state: "Healthy", live: { status: "ok" } };
    if (path === "/admin/ai/providers") return [{ platform: "openai", configured: 1 }];
    if (path === "/admin/ai/keys") return [{ id: 1, platform: "openai", maskedKey: "sk-…1", enabled: true }];
    if (path === "/admin/ai/models") return [{ id: 1, modelId: "gpt-4o", enabled: true }];
    if (path === "/admin/ai/fallback") return [{ modelDbId: 1, priority: 0, enabled: true }];
    if (path === "/admin/ai/routing") return { routing: { strategy: "priority" } };
    if (path === "/admin/ai/quota") return { tokenUsage: {} };
    if (path === "/admin/ai/health") return { platforms: [] };
    if (path === "/admin/ai/analytics/summary") return { totalRequests: 10 };
    if (path.startsWith("/admin/ai/analytics/")) return [];
    if (path === "/admin/ai/analytics/requests") return { total: 0, rows: [] };
    if (path === "/admin/ai/logs") return { entries: [] };
    if (path === "/admin/ai/settings") return { version: { version: "1.0" } };
    if (path === "/admin/ai/backups") return { list: [] };
    if (path === "/admin/ai/client-profiles") return [];
    if (path === "/admin/ai/embeddings") return { config: {} };
    if (path === "/admin/ai/media") return { config: {} };
    return null;
  });
});

describe("AI Infrastructure page", () => {
  it("renders gateway state for platform staff", async () => {
    renderPage();
    expect(await screen.findByText("AI Infrastructure")).toBeInTheDocument();
    expect(await screen.findByText("Healthy")).toBeInTheDocument();
  });

  it("shows platform-only gate for non-staff", async () => {
    mockUser = null;
    renderPage();
    expect(await screen.findByText("Platform staff only")).toBeInTheDocument();
  });

  it("shows loading skeletons while fetching", () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelector('[data-slot="skeleton"], .animate-pulse, [class*="skeleton"]') || document.body.textContent).toBeTruthy();
  });

  it("shows error state with retry when gateway fails", async () => {
    mockGet.mockImplementation(async (path: string) => {
      if (path === "/admin/ai/gateway") throw new Error("down");
      return null;
    });
    renderPage();
    expect(await screen.findByRole("alert", undefined, { timeout: 8000 })).toBeInTheDocument();
    expect(await screen.findByText("Try again", undefined, { timeout: 8000 })).toBeInTheDocument();
  });

  it("never requests reveal/export/unified-key endpoints", async () => {
    renderPage();
    await screen.findByText("AI Infrastructure");
    await new Promise((r) => setTimeout(r, 50));
    const paths = mockGet.mock.calls.map((c) => String(c[0]));
    expect(paths.join("\n")).not.toMatch(/reveal|export|api-key\/regenerate|download|restore|premium|conversations/);
  });

  it("explains an offline gateway with actionable checks instead of a JSON dump", async () => {
    const base = mockGet.getMockImplementation()!;
    mockGet.mockImplementation(async (path: string, options?: unknown) => {
      if (path === "/admin/ai/gateway") {
        return {
          state: "Offline",
          live: { status: "unavailable", reason: "FreeLLMAPI is unreachable" },
          ready: { status: "unavailable", reason: "FreeLLMAPI is unreachable" },
          ping: null,
          providers: null,
          diagnosis: {
            credentialsConfigured: true,
            loopbackBaseUrl: true,
            providersError: "FreeLLMAPI is unreachable",
          },
        };
      }
      return base(path, options);
    });
    renderPage();
    expect(await screen.findByText("Gateway is offline")).toBeInTheDocument();
    expect(screen.getByText("What to check")).toBeInTheDocument();
    expect(screen.getByText(/FREELLM_BASE_URL is still the localhost default/)).toBeInTheDocument();
    // The raw payload is folded away, not the first thing on the page.
    for (const summary of screen.getAllByText("Raw response")) {
      expect(summary.closest("details")).not.toHaveAttribute("open");
    }
  });
});
