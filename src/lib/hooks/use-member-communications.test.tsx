import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { useMemberCommunications, useSendMemberMessage } from "@/lib/hooks/use-member-communications"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const row = {
  id: "log-1",
  channel: "PUSH",
  category: "TRANSACTIONAL",
  templateKey: "ad_hoc",
  recipient: "device:abc",
  memberId: "m1",
  status: "FAILED",
  attempts: 1,
  errorMessage: "x",
  sentAt: null,
  createdAt: "2026-09-30T00:00:00.000Z",
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, Wrapper }
}

describe("useMemberCommunications", () => {
  it("returns the rows from the paginated response, not the page object", async () => {
    // The page object reached the panel as `data`; `data.map` threw and took
    // the whole member profile down when the Messages tab opened.
    ;(api.get as jest.Mock).mockResolvedValue({ items: [row], page: 1, pageSize: 100, total: 1, totalPages: 1 })
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useMemberCommunications("m1"), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([row])
    expect(api.get).toHaveBeenCalledWith("/members/m1/communications", { query: { pageSize: 100 } })
  })

  it("refreshes the history after a failed send too, since failed attempts are logged", async () => {
    ;(api.post as jest.Mock).mockRejectedValue(new Error("502"))
    const { client, Wrapper } = wrapper()
    const invalidate = jest.spyOn(client, "invalidateQueries")
    const { result } = renderHook(() => useSendMemberMessage("m1"), { wrapper: Wrapper })
    await expect(result.current.mutateAsync({ channel: "PUSH", customBody: "hi" })).rejects.toThrow("502")
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["member-communications", "m1"] }))
  })
})
