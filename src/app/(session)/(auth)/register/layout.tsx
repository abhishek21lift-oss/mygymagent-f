import type { Metadata } from "next";

/**
 * The sign-up page is a client component, so its metadata lives here.
 * It is the page every "Start free trial" link on the site points to,
 * and the one most worth showing in search results after the home page.
 */
export const metadata: Metadata = {
  title: "Free gym management software trial",
  description:
    "Create your gym's account in minutes: memberships, WhatsApp reminders, check-in, payments and staff in one app. Free trial, no card needed.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
