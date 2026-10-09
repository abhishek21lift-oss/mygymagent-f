import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";

/**
 * Every signed-in area -- sign-in itself, the staff app, the member portal,
 * the trainer app and the kiosk -- shares this one layout, so moving
 * between them keeps a single session, and the public pages outside it
 * (landing, pricing, features, guides, policies) ship none of it.
 */
export default function SessionLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
