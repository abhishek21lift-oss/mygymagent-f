import "@testing-library/jest-dom"
import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import {
  useAutoReplies,
  useCreateAutoReply,
  useDeleteAutoReply,
  useUpdateAutoReply,
} from "@/lib/hooks/use-auto-replies"

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

const RULE = {
  id: "r1",
  keyword: "offer",
  matchType: "EXACT",
  scope: "ALL",
  answer: "Diwali 20% off",
  enabled: true,
  priority: 0,
  createdAt: "2026-10-08T10:00:00Z",
}

describe("useAutoReplies", () => {
  beforeEach(() => {
    ;(api.get as jest.Mock).mockResolvedValue([RULE])
    ;(api.post as jest.Mock).mockResolvedValue(RULE)
    ;(api.patch as jest.Mock).mockResolvedValue(RULE)
    ;(api.delete as jest.Mock).mockResolvedValue({ deleted: true })
  })

  it("creates a rule with the validated shape", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useCreateAutoReply(), { wrapper: Wrapper })
    await result.current.mutateAsync({
      keyword: "offer",
      matchType: "EXACT",
      scope: "ALL",
      answer: "Diwali 20% off",
      enabled: true,
      priority: 0,
    })
    expect(api.post).toHaveBeenCalledWith("/whatsapp/auto-replies", {
      keyword: "offer",
      matchType: "EXACT",
      scope: "ALL",
      answer: "Diwali 20% off",
      enabled: true,
      priority: 0,
    })
  })

  it("toggle patches only enabled", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useUpdateAutoReply(), { wrapper: Wrapper })
    await result.current.mutateAsync({ id: "r1", input: { enabled: false } })
    expect(api.patch).toHaveBeenCalledWith("/whatsapp/auto-replies/r1", { enabled: false })
  })

  it("deletes by id", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useDeleteAutoReply(), { wrapper: Wrapper })
    await result.current.mutateAsync("r1")
    expect(api.delete).toHaveBeenCalledWith("/whatsapp/auto-replies/r1")
  })

  it("lists rules", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useAutoReplies(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(api.get).toHaveBeenCalledWith("/whatsapp/auto-replies")
  })
})
