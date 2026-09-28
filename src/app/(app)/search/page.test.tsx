import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"

import SearchPage from "./page"

jest.mock("next/navigation", () => ({ usePathname: () => "/search" }))

const get = jest.fn()
jest.mock("@/lib/api/client", () => {
 class ApiError extends Error {}
 return { api: { get: (...args: unknown[]) => get(...args) }, ApiError }
})

function renderPage() {
 // retry off so a rejection settles immediately instead of waiting out
 // the page's own single retry.
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
 return render(
  <QueryClientProvider client={client}>
   <SearchPage />
  </QueryClientProvider>,
 )
}

describe("SearchPage", () => {
 beforeEach(() => get.mockReset())

 it("says a failed search failed, rather than that nothing matched", async () => {
  get.mockRejectedValue(new Error("boom"))
  renderPage()
  fireEvent.change(screen.getByRole("textbox", { name: "Search" }), { target: { value: "Asha" } })

  const alert = await screen.findByRole("alert", undefined, { timeout: 3000 })
  expect(alert.textContent).toMatch(/Search failed/)
  // The old page told the front desk the member did not exist.
  expect(screen.queryByText(/No matches/)).toBeNull()
 })

 it("says nothing matched only when the search actually succeeded empty", async () => {
  get.mockResolvedValue({ results: [] })
  renderPage()
  fireEvent.change(screen.getByRole("textbox", { name: "Search" }), { target: { value: "Zzz" } })

  expect(await screen.findByText(/No matches for/, undefined, { timeout: 3000 })).toBeTruthy()
  expect(screen.queryByRole("alert")).toBeNull()
 })
})
