import type { RevenueTrendMonth } from "@/lib/hooks/use-analytics";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The six-month revenue series, in one currency. It used to take the
 * currency of the *oldest* month's first row: a month with no payments
 * has no rows, so for any gym younger than six months that was
 * `undefined`, every bar matched nothing, and the chart said "No revenue
 * yet" over a month of takings. Now: the gym's own currency, or -- for a
 * tenant paid only in another -- the one that took the most.
 */
export function revenueChart(months: RevenueTrendMonth[], gymCurrency: string) {
 const totals = new Map<string, number>();
 for (const m of months) {
 for (const r of m.revenue) {
 totals.set(r.currency, (totals.get(r.currency) ?? 0) + Number(r.netRevenue));
 }
 }
 const chartCurrency = totals.has(gymCurrency)
 ? gymCurrency
 : ([...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? gymCurrency);
 const weeklyData = months.map((m) => {
 const [, month] = m.month.split("-").map(Number);
 const label = month >= 1 && month <= 12 ? MONTH_LABELS[month - 1] : m.month;
 const row = m.revenue.find((r) => r.currency === chartCurrency);
 return { day: label, value: Math.max(0, Math.round(Number(row?.netRevenue ?? 0))) };
 });
 return { weeklyData, chartCurrency };
}
