"use client";

import { BrandLogo } from "@/components/shared/brand-logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import { accentForPath, type Accent } from "@/lib/section-accent";
import { useAuth } from "@/lib/auth/auth-context";
import {
  activeChildHref,
  comingSoonNav,
  isNavItemActive,
  platformNav,
  primaryNav,
  quickActions,
  secondaryNav,
  settingsNav,
  visibleNavItem,
  type NavItem,
} from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRODUCT_LOGO_ALT, PRODUCT_NAME } from "@/lib/brand";

const OPEN_GROUPS_KEY = "mygymagent:nav-open-groups";

/** The hue a row wears: `data-nav-accent` re-points `--nav-accent` and
 * `--nav-ink` (globals.css), so one set of rules paints every colour. */
function navAccent(item: NavItem): Accent | "ai" {
  if (item.accent === "ai") return "ai";
  return item.hue ?? accentForPath(item.children?.[0]?.href ?? item.href);
}

function readOpenGroups(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(OPEN_GROUPS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeOpenGroups(value: Record<string, boolean>) {
  try {
    window.localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the rail still works, it just
    // forgets which groups were open.
  }
}

/**
 * The glyph tile. Resting, it is the hue at low strength; when the row
 * holds the page you are on it fills with the hue's gradient, so the
 * rail says where you are in colour before you read a word.
 */
function IconTile({ item, filled, size = "md" }: { item: NavItem; filled: boolean; size?: "sm" | "md" }) {
  const Icon = item.icon;
  const isAi = item.accent === "ai";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        size === "md" ? "size-9 rounded-xl" : "size-7 rounded-lg",
        isAi && "ai-glyph",
        filled && !isAi && "shadow-[0_6px_16px_-6px_var(--nav-accent)]",
      )}
      style={
        isAi
          ? undefined
          : filled
            ? {
                backgroundImage:
                  "linear-gradient(140deg, color-mix(in oklab, var(--nav-accent) 92%, white), color-mix(in oklab, var(--nav-accent) 100%, black 18%))",
                color: "white",
              }
            : {
                background: "color-mix(in oklab, var(--nav-accent) 12%, transparent)",
                color: "var(--nav-accent)",
              }
      }
    >
      <Icon className={cn(size === "md" ? "size-[1.05rem]" : "size-3.5", "shrink-0")} aria-hidden="true" />
    </span>
  );
}

const rowBase =
  "group relative flex w-full min-h-11 touch-manipulation items-center rounded-2xl text-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nav-accent)]";

/** A page. The only kind of row that navigates, and so the only one that
 * closes the phone drawer. */
function LeafLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      data-nav-accent={navAccent(item)}
      href={item.href}
      onClick={onNavigate}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener" : undefined}
      title={collapsed ? item.title : undefined}
      aria-label={collapsed ? item.title : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        rowBase,
        collapsed ? "justify-center px-2 py-1" : "gap-3 px-2 py-1 text-sm",
        active
          ? "font-semibold text-sidebar-foreground"
          : "font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
      style={
        active
          ? {
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--nav-accent) 16%, var(--card)) 0%, color-mix(in oklab, var(--nav-accent) 10%, var(--card)) 100%)",
              boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--nav-accent) 22%, transparent)",
            }
          : undefined
      }
    >
      <IconTile item={item} filled={active} />
      {!collapsed ? (
        <>
          <span className="flex-1 truncate tracking-[-0.01em]">{item.title}</span>
          {item.external ? <ExternalLink className="size-3.5 shrink-0 opacity-50" aria-hidden="true" /> : null}
          {item.comingSoon ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-xs">
              Soon
            </Badge>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

/** A page inside an open group: a dot in the group's hue on its guide
 * line, rather than a second row of icon tiles. */
function ChildLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener" : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-10 touch-manipulation items-center gap-2.5 rounded-xl py-1.5 pl-3 pr-2.5 text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--nav-accent)]",
        active
          ? "font-semibold text-sidebar-foreground"
          : "font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
      style={active ? { background: "color-mix(in oklab, var(--nav-accent) 12%, transparent)" } : undefined}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full transition-transform duration-200", active ? "scale-125" : "opacity-60")}
        style={{
          background: "var(--nav-accent)",
          boxShadow: active ? "0 0 0 3px color-mix(in oklab, var(--nav-accent) 22%, transparent)" : undefined,
        }}
      />
      <span className="flex-1 truncate">{item.title}</span>
      {item.external ? <ExternalLink className="size-3 shrink-0 opacity-50" aria-hidden="true" /> : null}
    </Link>
  );
}

function ChildList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const current = activeChildHref(pathname, items);
  return (
    <ul className="space-y-0.5">
      {items.map((child) => (
        <li key={child.href}>
          <ChildLink item={child} active={child.href === current} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

/**
 * A work area. Its row opens and closes the list -- it never navigates.
 *
 * It used to be a link to the group's first page that showed the list
 * only once you were there, so on a phone tapping "Operations" to find
 * Staff closed the drawer and dropped you on Attendance instead.
 */
function NavGroup({
  item,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const children = item.children ?? [];
  const holdsActive = activeChildHref(pathname, children) !== null;
  const listId = React.useId();

  return (
    <div data-nav-accent={navAccent(item)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        className={cn(
          rowBase,
          "gap-3 px-2 py-1 text-sm",
          holdsActive
            ? "font-semibold text-sidebar-foreground"
            : "font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <IconTile item={item} filled={holdsActive} />
        <span className="flex-1 truncate tracking-[-0.01em]">{item.title}</span>
        {holdsActive && !open ? (
          <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: "var(--nav-accent)" }} />
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-sidebar-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open && "rotate-180",
          )}
        />
      </button>

      {/* grid-rows 0fr -> 1fr animates to the list's real height. */}
      <div
        id={listId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        inert={!open}
      >
        <div className="overflow-hidden">
          <div className="relative ml-[1.35rem] mt-0.5 mb-1.5 border-l border-sidebar-border pl-2">
            <ChildList items={children} pathname={pathname} onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** On the collapsed rail a group is an icon that opens its pages beside
 * the rail, instead of a link that would expand nothing. */
function RailGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = React.useState(false);
  const children = item.children ?? [];
  const holdsActive = activeChildHref(pathname, children) !== null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-nav-accent={navAccent(item)}
          aria-label={item.title}
          title={item.title}
          className={cn(rowBase, "justify-center px-2 py-1", !holdsActive && "hover:bg-sidebar-accent")}
          style={holdsActive ? { background: "color-mix(in oklab, var(--nav-accent) 13%, transparent)" } : undefined}
        >
          <IconTile item={item} filled={holdsActive} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={14}
        data-nav-accent={navAccent(item)}
        className="glass w-60 rounded-2xl p-2"
      >
        <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--nav-ink)" }}>
          {item.title}
        </p>
        <ChildList items={children} pathname={pathname} onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: Accent | "ai" }) {
  return (
    <div
      className="mb-1.5 mt-1 flex items-center gap-2 px-3"
      data-nav-accent={accent}
    >
      {accent && accent !== "ai" ? (
        /* Colored dot matching the section hue */
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full"
          style={{
            background: "linear-gradient(135deg, var(--nav-accent), var(--nav-accent))",
            opacity: 0.75,
          }}
        />
      ) : null}
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-muted">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-sidebar-border" />
    </div>
  );
}

function QuickActions({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("mb-3 grid shrink-0 gap-2 px-1", items.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href + item.title}
            data-nav-accent={navAccent(item)}
            href={item.href}
            onClick={onNavigate}
            aria-label={item.title}
            className="group relative flex min-h-10 items-center justify-center gap-1.5 overflow-hidden rounded-xl px-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_-6px_var(--nav-accent)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-8px_var(--nav-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nav-accent)] motion-reduce:transform-none"
            style={{
              backgroundImage:
                "linear-gradient(140deg, color-mix(in oklab, var(--nav-accent) 88%, white), color-mix(in oklab, var(--nav-accent) 100%, black 22%))",
            }}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.shortTitle ?? item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarNav({
  className,
  collapsed = false,
  onNavigate,
  mobile = false,
  scrollToActive = false,
}: {
  className?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
  scrollToActive?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const { hasPermission, user } = useAuth();
  const isPlatformStaff = Boolean(user?.platformRole);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const visible = React.useCallback(
    (items: NavItem[]) =>
      items
        .map((item) => visibleNavItem(item, hasPermission, isPlatformStaff))
        .filter((item): item is NavItem => item !== null),
    [hasPermission, isPlatformStaff],
  );
  const primary = visible(primaryNav);
  const tools = visible(secondaryNav);
  const comingSoon = visible(comingSoonNav);
  const platform = visible(platformNav);
  const settings = visibleNavItem(settingsNav, hasPermission, isPlatformStaff);
  const actions = visible(quickActions);

  // What the person opened or closed. A group they never touched is open
  // exactly when it holds the page they are on.
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() =>
    typeof window === "undefined" ? {} : readOpenGroups(),
  );

  const isOpen = (item: NavItem) => {
    const chosen = openGroups[item.title];
    if (chosen !== undefined) return chosen;
    return activeChildHref(pathname, item.children ?? []) !== null;
  };

  const toggle = (item: NavItem) =>
    setOpenGroups((current) => {
      const next = { ...current, [item.title]: !isOpen(item) };
      writeOpenGroups(next);
      return next;
    });

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const groupChildren = item.children ?? [];
      // A group the user can see only one page of is just that page.
      if (groupChildren.length === 1) {
        const only = groupChildren[0];
        return (
          <LeafLink
            key={item.title}
            item={{ ...only, hue: item.hue ?? only.hue, accent: item.accent ?? only.accent }}
            active={isNavItemActive(pathname, only.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        );
      }
      if (groupChildren.length > 1) {
        return collapsed ? (
          <RailGroup key={item.title} item={item} pathname={pathname} />
        ) : (
          <NavGroup
            key={item.title}
            item={item}
            pathname={pathname}
            open={isOpen(item)}
            onToggle={() => toggle(item)}
            onNavigate={onNavigate}
          />
        );
      }
      return (
        <LeafLink
          key={item.title}
          item={item}
          active={isNavItemActive(pathname, item.href)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      );
    });

  // On a phone, open the drawer at the page you are on.
  React.useEffect(() => {
    if (!mobile || !scrollToActive || collapsed) return;
    const frame = window.requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector<HTMLElement>('[aria-current="page"]')
        ?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobile, scrollToActive, collapsed, pathname]);

  return (
    <nav aria-label="Primary" className={cn("relative flex h-full min-h-0 flex-col text-sidebar-foreground", className)}>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        title={collapsed ? PRODUCT_LOGO_ALT : undefined}
        className={cn(
          "group relative mb-3 flex shrink-0 items-center overflow-hidden rounded-2xl px-2 py-2 transition-all duration-200 hover:bg-sidebar-accent",
          collapsed ? "justify-center px-1.5" : "gap-2.5",
        )}
      >
        <span aria-hidden="true" className="flex h-10 shrink-0 items-center justify-center">
          <BrandLogo decorative priority className={collapsed ? "h-7" : "h-9"} />
        </span>
        {!collapsed ? (
          <span className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.02em] text-sidebar-foreground">
            {PRODUCT_NAME}
          </span>
        ) : null}
      </Link>

      {!collapsed ? <QuickActions items={actions} onNavigate={onNavigate} /> : null}

      <div
        ref={scrollRef}
        data-mobile-nav-section={mobile ? "true" : undefined}
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain pb-2 [scrollbar-width:thin]"
      >
        {!collapsed ? <SectionLabel>Workspace</SectionLabel> : null}
        {renderItems(primary)}

        {tools.length > 0 ? (
          <div className="mt-3 flex shrink-0 flex-col gap-0.5 border-t border-sidebar-border pt-3">
            {!collapsed ? <SectionLabel>Tools</SectionLabel> : null}
            {renderItems(tools)}
          </div>
        ) : null}

        {comingSoon.length > 0 ? (
          <div className="mt-3 flex shrink-0 flex-col gap-0.5 opacity-80">
            {!collapsed ? <SectionLabel>Coming soon</SectionLabel> : null}
            {renderItems(comingSoon)}
          </div>
        ) : null}

        {/* Running the product is not part of running a gym, and nobody
            outside platform staff ever sees it. */}
        {platform.length > 0 ? (
          <div className="mt-3 flex shrink-0 flex-col gap-0.5 border-t border-sidebar-border pt-3">
            {!collapsed ? <SectionLabel>Platform</SectionLabel> : null}
            {renderItems(platform)}
          </div>
        ) : null}

        {/* Inside the scroll area: opened, Settings lists six pages, and a
            fixed footer would push them off a short screen. */}
        {settings ? (
          <div className="mt-auto flex shrink-0 flex-col gap-0.5 border-t border-sidebar-border pt-2">
            {renderItems([settings])}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
