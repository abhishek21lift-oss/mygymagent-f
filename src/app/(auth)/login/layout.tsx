import type { Metadata } from "next";

/** The sign-in page is a client component, so its metadata lives here. */
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your gym's account, the member portal or the trainer app.",
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
