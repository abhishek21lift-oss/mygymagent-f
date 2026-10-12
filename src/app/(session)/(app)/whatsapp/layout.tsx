"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  FileText,
  LayoutDashboard,
  MessageSquare,
  QrCode,
  Send,
  Users,
  Webhook,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"

interface NavEntry {
  title: string
  href: string
  icon: React.ReactNode
  permission?: string | string[]
}

interface NavGroup {
  label: string
  entries: NavEntry[]
}

/** WhatsApp Command Center navigation. Every entry points at a real,
 * working destination — no placeholder links. */
const GROUPS: NavGroup[] = [
  {
    label: "Main",
    entries: [
      {
        title: "Dashboard",
        href: "/whatsapp",
        icon: <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.read",
      },
      {
        title: "Sessions & QR",
        href: "/settings/whatsapp",
        icon: <QrCode className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.read",
      },
    ],
  },
  {
    label: "Messaging",
    entries: [
      {
        title: "Chat",
        href: "/inbox",
        icon: <MessageSquare className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.read",
      },
      {
        title: "Broadcasts",
        href: "/broadcasts",
        icon: <Send className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.manage",
      },
    ],
  },
  {
    label: "Contacts",
    entries: [
      {
        title: "Contacts & Groups",
        href: "/whatsapp#contacts",
        icon: <Users className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.read",
      },
    ],
  },
  {
    label: "Automation",
    entries: [
      {
        title: "Auto Reply",
        href: "/settings/whatsapp#auto-replies",
        icon: <Zap className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.read",
      },
      {
        title: "Bot Automation",
        href: "/settings/whatsapp#bot-automation",
        icon: <Bot className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.read",
      },
      {
        title: "Webhooks & API",
        href: "/settings/whatsapp#webhooks",
        icon: <Webhook className="size-4 shrink-0" aria-hidden="true" />,
        permission: "whatsapp.read",
      },
      {
        title: "Templates",
        href: "/settings/messages",
        icon: <FileText className="size-4 shrink-0" aria-hidden="true" />,
        permission: "notifications.manage",
      },
    ],
  },
]

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  const path = href.split("#")[0]
  if (href === "/whatsapp") return pathname === "/whatsapp"
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function WhatsAppShellNav() {
  const { hasPermission } = useAuth()
  const pathname = usePathname()
  return (
    <nav aria-label="WhatsApp command center" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {GROUPS.map((group) => {
        const visible = group.entries.filter(
          (e) => !e.permission || hasPermission(e.permission),
        )
        if (visible.length === 0) return null
        return (
          <div key={group.label} className="flex shrink-0 items-center gap-1 lg:block lg:space-y-1">
            <p className="hidden px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground first:pt-0 lg:block">
              {group.label}
            </p>
            {visible.map((entry) => {
              const active = isActive(pathname, entry.href)
              return (
                <Link
                  key={entry.href + entry.title}
                  href={entry.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "text-stone-600 hover:bg-muted dark:text-stone-400",
                  )}
                >
                  {entry.icon}
                  <span className="whitespace-nowrap">{entry.title}</span>
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <aside className="shrink-0 lg:w-60">
        <div className="lg:sticky lg:top-24 lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card lg:p-3">
          <WhatsAppShellNav />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
