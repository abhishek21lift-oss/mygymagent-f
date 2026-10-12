import * as React from "react";

import { useAuth } from "@/lib/auth/auth-context";

/** One WhatsApp navigation entry. Every href is a real, working route. */
export interface WhatsAppNavEntry {
  title: string;
  href: string;
  icon: string;
  permission?: string | string[];
}

export interface WhatsAppNavGroup {
  label: string;
  entries: WhatsAppNavEntry[];
}

/**
 * WhatsApp command-center navigation. Every entry points at a real,
 * working destination — no placeholder links. Icons are resolved by the
 * presentation layer (lucide), so this module stays dependency-light
 * and unit-testable.
 */
export const WHATSAPP_NAV_GROUPS: WhatsAppNavGroup[] = [
  {
    label: "Main",
    entries: [
      { title: "Dashboard", href: "/whatsapp", icon: "dashboard", permission: "whatsapp.read" },
      { title: "Sessions & QR", href: "/settings/whatsapp", icon: "qr", permission: "whatsapp.read" },
    ],
  },
  {
    label: "Messaging",
    entries: [
      { title: "Chat", href: "/inbox", icon: "chat", permission: "whatsapp.read" },
      { title: "Broadcasts", href: "/broadcasts", icon: "send", permission: "whatsapp.manage" },
    ],
  },
  {
    label: "Contacts",
    entries: [
      { title: "Contacts & Groups", href: "/whatsapp#contacts", icon: "users", permission: "whatsapp.read" },
    ],
  },
  {
    label: "Automation",
    entries: [
      { title: "Auto Reply", href: "/settings/whatsapp#auto-replies", icon: "zap", permission: "whatsapp.read" },
      { title: "Bot Automation", href: "/settings/whatsapp#bot-automation", icon: "bot", permission: "whatsapp.read" },
      { title: "Webhooks & API", href: "/settings/whatsapp#webhooks", icon: "webhook", permission: "whatsapp.read" },
      { title: "Templates", href: "/settings/messages", icon: "file", permission: "notifications.manage" },
    ],
  },
];

/** Base routes that belong to WhatsApp mode (hash anchors stripped). */
const WHATSAPP_ROUTE_BASES = [
  "/whatsapp",
  "/inbox",
  "/broadcasts",
  "/settings/whatsapp",
  "/settings/messages",
];

/**
 * Whether a pathname belongs to WhatsApp mode. Pure function of the URL,
 * so browser back/forward, refresh and direct entry all resolve the same
 * layout with no extra state to desynchronise.
 */
export function isWhatsAppRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split("#")[0].split("?")[0];
  return WHATSAPP_ROUTE_BASES.some((base) => path === base || path.startsWith(`${base}/`));
}

/** Whether a nav entry is the current page (hash anchors compare by base). */
export function isWhatsAppNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const path = href.split("#")[0];
  if (href === "/whatsapp") return pathname === "/whatsapp";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * The nav groups filtered to what this person may open. Callers hide the
 * WhatsApp panes entirely when nothing is visible.
 */
export function useVisibleWhatsAppNav(): { groups: WhatsAppNavGroup[]; total: number } {
  const { hasPermission } = useAuth();
  return React.useMemo(() => {
    const groups = WHATSAPP_NAV_GROUPS.map((group) => ({
      ...group,
      entries: group.entries.filter((e) => !e.permission || hasPermission(e.permission)),
    })).filter((group) => group.entries.length > 0);
    return { groups, total: groups.reduce((n, g) => n + g.entries.length, 0) };
  }, [hasPermission]);
}
