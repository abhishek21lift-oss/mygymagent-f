"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { accentForPath } from "@/lib/section-accent";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, secondaryNav, comingSoonNav, platformNav, settingsNav, isNavItemActive, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_SRC, PRODUCT_NAME } from "@/lib/brand";

/**
 * One destination in the rail.
 *
 * The icon tile carries the hue of the section the link goes to — the
 * same hue that page's masthead, canvas, tables and stat tiles will
 * wear once you are there. That turns the sidebar into the legend for
 * the colour system rather than a second place it is merely applied:
 * twenty-odd grey glyphs become eight colour families, and you learn
 * where Finance is by its warmth before you learn where it is in the
 * list.
 *
 * `--nav-ink` does the drawing, not `--nav-accent`. The rail is frosted
 * glass and therefore theme-aware, so the glyph has to be legible on a
 * pale pane AND on a deep one. The `solid` step clears 3:1 on the deep
 * pane and 2.2:1 on the pale one — amber's number — while the `ink`
 * step is already solved to clear 6:1 on its own surface and flips
 * with the theme. See the note beside those tokens in globals.css.
 */
function NavLink({
  item,
  active,
  nested = false,
  collapsed = false,
  onNavigate,
  itemRef,
}: {
  item: NavItem;
  active: boolean;
  nested?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  itemRef?: React.RefObject<HTMLAnchorElement | null>;
}) {
  const Icon = item.icon;
  const isAi = item.accent === "ai";

  return (
    <Link
      ref={itemRef}
      // `undefined`, not a string: React omits the attribute entirely,
      // so the AI item inherits the shell's section hue rather than
      // being pinned to whatever route it was last on.
      data-nav-accent={isAi ? "ai" : accentForPath(item.href)}
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      aria-label={collapsed ? item.title : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 touch-manipulation items-center overflow-hidden rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2",
        collapsed ? "justify-center px-2 py-2.5" : nested ? "ml-3 gap-2.5 px-3 py-2 text-[13px]" : "gap-3 px-2.5 py-2 text-sm",
        active
          ? "font-semibold text-sidebar-foreground"
          : "font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
      style={
        isAi
          ? undefined
          : {
              // Selected: the hue at a strength that reads as a
              // selection, not as a filled button. Resting: nothing —
              // an unselected row tinted in eight different colours
              // would make the rail a paint chart, and colour here is
              // only carrying information once you are IN the section.
              background: active
                ? "color-mix(in oklab, var(--nav-accent) 16%, transparent)"
                : undefined,
            }
      }
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-2.5 left-0 w-1 rounded-r-full"
          style={{ background: "var(--nav-accent)" }}
        />
      ) : null}

      <span
        aria-hidden="true"
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl transition-all duration-200",
          nested ? "size-7" : "size-9",
          // The AI group is not a route section, so it keeps the brand
          // gradient rather than borrowing a page hue.
          isAi && "ai-glyph",
        )}
        style={
          isAi
            ? undefined
            : {
                background: active
                  ? "color-mix(in oklab, var(--nav-accent) 20%, transparent)"
                  : "color-mix(in oklab, var(--nav-accent) 10%, transparent)",
                color: active ? "var(--nav-ink)" : "var(--nav-accent)",
              }
        }
      >
        <Icon className={cn(nested ? "size-3.5" : "size-[1.05rem]", "shrink-0")} aria-hidden="true" />
      </span>

      {!collapsed ? (
        <>
          <span className="flex-1 truncate tracking-[-0.01em]">{item.title}</span>
          {isAi && !nested ? (
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: "var(--ai)" }}
            />
          ) : null}
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

