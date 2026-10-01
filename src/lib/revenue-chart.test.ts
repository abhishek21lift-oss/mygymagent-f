import { revenueChart } from "./revenue-chart"
import { memberStatusLabel } from "./member-status"

const month = (key: string, rows: Array<[string, string]>) => ({
  month: key,
  revenue: rows.map(([currency, netRevenue]) => ({
    currency,
    grossRevenue: netRevenue,
    productRevenue: "0.00",
    refunded: "0.00",
    netRevenue,
  })),
})

describe("revenueChart", () => {
  it("draws a young gym's revenue even though its oldest months are empty", () => {
    // The bug: currency was taken from months[0].revenue[0], which is
    // undefined for a month with no payments, so every bar was 0.
    const { weeklyData, chartCurrency } = revenueChart(
      [
        month("2026-05", []),
        month("2026-06", []),
        month("2026-07", []),
        month("2026-08", []),
        month("2026-09", [["INR", "12000.00"]]),
        month("2026-10", [["INR", "4500.50"]]),
      ],
      "INR",
    )
    expect(chartCurrency).toBe("INR")
    expect(weeklyData).toEqual([
      { day: "May", value: 0 },
      { day: "Jun", value: 0 },
      { day: "Jul", value: 0 },
      { day: "Aug", value: 0 },
      { day: "Sep", value: 12000 },
      { day: "Oct", value: 4501 },
    ])
  })

  it("charts the gym's own currency when there are several", () => {
    const { weeklyData, chartCurrency } = revenueChart(
      [month("2026-09", [["USD", "900.00"], ["INR", "100.00"]]), month("2026-10", [["INR", "200.00"]])],
      "INR",
    )
    expect(chartCurrency).toBe("INR")
    expect(weeklyData.map((d) => d.value)).toEqual([100, 200])
  })

  it("falls back to the currency that took the most when the gym's own has none", () => {
    const { chartCurrency } = revenueChart(
      [month("2026-09", [["USD", "50.00"], ["EUR", "900.00"]])],
      "INR",
    )
    expect(chartCurrency).toBe("EUR")
  })

  it("keeps the gym's currency for an empty series", () => {
    expect(revenueChart([], "INR")).toEqual({ weeklyData: [], chartCurrency: "INR" })
  })
})

describe("memberStatusLabel", () => {
  it("names the derived statuses in words", () => {
    expect(memberStatusLabel("EXPIRED")).toBe("Lapsed")
    expect(memberStatusLabel("NO_MEMBERSHIP")).toBe("No membership")
    expect(memberStatusLabel("UPCOMING")).toBe("Starting soon")
    expect(memberStatusLabel("SOMETHING_NEW")).toBe("Something new")
  })
})
