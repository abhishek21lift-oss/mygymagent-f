"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  href?: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  member: "Member",
  lead: "Lead",
  product: "Product",
  invoice: "Invoice",
};

/**
 * The topbar search box: a real input, focusable and typable directly —
 * no modal on the click path. Live member/name/contact results come from
 * the existing org-scoped `GET /search` endpoint (same contract as the
 * full /search page); Enter opens that page for the whole result set.
 */
export function TopbarSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  // Enter opens the full search page unless the highlight was moved
  // with the arrow keys, in which case it opens that result.
  const [highlightMoved, setHighlightMoved] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  // Debounced so each keystroke is not its own request.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(q.trim().replace(/\s+/g, " "));
      setActiveIndex(0);
      setHighlightMoved(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [q]);

  const search = useQuery({
    queryKey: ["global-search", term],
    queryFn: () => api.get<{ query: string; results: SearchResult[] }>("/search", { query: { q: term } }),
    enabled: term.length >= 2,
    retry: 1,
    staleTime: 30_000,
  });

  // Stale guard: the API echoes the query it answered, so a slow older
  // request can never overwrite results for what is typed now.
  const fresh = search.data && search.data.query === term ? search.data.results : null;
  const results = fresh ?? [];
  const searchable = term.length >= 2;
  const showList = open && (searchable || q.trim().length > 0);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function submit() {
    const query = (term || q.trim()).replace(/\s+/g, " ");
    if (!query) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown" && fresh?.length) {
      event.preventDefault();
      setHighlightMoved(true);
      setActiveIndex((i) => Math.min(i + 1, fresh.length - 1));
    } else if (event.key === "ArrowUp" && fresh?.length) {
      event.preventDefault();
      setHighlightMoved(true);
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (highlightMoved && fresh?.[activeIndex]?.href) go(fresh[activeIndex].href as string);
      else submit();
    }
  }

  return (
    <div
      ref={boxRef}
      className="relative w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <label htmlFor="topbar-search-input" className="sr-only">
        Search members, leads, products and invoices
      </label>
      <Input
        id="topbar-search-input"
        value={q}
        onChange={(event) => {
          setQ(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search members…"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={fresh?.length ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        className="h-11 rounded-2xl border-border bg-surface-sunken pl-9 pr-9 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      {q ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQ("");
            setTerm("");
          }}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-float)]"
        >
          {!searchable ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Type at least 2 characters.</p>
          ) : search.isFetching && !fresh ? (
            <p className="px-4 py-3 text-sm text-muted-foreground" role="status">
              Searching…
            </p>
          ) : search.isError ? (
            <p role="alert" className="px-4 py-3 text-sm font-medium text-destructive">
              Search failed — try again.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No matches for &ldquo;{term}&rdquo;. Press Enter for the full search page.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {results.map((r, index) => (
                <li
                  key={`${r.type}-${r.id}`}
                  role="option"
                  id={`${listId}-${index}`}
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => (r.href ? go(r.href) : submit())}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                      "focus-visible:outline-2 focus-visible:outline-ring",
                      index === activeIndex ? "bg-surface-hover" : undefined,
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.title}</span>
                      {r.subtitle ? (
                        <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold uppercase text-muted-foreground">
                      {TYPE_LABEL[r.type] ?? r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
