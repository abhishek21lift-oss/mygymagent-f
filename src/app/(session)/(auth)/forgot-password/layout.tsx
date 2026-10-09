import type { Metadata } from "next";

/**
 * Nothing here for a search result to offer. Kept out of the index with a
 * `noindex` rather than a robots.txt rule, since a crawler blocked from
 * the page could never read the `noindex`.
 */
export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
