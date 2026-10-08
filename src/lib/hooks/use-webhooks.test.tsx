import "@testing-library/jest-dom"
import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import {
  useCreateWebhook,
  useDeleteWebhook,
  useRegenerateWebhook,
  useTestWebhook,
  useUpdateWebhook,
  useWebhookDeliveries,
  useWebhooks,
} from "@/lib/hooks/use-webhooks"

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

const SUB = {
  id: "w1",
  url: "https://n8n.example.com/hook",
  events: ["message.received"],
  enabled: true,
  createdAt: "2026-10-09T10:00:00Z",
  updatedAt: "2026-10-09T10:00:00Z",
}

describe("useWebhooks", () => {
  beforeEach(() => {
    ;(api.get as jest.Mock).mockImplementation((path: string) =>
      path.includes("deliveries") ? Promise.resolve([]) : Promise.resolve([SUB]),
    )
    ;(api.post as jest.Mock).mockResolvedValue(SUB)
    ;(api.patch as jest.Mock).mockResolvedValue({ count: 1 })
    ;(api.delete as jest.Mock).mockResolvedValue({ deleted: true })
  })

  it("creates a subscription with url, events and enabled", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useCreateWebhook(), { wrapper: Wrapper })
    await result.current.mutateAsync({
      url: "https://n8n.example.com/hook",
      events: ["message.received"],
      enabled: true,
    })
    expect(api.post).toHaveBeenCalledWith("/whatsapp/webhooks", {
      url: "https://n8n.example.com/hook",
      events: ["message.received"],
      enabled: true,
    })
  })

  it("toggle patches exactly enabled", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useUpdateWebhook(), { wrapper: Wrapper })
    await result.current.mutateAsync({ id: "w1", input: { enabled: false } })
    expect(api.patch).toHaveBeenCalledWith("/whatsapp/webhooks/w1", { enabled: false })
  })

  it("tests via the test endpoint", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useTestWebhook(), { wrapper: Wrapper })
    await result.current.mutateAsync("w1")
    expect(api.post).toHaveBeenCalledWith("/whatsapp/webhooks/w1/test")
  })

  it("regenerates via the regenerate endpoint", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useRegenerateWebhook(), { wrapper: Wrapper })
    await result.current.mutateAsync("w1")
    expect(api.post).toHaveBeenCalledWith("/whatsapp/webhooks/w1/regenerate")
  })

  it("deletes by id", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useDeleteWebhook(), { wrapper: Wrapper })
    await result.current.mutateAsync("w1")
    expect(api.delete).toHaveBeenCalledWith("/whatsapp/webhooks/w1")
  })

  it("lists subscriptions and deliveries", async () => {
    const { Wrapper } = wrapper()
    const subs = renderHook(() => useWebhooks(), { wrapper: Wrapper })
    await waitFor(() => expect(subs.result.current.data).toHaveLength(1))
    expect(api.get).toHaveBeenCalledWith("/whatsapp/webhooks")
    const log = renderHook(() => useWebhookDeliveries(), { wrapper: Wrapper })
    await waitFor(() => expect(log.result.current.data).toEqual([]))
    expect(api.get).toHaveBeenCalledWith("/whatsapp/webhooks/deliveries")
  })
})
