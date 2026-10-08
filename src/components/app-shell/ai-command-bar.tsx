"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command, CornerDownLeft, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const suggestions = [
  "What needs my attention today?",
  "Show members likely to churn",
  "Why did revenue change this month?",
  "Which leads should I follow up with?",
];

export function AICommandBar() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listId = React.useId();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const router = useRouter();

  const filtered = suggestions.filter(
    (item) => !query || item.toLowerCase().includes(query.toLowerCase()),
  );

  const openDialog = React.useCallback(() => {
    setActiveIndex(0);
    setOpen(true);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        triggerRef.current?.focus();
        openDialog();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openDialog]);

  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      setQuery("");
      triggerRef.current?.focus();
    }
    return undefined;
  }, [open]);

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && filtered[activeIndex]) {
      setQuery(filtered[activeIndex]);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        className={cn(
          "group flex min-h-11 w-11 shrink-0 touch-manipulation items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface-sunken px-2 text-left text-sm text-muted-foreground transition-all duration-200",
          "hover:border-border-strong hover:bg-card sm:w-full sm:max-w-xl sm:justify-start sm:px-3",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
        aria-label="Open AI command center (Control or Command K)"
        aria-haspopup="dialog"
      >
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundImage: "var(--brand-grad)",
            color: "#ffffff",
          }}
        >
          <Sparkles className="size-3.5" />
        </span>
        <span className="hidden flex-1 truncate sm:inline">Search your gym…</span>
        <kbd className="hidden shrink-0 rounded-lg border border-border bg-card px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[rgb(8_10_20/0.5)] p-4 pt-[10vh]-[6px] sm:p-6 sm:pt-[12vh]"
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="THE CULT CLIENT AI command center"
            // Opaque, not glass. Vibrancy is spent on the chrome that
            // stays on screen (the rail, the top bar, the drawer), where
            // the content behind is scenery. Here the content behind is
            // a dense table, and a translucent panel over it smears the
            // rows into the prompt list — the one place in the app
            // where legibility has to win outright.
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-float)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundImage: "var(--brand-grad)", color: "#ffffff" }}
              >
                <Sparkles className="size-4" />
              </span>
              <label htmlFor="ai-command-input" className="sr-only">
                Ask THE CULT CLIENT
              </label>
              <Input
                ref={inputRef}
                id="ai-command-input"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search members, revenue, churn…"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={filtered.length ? `${listId}-${activeIndex}` : undefined}
                aria-autocomplete="list"
                className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-xl"
                onClick={() => setOpen(false)}
                aria-label="Close AI command center"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="p-3 sm:p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Suggested prompts
              </p>
              {filtered.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No matching prompts. Press Enter to ask anyway.
                </p>
              ) : (
                <ul id={listId} role="listbox" aria-label="Suggested prompts" className="grid gap-1.5 sm:grid-cols-2">
                  {filtered.map((item, index) => (
                    <li key={item} role="option" id={`${listId}-${index}`} aria-selected={index === activeIndex}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onFocus={() => setActiveIndex(index)}
                        onClick={() => setQuery(item)}
                        className={cn(
                          "group flex min-h-12 w-full touch-manipulation items-center gap-2 rounded-2xl border px-3.5 py-3 text-left text-sm transition-all duration-200",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          index === activeIndex
                            ? "border-transparent font-medium text-accent-foreground"
                            : "border-border text-foreground hover:bg-surface-hover",
                        )}
                        style={
                          index === activeIndex
                            ? { background: "var(--accent)" }
                            : undefined
                        }
                      >
                        <CornerDownLeft
                          aria-hidden="true"
                          className={cn(
                            "size-3.5 shrink-0 transition-opacity",
                            index === activeIndex ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="min-w-0 flex-1">{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-border bg-surface-sunken px-4 py-2.5 text-xs text-muted-foreground">
              <Command className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Press Ctrl/⌘ K anytime · Esc to close</span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/ai");
                }}
                className="ml-auto hidden shrink-0 rounded-lg px-2 py-1 font-semibold text-foreground transition-colors hover:bg-surface-hover sm:inline"
              >
                Open agent
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
