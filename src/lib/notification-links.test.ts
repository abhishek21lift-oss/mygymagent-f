import { notificationPath } from "./notification-links"

describe("notificationPath", () => {
  it("sends old WhatsApp inbox links to the replies on the WhatsApp screen", () => {
    expect(notificationPath("/whatsapp/inbox")).toBe("/settings/whatsapp#inbox")
    expect(notificationPath("/whatsapp")).toBe("/settings/whatsapp#inbox")
  })

  it("sends old PT session and product links to pages that exist", () => {
    expect(notificationPath("/pt/sessions/0b7d1d17-b2cb-4cae-8ac9-66acbfb09d6b")).toBe("/pt-operations/sessions")
    expect(notificationPath("/inventory/products/0b7d1d17-b2cb-4cae-8ac9-66acbfb09d6b")).toBe("/inventory/reorder")
  })

  it("leaves links that work alone", () => {
    for (const url of [
      "/members/abc",
      "/settings/whatsapp#inbox",
      "/inventory/products/new",
      "/inventory/products/new?edit=abc",
      "/pt-operations/sessions",
      "/portal/billing",
    ]) {
      expect(notificationPath(url)).toBe(url)
    }
  })
})
