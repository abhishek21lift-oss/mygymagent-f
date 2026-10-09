"use client"

import * as React from "react"
import { Search, Sparkles, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useLeads } from "@/lib/hooks/use-leads"
import type { Lead } from "@/lib/types/gym"

/**
 * "Joining from an enquiry?" -- find the open lead by name or phone and
 * start from its details. Choosing one also closes the lead as won when
 * the member is saved, so the enquiry doesn't sit in the pipeline.
 */
export function LeadPicker({
  lead,
  onChange,
}: {
  lead: Lead | null
  onChange: (lead: Lead | null) => void
}) {
  const [search, setSearch] = React.useState("")
  const term = search.trim()
  const leads = useLeads(
    { page: 1, pageSize: 5, search: term, openOnly: true },
    { enabled: term.length >= 2 && !lead },
  )

  if (lead) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm">
          From enquiry:{" "}
          <span className="font-semibold">
            {lead.firstName} {lead.lastName}
          </span>
          {lead.phone ? <span className="text-muted-foreground"> · {lead.phone}</span> : null}
        </p>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          aria-label="Don't use this enquiry"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  const items = leads.data?.items ?? []
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Joining from an enquiry? Search name or phone"
        aria-label="Search enquiries"
        className="pl-9"
      />
      {term.length >= 2 ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {leads.isLoading ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">No open enquiry matches “{term}”.</p>
          ) : (
            <ul role="listbox" aria-label="Matching enquiries">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      onChange(item)
                      setSearch("")
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface-hover"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {item.firstName} {item.lastName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.phone ?? item.email ?? item.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
