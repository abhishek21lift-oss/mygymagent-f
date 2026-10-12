import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import WhatsAppOverviewPage from "./page"
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
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return TestWrapper
}

function authWith(features?: { whatsappAdapter: boolean }) {
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
      ...(features ? { features } : {}),
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
}

describe("WhatsAppOverviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders legacy stats without touching adapter endpoints when flag is off", async () => {
    authWith({ whatsappAdapter: false })
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp/integration") return Promise.resolve(null)
      if (url === "/whatsapp/auto-replies") return Promise.resolve([])
      throw new Error(`unexpected ${url}`)
    })

    render(<WhatsAppOverviewPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Auto-reply rules")).toBeInTheDocument()
    })
    expect(mockApi.get).toHaveBeenCalledWith("/whatsapp/auto-replies")
    expect(mockApi.get).not.toHaveBeenCalledWith(
      expect.stringContaining("/whatsapp-adapter"),
    )
  })

  it("renders adapter stats when flag is on", async () => {
    authWith({ whatsappAdapter: true })
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp/integration") return Promise.resolve(null)
      if (url === "/whatsapp-adapter/status")
        return Promise.resolve({
          id: "sess1",
          organizationId: "org1",
          status: "CONNECTED",
          phoneNumber: "919812345678",
          displayPhoneNumber: "+91 98123 45678",
          qrDataUrl: null,
          pairingCode: null,
          connectedAt: null,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          lastError: null,
        })
      if (url === "/whatsapp-adapter/auto-replies") return Promise.resolve([])
      throw new Error(`unexpected ${url}`)
    })

    render(<WhatsAppOverviewPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Direct session")).toBeInTheDocument()
    })
    expect(mockApi.get).toHaveBeenCalledWith("/whatsapp-adapter/status")
  })

  it("shows permission denied when user lacks whatsapp.read", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: () => false,
    })

    render(<WhatsAppOverviewPage />, { wrapper: createWrapper() })

    expect(screen.getByText(/whatsapp\.read permission/)).toBeInTheDocument()
  })
})
