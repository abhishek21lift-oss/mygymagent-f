import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import {
  getInvoiceOutstanding,
  normalizeAging,
  toInvoiceDetail,
  toRetryResult,
  useInvoice,
  useLinkPayment,
} from "@/lib/hooks/use-invoices"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

/** An invoice as GET /invoices/:id sends it. */
const apiInvoice = {
  id: "inv-1",
  number: "INV-2026-0002",
  status: "PART_PAID",
  grandTotal: "9000",
  subtotal: "9000",
  discountTotal: "0",
  currency: "INR",
  outstanding: "7000.00",
  membershipId: "ms-1",
  issuedAt: "2026-09-30T10:00:00.000Z",
  dueAt: "2026-09-30T10:00:00.000Z",
  lines: [{ label: "18 months", amount: "9000.00", qty: 1 }],
  member: { id: "m1", firstName: "Asha", lastName: "Rao" },
  paymentLinks: [
    {
      amount: "2000",
      payment: {
        id: "p1",
        amount: "2000",
        currency: "INR",
        method: "UPI",
        status: "COMPLETED",
        createdAt: "2026-09-30T10:05:00.000Z",
      },
    },
  ],
  dunningAttempts: [
    { channel: "WHATSAPP", templateKey: "invoice.due_soon", status: "PENDING", sentAt: null, createdAt: "2026-09-30T08:00:00.000Z" },
  ],
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, Wrapper }
}

describe("toInvoiceDetail", () => {
  it("reads payments from paymentLinks and the server's outstanding", () => {
    const invoice = toInvoiceDetail(apiInvoice)
    expect(invoice.payments).toEqual([
      expect.objectContaining({ id: "p1", amount: "2000", method: "UPI" }),
    ])
    expect(invoice.subTotal).toBe("9000")
    // The server's figure, not grandTotal minus a list the screen never had.
    expect(getInvoiceOutstanding(invoice)).toBe(7000)
    // A reminder not sent yet still has a time to show.
    expect(invoice.dunningAttempts[0].sentAt).toBe("2026-09-30T08:00:00.000Z")
  })

  it("never leaves payments undefined, which crashed the drawer", () => {
    const invoice = toInvoiceDetail({ id: "inv-2", grandTotal: "100" })
    expect(invoice.payments).toEqual([])
    expect(invoice.lines).toEqual([])
    expect(invoice.dunningAttempts).toEqual([])
  })
})

describe("normalizeAging", () => {
  it("turns per-bucket currency maps into one row per currency", () => {
    expect(
      normalizeAging({
        current: { INR: "1200.00" },
        d1_7: {},
        d8_30: { INR: "300.00", USD: "10.00" },
        d30plus: {},
      } as never),
    ).toEqual([
      { currency: "INR", current: "1200.00", d1_7: 0, d8_30: "300.00", d30plus: 0 },
      { currency: "USD", current: 0, d1_7: 0, d8_30: "10.00", d30plus: 0 },
    ])
  })

  it("has no rows when nothing is owed", () => {
    expect(normalizeAging({ current: {}, d1_7: {}, d8_30: {}, d30plus: {} } as never)).toEqual([])
  })
})

describe("toRetryResult", () => {
  it("reads the order id and amount from the API's shape", () => {
    expect(
      toRetryResult({
        invoiceId: "inv-1",
        outstanding: "7000.00",
        currency: "INR",
        keyId: "rzp_test",
        order: { id: "order_1", amount: 700000, currency: "INR" },
      }),
    ).toEqual({ orderId: "order_1", amount: "7000.00", currency: "INR", keyId: "rzp_test" })
  })
})

describe("invoice hooks", () => {
  it("useInvoice hands the screens a normalised invoice", async () => {
    ;(api.get as jest.Mock).mockResolvedValue(apiInvoice)
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useInvoice("inv-1"), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.payments).toHaveLength(1)
  })

  it("useLinkPayment posts the payment to the invoice", async () => {
    ;(api.post as jest.Mock).mockResolvedValue({ ...apiInvoice, status: "PAID", outstanding: "0.00" })
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useLinkPayment(), { wrapper: Wrapper })
    const updated = await result.current.mutateAsync({ invoiceId: "inv-1", paymentId: "p9" })
    expect(api.post).toHaveBeenCalledWith("/invoices/inv-1/payments", { paymentId: "p9" })
    expect(updated.status).toBe("PAID")
  })
})