function permissionVisible(
  item: NavItem,
  hasPermission: (permission: string | string[]) => boolean,
  isPlatformStaff: boolean,
) {
  // A platform-only item is gated on User.platformRole, which no RBAC
  // permission can stand in for.
  if (item.platformOnly && !isPlatformStaff) return false;
  return !item.permission || hasPermission(item.permission);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-muted">
        {children}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-sidebar-border" />
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
  const pathname = usePathname();
  const { hasPermission, user } = useAuth();
  const isPlatformStaff = Boolean(user?.platformRole);
  const activeRef = React.useRef<HTMLAnchorElement | null>(null);
  const visiblePrimary = primaryNav.filter((item) => permissionVisible(item, hasPermission, isPlatformStaff));
  const visibleSecondary = secondaryNav.filter((item) => permissionVisible(item, hasPermission, isPlatformStaff));
  const visibleComingSoon = comingSoonNav.filter((item) => permissionVisible(item, hasPermission, isPlatformStaff));
  const showSettings = permissionVisible(settingsNav, hasPermission, isPlatformStaff);
  const visiblePlatform = platformNav.filter((item) => permissionVisible(item, hasPermission, isPlatformStaff));

  /** One renderer for both lists: the markup is identical, and the only
   * thing that differed was which array it looped over. */
  const renderGroup = (items: NavItem[]) =>
    items.map((item, index) => {
      const children = (item.children ?? []).filter((child) =>
        permissionVisible(child, hasPermission, isPlatformStaff),
      );
      const active =
        isNavItemActive(pathname, item.href) ||
        children.some((child) => isNavItemActive(pathname, child.href));
      const isAi = item.accent === "ai";
      // The rule heads the AI group, so it belongs to the first AI item
      // only — rendering it per item printed the label twice.
      const startsAiGroup = isAi && items[index - 1]?.accent !== "ai";
      return (
        <div
          key={item.href}
          data-mobile-nav-section={mobile ? "true" : undefined}
          className={cn("shrink-0", startsAiGroup && !collapsed && "mt-1")}
        >
          <NavLink
            item={item}
            active={active}
            collapsed={collapsed}
            onNavigate={onNavigate}
            itemRef={mobile && !collapsed && active ? activeRef : undefined}
          />
          {!collapsed && active && children.length > 0 ? (
            <ul
              aria-label={`${item.title} sub-pages`}
              className="mb-2 ml-4 mt-1 space-y-0.5 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-1"
            >
              {children.map((child) => (
                <li key={child.href}>
                  <NavLink item={child} active={isNavItemActive(pathname, child.href)} nested onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    });

  React.useEffect(() => {
    if (!mobile || !scrollToActive || collapsed) return;
    const frame = window.requestAnimationFrame(() => {
      activeRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobile, scrollToActive, collapsed, pathname]);

  return (
    <nav
      aria-label="Primary"
      className={cn("relative flex h-full min-h-0 flex-col text-sidebar-foreground", className)}
    >
      <Link
        href="/dashboard"
        onClick={onNavigate}
        title={collapsed ? PRODUCT_LOGO_ALT : undefined}
        className={cn(
          "group relative mb-4 flex shrink-0 items-center overflow-hidden rounded-2xl px-2 py-2 transition-all duration-200 hover:bg-sidebar-accent",
          collapsed ? "justify-center px-1.5" : "gap-2.5",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
        >
          <Image
            src={PRODUCT_LOGO_SRC}
            alt={PRODUCT_LOGO_ALT}
            width={96}
            height={96}
            className="size-10 shrink-0 rounded-full object-contain"
            priority
          />
        </span>
        {/* The mark carries its own wordmark, but not legibly at 40px --
            the old square logo was mostly type, this one is mostly art. So
            the name is set beside it whenever there is room for it. */}
        {!collapsed ? (
          <span className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.02em] text-sidebar-foreground">
            {PRODUCT_NAME}
          </span>
        ) : null}
      </Link>

      {!collapsed ? <SectionLabel>Workspace</SectionLabel> : null}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pb-2">
        {renderGroup(visiblePrimary)}

        {visibleSecondary.length > 0 ? (
          <div className="mt-4 shrink-0 border-t border-sidebar-border pt-3">
            {!collapsed ? <SectionLabel>Tools</SectionLabel> : null}
            {renderGroup(visibleSecondary)}
          </div>
        ) : null}

        {!collapsed && visibleComingSoon.length > 0 ? (
          <div className="mt-4 shrink-0">
            <SectionLabel>Coming soon</SectionLabel>
            <div className="space-y-1 opacity-80">
              {visibleComingSoon.map((item) => (
                <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ) : null}
        {collapsed
          ? visibleComingSoon.map((item) => (
              <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} collapsed onNavigate={onNavigate} />
            ))
          : null}

        {/* Last, under its own rule: running the product is not part of
            running a gym, and nobody outside platform staff ever sees it. */}
        {visiblePlatform.length > 0 ? (
          <div className="mt-4 shrink-0 border-t border-sidebar-border pt-3">
            {!collapsed ? <SectionLabel>Platform</SectionLabel> : null}
            {renderGroup(visiblePlatform)}
          </div>
        ) : null}
      </div>

      <div className="mt-3 shrink-0 border-t border-sidebar-border pt-3">
        {showSettings ? (
          <NavLink
            item={settingsNav}
            active={isNavItemActive(pathname, settingsNav.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>
    </nav>
  );
}
