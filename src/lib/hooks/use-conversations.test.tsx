import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { buildConversations, conversationPolling, useConversations } from "@/lib/hooks/use-conversations"
import type { InboundWhatsAppMessage } from "@/lib/hooks/use-whatsapp"

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

const INBOUND = [
  { id: "i1", from: "09876543210", body: "Hi", pushName: "Ravi", matchedMemberId: null, createdAt: "2026-10-08T10:00:00Z" },
]
const OUTBOUND = [
  {
    id: "m1",
    recipient: "919876543210",
    templateKey: "ad_hoc",
    body: "Hello!",
    status: "SENT",
    createdAt: "2026-10-08T10:01:00Z",
  },
]

describe("useConversations", () => {
  beforeEach(() => {
    ;(api.get as jest.Mock).mockImplementation((path: string) =>
      path === "/whatsapp/inbound" ? Promise.resolve(INBOUND) : Promise.resolve(OUTBOUND),
    )
  })

  it("groups trunk-0 inbound with the same digits-only conversation", async () => {
    // 09876543210 (inbound) and 919876543210 (outbound) are one thread
    // per person, not two conversations. Key is the last-10 person id,
    // phone keeps the fullest form seen for display.
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useConversations(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.conversations).toHaveLength(1))
    const [thread] = result.current.conversations
    expect(thread.key).toBe("9876543210")
    expect(thread.phone).toBe("919876543210")
    expect(thread.unmatched).toBe(true)
    expect(thread.messages.map((m) => m.id)).toEqual(["i1", "m1"])
    expect(thread.name).toBe("Ravi")
  })

  it("reads the sender from `from`, the field the API sends, and survives a row without one", () => {
    // The inbox read `fromPhone`, which the API never sends: the first
    // real message crashed the whole page.
    const rows = [
      { id: "i1", organizationId: "o", from: "919876543210", body: "Hi", matchedMemberId: "m", createdAt: "2026-10-08T10:00:00Z" },
      { id: "i2", organizationId: "o", body: "?", matchedMemberId: null, createdAt: "2026-10-08T10:02:00Z" },
    ] as unknown as InboundWhatsAppMessage[]
    const threads = buildConversations(rows, [])
    expect(threads).toHaveLength(1)
    expect(threads[0].key).toBe("9876543210")
    expect(threads[0].unmatched).toBe(false)
  })

  it("pins the polling cadence (10s, never in background tabs)", () => {
    expect(conversationPolling).toEqual({ refetchInterval: 10_000, refetchIntervalInBackground: false })
  })
})
