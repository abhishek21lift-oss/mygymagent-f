import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TODAY_METRICS, type TodayMetric } from "./metrics";
import { TodayList } from "./today-list";

export const metadata: Metadata = {
  title: "Today",
};

/**
 * The records behind one of the dashboard's Today figures: who checked
 * in, what was collected, who joined, who renewed, which leads came in.
 * `date` (YYYY-MM-DD, the gym's day) and `branch` arrive from the tile.
 */
export default async function TodayMetricPage({
  params,
  searchParams,
}: {
  params: Promise<{ metric: string }>;
  searchParams: Promise<{ date?: string; branch?: string }>;
}) {
  const { metric } = await params;
  if (!(metric in TODAY_METRICS)) notFound();
  const { date, branch } = await searchParams;
  return (
    <TodayList
      metric={metric as TodayMetric}
      date={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined}
      branchId={branch || undefined}
    />
  );
}
