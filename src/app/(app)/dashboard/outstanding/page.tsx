import type { Metadata } from "next";

import { OutstandingList } from "./outstanding-list";

export const metadata: Metadata = {
  title: "Outstanding",
};

/**
 * Who owes money on a membership, largest balance first: the members
 * behind the dashboard's "Outstanding amount". `branch` arrives from the
 * dashboard's branch picker.
 */
export default async function OutstandingPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  return <OutstandingList branchId={branch || undefined} />;
}
