"use client";

import * as React from "react";
import { Command, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

 const filtered = suggestions.filter((item) => !query || item.toLowerCase().includes(query.toLowerCase()));

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
  } else if (wasOpen.current) {
   wasOpen.current = false;
   setQuery("");
   triggerRef.current?.focus();
  }
 }, [open ]);

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
    className="group flex min-h-10 w-11 shrink-0 items-center justify-center gap-3 rounded-lg border bg-card px-2 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring sm:w-full sm:max-w-xl sm:justify-start sm:px-3"
    aria-label="Open AI command center (Control or Command K)"
    aria-haspopup="dialog"
   >
    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
     <Sparkles className="size-4" />
    </span>
    <span className="hidden flex-1 truncate sm:inline">Ask THE CULT CLIENT anything...</span>
    <kbd className="hidden shrink-0 rounded-md border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground lg:inline">
     ⌘K
    </kbd>
   </button>

   {open && (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] sm:p-6 sm:pt-[14vh]" onMouseDown={() => setOpen(false)}>
     <div
      role="dialog"
      aria-modal="true"
      aria-label="THE CULT CLIENT AI command center"
      className="w-full max-w-2xl overflow-hidden rounded-xl border bg-card shadow-xl"
      onMouseDown={(event) => event.stopPropagation()}
     >
      <div className="flex items-center gap-2 border-b px-4 py-3">
       <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="size-4" />
       </span>
       <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
       <label htmlFor="ai-command-input" className="sr-only">Ask THE CULT CLIENT</label>
       <Input
        ref={inputRef}
        id="ai-command-input"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
        onKeyDown={onInputKeyDown}
        placeholder="Ask about members, revenue, churn..."
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={filtered.length ? `${listId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        className="border-0 shadow-none focus-visible:ring-0"
       />
       <Button variant="ghost" size="icon" className="min-h-10 min-w-10" onClick={() => setOpen(false)} aria-label="Close AI command center">
        <X className="size-4" aria-hidden="true" />
       </Button>
      </div>

      <div className="p-3 sm:p-4">
       <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Suggested prompts
       </p>
       {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No matching prompts. Press Enter to ask anyway.</p>
       ) : (
        <ul id={listId} role="listbox" aria-label="Suggested prompts" className="grid gap-2 sm:grid-cols-2">
         {filtered.map((item, index) => (
          <li key={item} role="option" id={`${listId}-${index}`} aria-selected={index === activeIndex}>
           <button
            type="button"
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setQuery(item)}
            className={`min-h-11 w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring ${index === activeIndex ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent"}`}
           >
            {item}
           </button>
          </li>
         ))}
        </ul>
       )}
      </div>

      <div className="flex items-center gap-2 border-t bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
       <Command className="size-3.5 shrink-0" aria-hidden="true" />
       <span>Press Ctrl/⌘ K anytime · Esc to close</span>
       <span className="ml-auto hidden sm:inline">AI drafts require approval</span>
      </div>
     </div>
    </div>
   )}
  </>
 );
}
