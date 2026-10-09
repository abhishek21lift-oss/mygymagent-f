"use client";

import { Bell, ChevronDown, Menu, Moon, Search, Settings } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * The trainer surface's top bar.
 *
 * The reference's bar is white and nearly weightless: a tinted square
 * behind the menu icon, three quiet outline icons, then a small
 * gradient avatar. It is reproduced here without the iOS status bar
 * above it -- that is the device's own chrome, not something a web
 * surface should draw, and faking it would double-count the notch on a
 * real phone.
 */
export function TrainerTopBar() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    "AB";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--t-line)] bg-white/85">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
        <button
          type="button"
          aria-label="Open menu"
          className="grid size-11 place-items-center rounded-xl bg-[#e8f0fe] text-[#1a73e8] transition-transform active:scale-95"
        >
          <Menu className="size-6" strokeWidth={2.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Search"
          className="grid size-11 place-items-center rounded-xl text-[var(--t-ink-muted)] transition-transform active:scale-95"
        >
          <Search className="size-6" strokeWidth={2.25} aria-hidden="true" />
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <IconButton
            label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Moon className="size-[1.375rem]" strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton label="Settings">
            <Settings className="size-[1.375rem]" strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton label="Notifications">
            <Bell className="size-[1.375rem]" strokeWidth={2} aria-hidden="true" />
          </IconButton>

          <button
            type="button"
            className="ml-1 flex items-center gap-1 rounded-full"
            aria-label={`Account: ${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
          >
            <span
              data-gradient
              className="grid size-10 place-items-center rounded-full text-[0.9375rem] font-extrabold text-white"
              style={{
                backgroundImage: "linear-gradient(140deg, #10b981, #059669)",
              }}
            >
              {initials}
            </span>
            <ChevronDown className="size-4 text-[var(--t-ink-faint)]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-11 place-items-center rounded-xl text-[var(--t-ink-muted)] transition-transform active:scale-95",
      )}
    >
      {children}
    </button>
  );
}
