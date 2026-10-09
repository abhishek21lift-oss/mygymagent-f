import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"
import InboxPage from "./page"
import type { Conversation } from "@/lib/hooks/use-conversations"

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (k: string) => (k === "to" ? mockedTo : null) }),
  usePathname: () => "/inbox",
}))
let mockedTo: string | null = null

jest.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ hasPermission: () => true }) }))

jest.mock("@/lib/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  ApiError: class ApiError extends Error {},
}))

const CONVOS: Conversation[] = [
  {
    key: "9876543210",
    phone: "919876543210",
    unmatched: false,
    lastAt: "2026-10-08T10:01:00Z",
    messages: [{ id: "i1", fromMe: false, text: "Hi", createdAt: "2026-10-08T10:00:00Z" }],
  },
]

jest.mock("@/lib/hooks/use-conversations", () => ({
  ...jest.requireActual("@/lib/hooks/use-conversations"),
  useConversations: () => ({ conversations: CONVOS, isLoading: false }),
}))

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { Wrapper }
}

describe("InboxPage", () => {
  beforeEach(() => {
    mockedTo = null
  })

  it("shows the conversation list", () => {
    const { Wrapper } = wrapper()
    render(<InboxPage />, { wrapper: Wrapper })
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(screen.getByText("919876543210")).toBeInTheDocument()
  })

  it("unknown ?to= starts an empty thread with a ready composer", () => {
    mockedTo = "910000000000"
    const { Wrapper } = wrapper()
    render(<InboxPage />, { wrapper: Wrapper })
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeEnabled()
  })

  it("selects a conversation on click", () => {
    const { Wrapper } = wrapper()
    render(<InboxPage />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText("919876543210"))
    expect(screen.getByLabelText(/conversation with/i)).toBeInTheDocument()
  })
})
