import type { Metadata } from "next";
import type { ReactNode } from "react";

import { TrainerShell } from "@/components/trainer/trainer-shell";
import "./trainer-theme.css";

/**
 * The trainer surface's route root.
 *
 * A server component whose only jobs are metadata, the token import, and
 * handing off to the client shell. The split is deliberate: the shell
 * needs `useAuth`, `useRouter` and `usePathname`, so it must be a client
 * component, and the CSS import belongs in a layout per the App Router's
 * documented pattern. Keeping them together would mean importing a
 * global stylesheet from a client component -- it does work, but it is not
 * what Next documents, and it fails silently (every `var(--t-*)` resolves
 * to nothing, so a gradient becomes `background: none` and the dark tab
 * bar turns transparent) rather than loudly.
 *
 * The tokens are scoped to `.trainer-surface`, so importing them here
 * rather than folding them into `globals.css` leaves the staff app's own
 * palette untouched.
 */
export const metadata: Metadata = {
  title: "Trainer",
};

export default function TrainerLayout({ children }: { children: ReactNode }) {
  return <TrainerShell>{children}</TrainerShell>;
}
