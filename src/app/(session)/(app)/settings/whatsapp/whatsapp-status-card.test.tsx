import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { WhatsAppAdapterStatusCard } from "./whatsapp-status-card"

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: jest.fn(),
}))

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn() } }
})

const mockUseAuth = useAuth as jest.Mock
const mockApi = api as jest.Mocked<typeof api>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return TestWrapper
}

describe("WhatsAppAdapterStatusCard", () => {
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
      permissions: ["whatsapp.read"],
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
      hasPermission: (key: string) => key === "whatsapp.read",
      refetchMe: jest.fn(),
    })
  })

  it("shows permission denied when user lacks whatsapp.read", () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      hasPermission: () => false,
    })

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    expect(screen.getByText(/whatsapp\.read permission/)).toBeInTheDocument()
  })

  it("shows loading skeleton while fetching status", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}))

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    expect(screen.getByText("WhatsApp Status")).toBeInTheDocument()
  })

  it("shows error state when fetch fails", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("Network error"))

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Couldn't load WhatsApp status/)).toBeInTheDocument()
    })
  })

  it("shows NOT_CONNECTED when no session exists", async () => {
    mockApi.get.mockResolvedValueOnce({
      id: "sess1",
      organizationId: "org1",
      status: "NOT_CONNECTED" as const,
      phoneNumber: null,
      displayPhoneNumber: null,
      qrDataUrl: null,
      pairingCode: null,
      connectedAt: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      lastError: null,
    })

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Not Connected")).toBeInTheDocument()
    })
  })

  it("shows CONNECTED status with phone number", async () => {
    mockApi.get.mockResolvedValueOnce({
      id: "sess1",
      organizationId: "org1",
      status: "CONNECTED" as const,
      phoneNumber: "919812345678",
      displayPhoneNumber: "+91 98123 45678",
      qrDataUrl: null,
      pairingCode: null,
      connectedAt: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      lastError: null,
    })

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeInTheDocument()
      expect(screen.getByText("+91 98123 45678")).toBeInTheDocument()
    })
  })

  it("shows QR code when status is PAIRING and qrDataUrl exists", async () => {
    mockApi.get.mockResolvedValueOnce({
      id: "sess1",
      organizationId: "org1",
      status: "PAIRING" as const,
      phoneNumber: null,
      displayPhoneNumber: null,
      qrDataUrl: "data:image/png;base64,abc123",
      pairingCode: null,
      connectedAt: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      lastError: null,
    })

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Pairing")).toBeInTheDocument()
      expect(screen.getByAltText("QR code to link WhatsApp")).toBeInTheDocument()
    })
  })

  it("shows pairing code when status is PAIRING and pairingCode exists", async () => {
    mockApi.get.mockResolvedValueOnce({
      id: "sess1",
      organizationId: "org1",
      status: "PAIRING" as const,
      phoneNumber: null,
      displayPhoneNumber: null,
      qrDataUrl: null,
      pairingCode: "123456",
      connectedAt: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      lastError: null,
    })

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Pairing")).toBeInTheDocument()
      expect(screen.getByText("1234-56")).toBeInTheDocument()
    })
  })

  it("shows lastError when present", async () => {
    mockApi.get.mockResolvedValueOnce({
      id: "sess1",
      organizationId: "org1",
      status: "DISCONNECTED" as const,
      phoneNumber: null,
      displayPhoneNumber: null,
      qrDataUrl: null,
      pairingCode: null,
      connectedAt: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      lastError: "Connection timeout",
    })

    render(<WhatsAppAdapterStatusCard canManage={false} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Connection timeout")).toBeInTheDocument()
    })
  })
})
