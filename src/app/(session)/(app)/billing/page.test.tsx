import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"

import BillingPage from "./page"

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ hasPermission: () => false }),
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
