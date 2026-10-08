import "@testing-library/jest-dom"
import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { ChatThread } from "@/components/inbox/chat-thread"
import { MessageComposer } from "@/components/inbox/message-composer"
import type { Conversation } from "@/lib/hooks/use-conversations"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { Wrapper }
}

const threadWithNullBodyOutbound: Conversation = {
  key: "9876543210",
  phone: "919876543210",
  unmatched: false,
  lastAt: "2026-10-08T10:01:00Z",
  messages: [
    { id: "i1", fromMe: false, text: "Hi", createdAt: "2026-10-08T10:00:00Z" },
    { id: "m1", fromMe: true, text: null, templateKey: "ad_hoc", status: "SENT", createdAt: "2026-10-08T10:01:00Z" },
  ],
}

describe("ChatThread", () => {
  it("renders a templateKey chip for old outbound rows, never a blank crash", () => {
    const { Wrapper } = wrapper()
    render(<ChatThread conversation={threadWithNullBodyOutbound} canSend={false} />, { wrapper: Wrapper })
    expect(screen.getByText("Hi")).toBeInTheDocument()
    expect(screen.getByText("ad_hoc")).toBeInTheDocument()
  })
})

describe("MessageComposer", () => {
  it("blocks whitespace submits: no mutation, no bubble", () => {
    const { Wrapper } = wrapper()
    render(<MessageComposer to="919876543210" disabled={false} />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "   " } })
    fireEvent.click(screen.getByRole("button", { name: /send/i }))
    expect(api.post).not.toHaveBeenCalled()
  })

  it("shows FAILED with retry when the send fails", async () => {
    ;(api.post as jest.Mock).mockRejectedValueOnce(new Error("503"))
    const { Wrapper } = wrapper()
    render(<MessageComposer to="919876543210" disabled={false} />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Hello" } })
    fireEvent.click(screen.getByRole("button", { name: /send/i }))
    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument())
  })
})
