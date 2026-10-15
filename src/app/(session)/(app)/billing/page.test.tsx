import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"

import BillingPage from "./page"

let mockPermissions: string[] = []
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}))
jest.mock("@/lib/hooks/use-payments", () => ({
  usePayments: () => ({ data: { items: [] }, isLoading: false, isError: false, refetch: jest.fn() }),
}))
jest.mock("./expenses-section", () => ({
  ExpensesSection: () => <div>Expenses</div>,
}))
jest.mock("./invoices-section", () => ({
  InvoicesSection: () => <div>Invoices</div>,
  InvoicesSectionHeader: () => <div>Invoices header</div>,
}))
jest.mock("./payment-detail-dialog", () => ({
  PaymentDetailDialog: () => null,
}))
jest.mock("./record-payment-dialog", () => ({
  RecordPaymentDialog: () => null,
}))

const scrollIntoView = jest.fn()
window.HTMLElement.prototype.scrollIntoView = scrollIntoView

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <BillingPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockPermissions = []
  scrollIntoView.mockReset()
  window.location.hash = ""
})

describe("BillingPage expenses anchor", () => {
  it("jumps to expenses when the sidebar links to #expenses", () => {
    window.location.hash = "#expenses"
    const { unmount } = renderPage()
    expect(scrollIntoView).toHaveBeenCalled()
    unmount()
  })

  it("stays put without the hash", () => {
    const { unmount } = renderPage()
    expect(scrollIntoView).not.toHaveBeenCalled()
    unmount()
  })
})

describe("BillingPage Ask AI entry", () => {
  it("offers the AI shortcut when the caller can generate", () => {
    mockPermissions = ["ai.generate"]
    renderPage()
    expect(screen.getByRole("link", { name: /Ask AI/ })).toBeInTheDocument()
  })

  it("hides it without ai.generate so it cannot dead-end", () => {
    mockPermissions = []
    renderPage()
    expect(screen.queryByRole("link", { name: /Ask AI/ })).not.toBeInTheDocument()
  })
})
