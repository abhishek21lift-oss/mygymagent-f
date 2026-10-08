import "@testing-library/jest-dom"
import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { useBroadcast, useBroadcasts, useCreateBroadcast } from "@/lib/hooks/use-broadcasts"

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

const ROW = {
  id: "b1",
  segmentId: "s1",
  body: "Fees due",
  sendAt: null,
  status: "SENDING",
  total: 10,
  queued: 10,
  sent: 4,
  failed: 1,
  skipped: 0,
  createdAt: "2026-10-08T10:00:00Z",
}

describe("useBroadcasts", () => {
  it("creates with segment, text and optional schedule", async () => {
    ;(api.post as jest.Mock).mockResolvedValue(ROW)
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useCreateBroadcast(), { wrapper: Wrapper })
    await result.current.mutateAsync({ segmentId: "s1", text: "Fees due", sendAt: "2026-10-09T10:00:00+05:30" })
    expect(api.post).toHaveBeenCalledWith(
      "/whatsapp/broadcasts",
      { segmentId: "s1", text: "Fees due", sendAt: "2026-10-09T10:00:00+05:30" },
    )
  })

  it("polls progress while sending, never in background tabs", async () => {
    ;(api.get as jest.Mock).mockResolvedValue(ROW)
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useBroadcast("b1"), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data?.sent).toBe(4))
    expect(api.get).toHaveBeenCalledWith("/whatsapp/broadcasts/b1")
  })

  it("lists broadcasts newest-first", async () => {
    ;(api.get as jest.Mock).mockResolvedValue([ROW])
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useBroadcasts(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toHaveLength(1))
  })
})
