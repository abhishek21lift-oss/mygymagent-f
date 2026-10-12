import "@testing-library/jest-dom"
import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
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
      if (url === "/whatsapp/contacts") return Promise.resolve([])
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
      if (url === "/whatsapp-adapter/contacts") return Promise.resolve([])
      if (url === "/whatsapp-adapter/groups")
        return Promise.resolve({ available: true, groups: [] })
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

  it("renders adapter groups without participant phone numbers", async () => {
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
      if (url === "/whatsapp-adapter/contacts") return Promise.resolve([])
      if (url === "/whatsapp-adapter/groups")
        return Promise.resolve({
          available: true,
          groups: [
            { jid: "111@g.us", subject: "Morning Batch", participantCount: 12 },
            { jid: "222@g.us", subject: "222@g.us", participantCount: 0 },
          ],
        })
      throw new Error(`unexpected ${url}`)
    })

    render(<WhatsAppOverviewPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Morning Batch")).toBeInTheDocument()
    })
    expect(screen.getByText("12 members")).toBeInTheDocument()
    expect(screen.getByText("222@g.us")).toBeInTheDocument()
    expect(mockApi.get).toHaveBeenCalledWith("/whatsapp-adapter/groups")
    expect(screen.queryByText(/9198\d{6}@s.whatsapp.net/)).not.toBeInTheDocument()
  })

  it("shows unavailable groups state when the session is not connected", async () => {
    authWith({ whatsappAdapter: true })
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp/integration") return Promise.resolve(null)
      if (url === "/whatsapp-adapter/status")
        return Promise.resolve({
          id: "sess1",
          organizationId: "org1",
          status: "DISCONNECTED",
          phoneNumber: null,
          displayPhoneNumber: null,
          qrDataUrl: null,
          pairingCode: null,
          connectedAt: null,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          lastError: null,
        })
      if (url === "/whatsapp-adapter/auto-replies") return Promise.resolve([])
      if (url === "/whatsapp-adapter/contacts") return Promise.resolve([])
      if (url === "/whatsapp-adapter/groups")
        return Promise.resolve({ available: false, groups: [] })
      throw new Error(`unexpected ${url}`)
    })

    render(<WhatsAppOverviewPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Connect WhatsApp to see your groups.")).toBeInTheDocument()
    })
  })

  it("hides the groups section in legacy mode", async () => {
    authWith({ whatsappAdapter: false })
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp/integration") return Promise.resolve(null)
      if (url === "/whatsapp/auto-replies") return Promise.resolve([])
      if (url === "/whatsapp/contacts") return Promise.resolve([])
      throw new Error(`unexpected ${url}`)
    })

    render(<WhatsAppOverviewPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Auto-reply rules")).toBeInTheDocument()
    })
    expect(screen.queryByText("Groups")).not.toBeInTheDocument()
    expect(mockApi.get).not.toHaveBeenCalledWith(
      expect.stringContaining("/whatsapp-adapter"),
    )
  })

  it("debounces adapter contacts search by 300ms", async () => {
    authWith({ whatsappAdapter: true })
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp/integration") return Promise.resolve(null)
      if (url === "/whatsapp-adapter/status")
        return Promise.resolve({
          id: "sess1",
          organizationId: "org1",
          status: "NOT_CONNECTED",
          phoneNumber: null,
          displayPhoneNumber: null,
          qrDataUrl: null,
          pairingCode: null,
          connectedAt: null,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
          lastError: null,
        })
      if (url === "/whatsapp-adapter/auto-replies") return Promise.resolve([])
      if (url === "/whatsapp-adapter/contacts") return Promise.resolve([])
      if (url === "/whatsapp-adapter/groups")
        return Promise.resolve({ available: true, groups: [] })
      throw new Error(`unexpected ${url}`)
    })

    render(<WhatsAppOverviewPage />, { wrapper: createWrapper() })
    const input = await screen.findByLabelText("Search contacts")
    const contactsCalls = () =>
      mockApi.get.mock.calls.filter((call) => call[0] === "/whatsapp-adapter/contacts")
    expect(contactsCalls()).toHaveLength(1)

    jest.useFakeTimers()
    try {
      fireEvent.change(input, { target: { value: "ravi" } })
      // Debounce pending: input shows the keystrokes, no new request yet.
      expect(input).toHaveValue("ravi")
      expect(contactsCalls()).toHaveLength(1)

      await act(async () => {
        jest.advanceTimersByTime(300)
      })
      expect(contactsCalls()).toHaveLength(2)
      expect(contactsCalls()[1][1]).toEqual(
        expect.objectContaining({ query: expect.objectContaining({ search: "ravi" }) }),
      )
    } finally {
      jest.useRealTimers()
    }
  })
})
