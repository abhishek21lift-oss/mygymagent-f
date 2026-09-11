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

/* Literal hover tints — one vivid hue per suggestion tile. */
const SUGGESTION_HOVER = [
  "hover:border-violet-200 hover:bg-violet-50/70 hover:text-violet-800",
  "hover:border-rose-200 hover:bg-rose-50/70 hover:text-rose-800",
  "hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-800",
  "hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-cyan-800",
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
        className="group hidden min-h-11 w-full max-w-xl items-center gap-3 rounded-[19px] border border-white/90 bg-white/85 px-3 py-2 text-left text-sm font-medium text-stone-600 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-px hover:border-violet-200 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 md:flex dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:border-violet-400/30"
        aria-label="Open MyGymAgent AI command center"
      >
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3">
          <Sparkles className="size-4" />
        </span>
        <span className="flex-1 truncate">Ask MyGymAgent anything...</span>
        <kbd className="hidden shrink-0 rounded-full border border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-2 py-1 text-[10px] font-black text-violet-700 lg:inline dark:border-white/10 dark:from-white/10 dark:to-white/5 dark:text-violet-200">
          ⌘ K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/30 p-4 pt-[12vh] backdrop-blur-sm sm:p-6 sm:pt-[14vh]" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="MyGymAgent AI command center"
            className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/90 bg-white/95 shadow-[0_35px_110px_-48px_rgba(79,70,229,.65)] backdrop-blur-xl dark:border-white/10 dark:bg-card/95"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />
            <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 dark:border-white/10">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
                <Sparkles className="size-5" />
              </span>
              <Search className="size-4 shrink-0 text-stone-600" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search, analyse or take action..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-950 outline-none placeholder:text-stone-600 dark:text-white dark:placeholder:text-stone-300"
              />
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="p-3 sm:p-4">
              <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-stone-600 dark:text-stone-300">
                Suggested
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestions
                  .filter((item) => !query || item.toLowerCase().includes(query.toLowerCase()))
                  .map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className={cn(
                        "min-h-11 rounded-[19px] border border-stone-200/70 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-stone-900 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-100",
                        SUGGESTION_HOVER[index % SUGGESTION_HOVER.length],
                      )}
                    >
                      {item}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-violet-100/70 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/60 px-4 py-3 text-[11px] font-medium text-stone-600 dark:border-white/10 dark:from-white/5 dark:via-transparent dark:to-transparent dark:text-stone-300">
              <Command className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Press Ctrl/⌘ K anytime</span>
              <span className="ml-auto hidden sm:inline">AI actions will require appropriate approval</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
