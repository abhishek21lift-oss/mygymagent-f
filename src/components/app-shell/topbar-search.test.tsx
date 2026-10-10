import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TopbarSearch } from "./topbar-search"

const push = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const mockGet = jest.fn()
jest.mock("@/lib/api/client", () => ({
  api: { get: (path: string, options?: unknown) => mockGet(path, options) },
  ApiError: class ApiError extends Error {},
}))

function renderSearch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TopbarSearch />
    </QueryClientProvider>,
  )
}

const MEMBER = {
  query: "priya",
  results: [
    { id: "mem-1", type: "member", title: "Priya Sharma", subtitle: "+91 98765 43210", href: "/members/mem-1" },
  ],
}

beforeEach(() => {
  push.mockReset()
  mockGet.mockReset().mockImplementation(async (path: string, options?: { query?: { q?: string } }) => {
    const q = options?.query?.q ?? ""
    if (q.toLowerCase().includes("priya")) return MEMBER
    return { query: q, results: [] }
  })
})

describe("TopbarSearch", () => {
  it("is a real input: clicking focuses it without opening a dialog", async () => {
    const user = userEvent.setup()
    renderSearch()
    const box = screen.getByRole("combobox", { name: /search/i })
    expect(box.tagName).toBe("INPUT")
    await user.click(box)
    expect(box).toHaveFocus()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(document.activeElement).toBe(box)
  })

  it("finds a member by name and opens the profile on select", async () => {
    renderSearch()
    fireEvent.change(screen.getByRole("combobox", { name: /search/i }), { target: { value: "priya" } })
    expect(await screen.findByText("Priya Sharma")).toBeInTheDocument()
    expect(screen.getByText("+91 98765 43210")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Priya Sharma"))
    expect(push).toHaveBeenCalledWith("/members/mem-1")
  })

  it("finds a member by contact number", async () => {
    mockGet.mockImplementation(async () => ({
      query: "98765",
      results: [
        { id: "mem-1", type: "member", title: "Priya Sharma", subtitle: "+91 98765 43210", href: "/members/mem-1" },
      ],
    }))
    renderSearch()
    fireEvent.change(screen.getByRole("combobox", { name: /search/i }), { target: { value: "98765" } })
    expect(await screen.findByText("Priya Sharma")).toBeInTheDocument()
    const [, options] = mockGet.mock.calls[0] as [string, { query: { q: string } }]
    expect(options.query.q).toBe("98765")
  })

  it("opens the highlighted result when Enter follows arrow keys", async () => {
    renderSearch()
    const box = screen.getByRole("combobox", { name: /search/i })
    fireEvent.change(box, { target: { value: "priya" } })
    await screen.findByText("Priya Sharma")
    fireEvent.keyDown(box, { key: "ArrowDown" })
    fireEvent.keyDown(box, { key: "Enter" })
    expect(push).toHaveBeenCalledWith("/members/mem-1")
  })

  it("goes to the full search page on Enter", async () => {
    renderSearch()
    const box = screen.getByRole("combobox", { name: /search/i })
    fireEvent.change(box, { target: { value: "priya" } })
    await screen.findByText("Priya Sharma")
    fireEvent.keyDown(box, { key: "Enter" })
    expect(push).toHaveBeenCalledWith("/search?q=priya")
  })

  it("clears the query and resets results", async () => {
    renderSearch()
    const box = screen.getByRole("combobox", { name: /search/i })
    fireEvent.change(box, { target: { value: "priya" } })
    await screen.findByText("Priya Sharma")
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }))
    expect(box).toHaveValue("")
    await waitFor(() => expect(screen.queryByText("Priya Sharma")).not.toBeInTheDocument())
  })

  it("shows no-results and error states distinctly", async () => {
    renderSearch()
    fireEvent.change(screen.getByRole("combobox", { name: /search/i }), { target: { value: "nobody here" } })
    expect(await screen.findByText(/no matches/i)).toBeInTheDocument()

    mockGet.mockRejectedValueOnce(new Error("boom")).mockRejectedValueOnce(new Error("boom"))
    fireEvent.change(screen.getByRole("combobox", { name: /search/i }), { target: { value: "priya xyz" } })
    // The query retries once with backoff before surfacing the error.
    expect(await screen.findByText(/search failed/i, undefined, { timeout: 5000 })).toBeInTheDocument()
  })

  it("never shows stale results when typing fast", async () => {
    let resolveSlow!: (v: unknown) => void
    const slow = new Promise((resolve) => {
      resolveSlow = resolve
    })
    mockGet.mockImplementation(async (path: string, options?: { query?: { q?: string } }) => {
      const q = options?.query?.q ?? ""
      if (q === "pri") return slow
      return { query: q, results: [] }
    })
    renderSearch()
    const box = screen.getByRole("combobox", { name: /search/i })
    fireEvent.change(box, { target: { value: "pri" } })
    // Let the first request leave before typing on — that is the race.
    await screen.findByText(/searching/i)
    fireEvent.change(box, { target: { value: "priya sharma" } })
    await screen.findByText(/no matches/i)
    // The slow first request lands after the newer one — it must not win.
    resolveSlow({ query: "pri", results: [{ id: "x", type: "member", title: "Stale Person", href: "/members/x" }] })
    await waitFor(() => expect(screen.queryByText("Stale Person")).not.toBeInTheDocument())
    expect(screen.getByText(/no matches/i)).toBeInTheDocument()
  })
})
