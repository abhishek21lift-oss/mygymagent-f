import "@testing-library/jest-dom"
import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BotConfigCard } from "./bot-config-card"
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

function authWith(canManage: boolean) {
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
      features: { whatsappAdapter: true },
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
  return canManage
}

describe("BotConfigCard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp-adapter/bot/config") return Promise.resolve(null)
      if (url === "/whatsapp-adapter/automation/activity") return Promise.resolve([])
      throw new Error(`unexpected ${url}`)
    })
    mockApi.patch.mockResolvedValue({ id: "cfg-1" })
  })

  it("shows everything off when no config exists", async () => {
    authWith(true)
    render(<BotConfigCard canManage={true} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/Command prefix/)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/Command prefix/)).toHaveValue("#")
  })

  it("saves toggles through the adapter endpoint", async () => {
    authWith(true)
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp-adapter/bot/config")
        return Promise.resolve({
          id: "cfg-1",
          organizationId: "org1",
          prefix: "#",
          enablePing: false,
          enableUptime: false,
          welcomeMessage: null,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        })
      if (url === "/whatsapp-adapter/automation/activity") return Promise.resolve([])
      throw new Error(`unexpected ${url}`)
    })

    render(<BotConfigCard canManage={true} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/Command prefix/)).toBeInTheDocument()
    })
    // First toggle button is the Ping switch.
    fireEvent.click(screen.getAllByRole("button")[0])

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith("/whatsapp-adapter/bot/config", {
        enablePing: true,
      })
    })
  })

  it("lists recent automation without message bodies", async () => {
    authWith(true)
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/whatsapp-adapter/bot/config") return Promise.resolve(null)
      if (url === "/whatsapp-adapter/automation/activity")
        return Promise.resolve([
          {
            id: "log-1",
            templateKey: "auto_reply.bot_ping",
            recipient: "919812345678",
            status: "SENT",
            createdAt: "2024-01-01T00:00:00Z",
          },
        ])
      throw new Error(`unexpected ${url}`)
    })

    render(<BotConfigCard canManage={true} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("auto_reply.bot_ping")).toBeInTheDocument()
    })
    expect(mockApi.get).toHaveBeenCalledWith("/whatsapp-adapter/automation/activity")
  })

  it("shows permission denied when user lacks whatsapp.read", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: () => false,
    })

    render(<BotConfigCard canManage={false} />, { wrapper: createWrapper() })

    expect(screen.getByText(/whatsapp\.read permission/)).toBeInTheDocument()
  })

  it("hides editing without manage permission", async () => {
    authWith(false)
    render(<BotConfigCard canManage={false} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText(/Command prefix/)).toBeInTheDocument()
    })
    expect(screen.queryByText("Save changes")).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Command prefix/)).toBeDisabled()
    fireEvent.click(screen.getAllByRole("button")[0])
    expect(mockApi.patch).not.toHaveBeenCalled()
  })
})
