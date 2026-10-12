import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AutoRepliesCard } from "./auto-replies-card"
import { useAuth } from "@/lib/auth/auth-context"
import { api } from "@/lib/api/client"

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: jest.fn(),
}))

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const mockUseAuth = useAuth as jest.Mock
const mockApi = api as jest.Mocked<typeof api>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("AutoRepliesCard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: {
        id: "u1",
        organizationId: "org1",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        status: "ACTIVE",
        primaryBranchId: null,
        emailVerified: true,
        memberId: null,
        platformRole: null,
      },
      permissions: ["whatsapp.read", "whatsapp.manage"],
      mfaEnrolment: null,
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      completeMfaLogin: jest.fn(),
      requestOtp: jest.fn(),
      loginWithOtp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      logoutEverywhere: jest.fn(),
      hasPermission: (key: string) => key === "whatsapp.read" || key === "whatsapp.manage",
      refetchMe: jest.fn(),
    })
  })

  it("renders legacy endpoints when feature flag is disabled", async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      user: {
        id: "u1",
        organizationId: "org1",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        status: "ACTIVE",
        primaryBranchId: null,
        emailVerified: true,
        memberId: null,
        platformRole: null,
        features: { whatsappAdapter: false },
      },
    })

    mockApi.get.mockResolvedValueOnce([
      {
        id: "rule1",
        keyword: "test",
        matchType: "EXACT" as const,
        scope: "ALL" as const,
        answer: "Test answer",
        enabled: true,
        priority: 0,
        createdAt: "2024-01-01",
        createdByUserId: null,
      },
    ])

    render(<AutoRepliesCard canManage={true} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Auto-replies")).toBeInTheDocument()
    })

    expect(mockApi.get).toHaveBeenCalledWith("/whatsapp/auto-replies")
  })

  it("renders adapter endpoints when feature flag is enabled", async () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      user: {
        id: "u1",
        organizationId: "org1",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        status: "ACTIVE",
        primaryBranchId: null,
        emailVerified: true,
        memberId: null,
        platformRole: null,
        features: { whatsappAdapter: true },
      },
    })

    mockApi.get.mockResolvedValueOnce([
      {
        id: "rule1",
        keyword: "test",
        matchType: "EXACT" as const,
        scope: "ALL" as const,
        answer: "Test answer",
        enabled: true,
        priority: 0,
        createdAt: "2024-01-01",
        createdByUserId: null,
      },
    ])

    render(<AutoRepliesCard canManage={true} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Auto-replies")).toBeInTheDocument()
    })

    expect(mockApi.get).toHaveBeenCalledWith("/whatsapp-adapter/auto-replies")
  })

  it("shows permission denied when user lacks whatsapp.read", () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      hasPermission: () => false,
    })

    render(<AutoRepliesCard canManage={false} />, { wrapper: createWrapper() })

    expect(screen.getByText(/whatsapp\.read permission/)).toBeInTheDocument()
  })
})