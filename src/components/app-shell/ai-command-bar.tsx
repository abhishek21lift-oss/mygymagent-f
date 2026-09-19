"use client";

import * as React from "react";
import { Command, Search, Sparkles, X } from "lucide-react";

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
        className="group flex min-h-11 w-11 shrink-0 items-center justify-center gap-3 rounded-[12px] border border-[#4a360f] bg-gradient-to-b from-[#ffedb0] via-[#d9b45a] to-[#8a6420] px-2 text-left text-sm font-bold text-[#241a08] shadow-[inset_0_1px_0_rgba(255,250,220,0.95),inset_0_-2px_4px_rgba(70,45,10,0.5),0_3px_0_#241a08,0_8px_18px_rgba(0,0,0,0.4)] transition-all duration-150 hover:brightness-105 active:translate-y-[2px] active:shadow-[inset_0_2px_6px_rgba(40,25,10,0.5)] sm:w-full sm:max-w-xl sm:justify-start sm:px-3 sm:py-2"
        style={{ textShadow: "0 1px 0 rgba(255,245,200,0.9)" }}
        aria-label="Open MyGymAgent AI command center"
      >
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-[#241a08] bg-gradient-to-b from-[#3a2c1a] to-[#170e07] text-[#ffe9a8] shadow-[inset_0_1px_3px_rgba(0,0,0,0.9),0_1px_0_rgba(255,245,200,0.5)] transition-transform duration-200 group-hover:scale-105">
          <Sparkles className="size-4" />
        </span>
        <span className="hidden flex-1 truncate sm:inline">Ask MyGymAgent anything...</span>
        <kbd className="hidden shrink-0 rounded-[7px] border border-[#241a08] bg-gradient-to-b from-[#2b2114] to-[#170e07] px-2 py-1 font-mono text-[10px] font-black text-[#ffe9a8] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] lg:inline">
          ⌘ K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#140c06]/75 p-4 pt-[12vh] backdrop-blur-[3px] sm:p-6 sm:pt-[14vh]" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="MyGymAgent AI command center"
            className="skeuo-plate w-full max-w-2xl overflow-hidden rounded-[14px] border-[3px] border-[#6b5226] shadow-[0_0_0_6px_rgba(43,30,16,0.9),0_30px_80px_rgba(0,0,0,0.65)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* brass nameplate header */}
            <div className="flex items-center gap-1 border-b border-[#5c4f38] bg-gradient-to-b from-[#3a2c1a] to-[#241a0e] px-2 py-1.5">
              <span aria-hidden="true" className="ml-1 size-2.5 rounded-full border border-black bg-gradient-to-b from-[#ff8a7a] to-[#7a1a14] shadow-[0_0_6px_rgba(255,80,60,0.8)]" />
              <span aria-hidden="true" className="size-2.5 rounded-full border border-black bg-gradient-to-b from-[#ffe9a8] to-[#8a6420] shadow-[0_0_6px_rgba(255,200,80,0.7)]" />
              <span aria-hidden="true" className="size-2.5 rounded-full border border-black bg-gradient-to-b from-[#bfe6c4] to-[#2a5a35] shadow-[0_0_6px_rgba(80,255,140,0.6)]" />
              <span className="ml-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#c9a44f]" style={{ textShadow: "0 -1px 0 #000" }}>Intercom &bull; AI Command</span>
            </div>
            <div className="flex items-center gap-3 border-b border-[#8a7550] bg-gradient-to-b from-[#efe6cc] to-[#d9cba4] px-4 py-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#4a360f] bg-gradient-to-b from-[#ffedb0] to-[#8a6420] text-[#241a08] shadow-[inset_0_1px_0_rgba(255,250,220,0.9),0_2px_0_#3a2a0c]">
                <Sparkles className="size-5" />
              </span>
              <Search className="size-4 shrink-0 text-[#5c4f38]" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Speak into the brass tube..."
                className="skeuo-inset min-w-0 flex-1 rounded-[9px] px-3 py-2 text-sm font-bold text-[#2b2114] outline-none placeholder:text-[#6b5732]"
              />
              <Button variant="ghost" size="icon" className="min-h-10 min-w-10 rounded-[9px]" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="bg-gradient-to-b from-[#f7f0da] to-[#e0d3ae] p-3 sm:p-4">
              <div className="skeuo-embossed-label mb-2 inline-block rounded-[7px] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                Suggested transmissions
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestions
                  .filter((item) => !query || item.toLowerCase().includes(query.toLowerCase()))
                  .map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="min-h-11 rounded-[10px] border border-[#5c4f38] bg-gradient-to-b from-[#fffdf2] via-[#e8ddbd] to-[#b7a87f] px-4 py-3 text-left text-sm font-bold text-[#2e2313] shadow-[inset_0_1px_0_#fff,0_3px_0_#4a3f2a,0_6px_12px_rgba(0,0,0,0.3)] transition-all duration-150 hover:brightness-105 hover:-translate-y-px active:translate-y-[2px] active:shadow-[inset_0_2px_6px_rgba(40,25,10,0.5)]"
                      style={{ textShadow: "0 1px 0 rgba(255,255,255,0.7)" }}
                    >
                      {item}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-[#5c4f38] bg-gradient-to-b from-[#3a2c1a] to-[#241a0e] px-4 py-2.5 text-[11px] font-bold text-[#c9b586]">
              <Command className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Press Ctrl/⌘ K anytime</span>
              <span className="ml-auto hidden sm:inline">Vacuum-tube AI &bull; approval required</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
