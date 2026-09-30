import { whatsappDrafts, whatsappLink, whatsappNumber } from "./whatsapp-link"

describe("whatsappNumber", () => {
  it("adds 91 to a local number only at an Indian branch", () => {
    expect(whatsappNumber("98765 43210", "India")).toBe("919876543210")
    expect(whatsappNumber("098765-43210", "IN")).toBe("919876543210")
    expect(whatsappNumber("98765 43210", "US")).toBeNull()
    expect(whatsappNumber("98765 43210", null)).toBeNull()
  })

  it("keeps a number saved with its country code, anywhere", () => {
    expect(whatsappNumber("+1 555 010 0000", "US")).toBe("15550100000")
    expect(whatsappNumber("+91 98765 43210", null)).toBe("919876543210")
    expect(whatsappNumber("0044 20 7946 0958", "UK")).toBe("442079460958")
  })

  it("has nothing for a missing or impossible number", () => {
    expect(whatsappNumber(null, "India")).toBeNull()
    expect(whatsappNumber("12345", "India")).toBeNull()
  })
})

describe("whatsappLink", () => {
  it("opens a chat with the message typed in", () => {
    expect(whatsappLink("919876543210", "Hi Asha & co?")).toBe("https://wa.me/919876543210?text=Hi%20Asha%20%26%20co%3F")
    expect(whatsappLink("919876543210")).toBe("https://wa.me/919876543210")
  })
})

describe("whatsappDrafts", () => {
  it("offers a renewal reminder only when there is a membership to renew", () => {
    const base = { firstName: "Asha", staffFirstName: "Priya", branchName: "Downtown" }
    expect(whatsappDrafts(base).map((d) => d.id)).toEqual(["hello", "missed", "payment"])

    const withPlan = whatsappDrafts({ ...base, planName: "Monthly Basic", endDate: "2026-10-14T00:00:00Z", daysLeft: 5 })
    const renewal = withPlan.find((d) => d.id === "renewal")!
    expect(renewal.text).toMatch(/^Hi Asha, this is Priya from Downtown\. A quick reminder that your Monthly Basic membership ends on/)
  })

  it("words an expired membership as ended, not ending", () => {
    const [, renewal] = whatsappDrafts({ firstName: "Asha", planName: "Monthly Basic", endDate: "2026-09-01T00:00:00Z", daysLeft: 0 })
    expect(renewal.text).toMatch(/^Hi Asha\. Your Monthly Basic membership ended on/)
  })
})
