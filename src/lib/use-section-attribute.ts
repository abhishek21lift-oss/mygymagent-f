"use client";

import * as React from "react";

import { accentForPath } from "@/lib/section-accent";

/**
 * Mirrors the page's section onto `<html>`.
 *
 * The shell already sets `data-section` on its own root, which is enough
 * for everything rendered inside it. It is not enough for anything Radix
 * portals: a dialog, a dropdown, a select and a toast all mount at
 * `document.body`, outside that subtree, so they fell back to the
 * `:root` default and a confirm dialog opened over an amber Finance page
 * with an indigo button in it.
 *
 * Writing the attribute on the document element puts every portal inside
 * the same cascade. The attribute is removed on unmount so the sign-in
 * screen, which has no section, does not inherit the last one visited.
 */
export function useSectionAttribute(pathname: string | null) {
  const accent = accentForPath(pathname);
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.section = accent;
    return () => {
      delete root.dataset.section;
    };
  }, [accent]);
  return accent;
}
