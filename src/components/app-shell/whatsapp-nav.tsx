"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";

import { WhatsAppGlyph } from "@/components/app-shell/topbar";
import { cn } from "@/lib/utils";
import {
  isWhatsAppNavActive,
  useVisibleWhatsAppNav,
  type WhatsAppNavEntry,
} from "@/lib/whatsapp-nav";

const ENTRY_ICONS: Record<WhatsAppNavEntry["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  qr: QrCode,
  chat: MessageSquare,
  send: Send,
  users: Users,
  zap: Zap,
  bot: Bot,
  webhook: Webhook,
  file: FileText,
};

function EntryIcon({ entry, className }: { entry: WhatsAppNavEntry; className?: string }) {
  const Icon = ENTRY_ICONS[entry.icon] ?? MessageSquare;
  return <Icon className={className} aria-hidden="true" />;
}

/**
 * The dedicated WhatsApp navigation sidebar: a green-tinted glass pane
 * that sits immediately beside the collapsed main rail. Restrained by
 * design — one branded header, emerald active states, quiet rows.
 */
export function WhatsAppSideNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { groups } = useVisibleWhatsAppNav();

  return (
    <nav aria-label="WhatsApp" className={cn("flex h-full min-h-0 flex-col", className)}>
      <div
        aria-hidden="true"
        className="mb-3 flex shrink-0 items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#25D366]/20 via-emerald-50/60 to-transparent px-3 py-2.5 dark:from-[#25D366]/25 dark:via-emerald-950/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[0_6px_14px_-6px_#25D366]">
          <WhatsAppGlyph className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-tight text-foreground">WhatsApp</span>
          <span className="block truncate text-xs text-muted-foreground">Command center</span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pb-1 [scrollbar-width:thin]">
        {groups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.entries.map((entry) => {
                const active = isWhatsAppNavActive(pathname, entry.href);
                return (
                  <li key={entry.href + entry.title}>
                    <Link
                      href={entry.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 touch-manipulation items-center gap-2.5 rounded-xl px-3 text-sm transition-colors duration-150",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        active
                          ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300"
                          : "font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <EntryIcon entry={entry} className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                      {active ? (
                        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

/**
 * Compact horizontal WhatsApp nav for phones, where the two-sidebar
 * layout would squeeze content. Same entries, same active states.
 */
export function WhatsAppNavStrip({ className }: { className?: string }) {
  const pathname = usePathname();
  const { groups } = useVisibleWhatsAppNav();
  const entries = groups.flatMap((g) => g.entries);

  return (
    <nav aria-label="WhatsApp" className={cn("flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]", className)}>
      {entries.map((entry) => {
        const active = isWhatsAppNavActive(pathname, entry.href);
        return (
          <Link
            key={entry.href + entry.title}
            href={entry.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 touch-manipulation items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <EntryIcon entry={entry} className="size-4 shrink-0" />
            <span className="whitespace-nowrap">{entry.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
