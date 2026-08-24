"use client";

import * as React from "react";
import { Command, Search, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const suggestions = [
  "What needs my attention today?",
  "Show members likely to churn",
  "Why did revenue change this month?",
  "Which leads should I follow up with?",
];

export function AICommandBar() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden h-9 w-full max-w-xl items-center gap-3 rounded-xl border border-border/70 bg-muted/50 px-3 text-left text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-background hover:shadow-md md:flex"
        aria-label="Open MyGymAgent AI command center"
      >
        <Sparkles className="size-4 text-primary transition-transform group-hover:rotate-6" />
        <span className="flex-1">Ask MyGymAgent anything...</span>
        <kbd className="hidden rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
          ⌘ K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 p-4 pt-[12vh] backdrop-blur-sm sm:p-6 sm:pt-[14vh]" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="MyGymAgent AI command center"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl shadow-primary/10"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Sparkles className="size-5 text-primary" />
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search, analyse or take action..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-3">
              <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Suggested
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                {suggestions
                  .filter((item) => !query || item.toLowerCase().includes(query.toLowerCase()))
                  .map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className={cn(
                        "rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      {item}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
              <Command className="size-3.5" />
              <span>Press Ctrl/⌘ K anytime</span>
              <span className="ml-auto">AI actions will require appropriate approval</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
