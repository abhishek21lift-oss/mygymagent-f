"use client"

import * as React from "react"
import { Search, ChevronRight, Users, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLeads, useLead } from "@/lib/hooks/use-leads"
import type { Lead } from "@/lib/types/gym"

interface LeadSelectionStepProps {
  onSelectLead: (lead: Lead) => void
  onSkip: () => void
}

export function LeadSelectionStep({ onSelectLead, onSkip }: LeadSelectionStepProps) {
  const [search, setSearch] = React.useState("")
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null)

  const leadsQuery = useLeads({
    page: 1,
    pageSize: 20,
    search: search.length >= 2 ? search : undefined,
  })

  const selectedLead = useLead(selectedLeadId ?? null)

  function handleSelectLead(lead: Lead) {
    setSelectedLeadId(lead.id)
  }

  function handleContinue() {
    if (selectedLead.data) {
      onSelectLead(selectedLead.data)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[20px] border border-violet-100/70 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/60 p-4">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-violet-700">
          <Sparkles className="size-3.5" aria-hidden="true" /> Convert a lead — optional
        </p>
        <p className="mt-1 text-xs font-medium leading-5 text-stone-600">Pick an existing lead to pre-fill the wizard, or skip to create a fresh member.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <label htmlFor="lead-search" className="sr-only">Search leads</label>
          <Input
            id="lead-search"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-2xl border-stone-200/80 bg-white/80 pl-10 focus-visible:ring-violet-500/20"
          />
        </div>
      </div>

      {leadsQuery.isLoading ? (
        <div className="space-y-2" aria-label="Loading leads">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[20px] bg-gradient-to-r from-violet-50 to-cyan-50" />
          ))}
        </div>
      ) : leadsQuery.data?.items.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-violet-200 bg-violet-50/40 px-5 py-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-extrabold text-stone-900">No leads found</p>
          <p className="mt-1 text-xs font-medium text-stone-600">Try another search, or start fresh.</p>
          <Button variant="outline" className="mt-4 min-h-11 rounded-2xl" onClick={onSkip}>
            Create fresh member instead
          </Button>
        </div>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {leadsQuery.data?.items.map((lead) => (
            <Card
              key={lead.id}
              className={`cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-md ${
                selectedLeadId === lead.id
                  ? "border-violet-300 bg-gradient-to-r from-violet-50 to-cyan-50 shadow-md"
                  : "border-stone-200/70 bg-white/80 hover:border-violet-200"
              }`}
              onClick={() => handleSelectLead(lead)}
            >
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] font-black text-white shadow-md ${selectedLeadId === lead.id ? "bg-gradient-to-br from-violet-600 to-cyan-500" : "bg-gradient-to-br from-stone-400 to-stone-500"}`} aria-hidden="true">
                      {lead.firstName?.[0]}{lead.lastName?.[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-stone-900">{lead.firstName} {lead.lastName}</p>
                      <p className="truncate text-xs font-medium text-stone-600">
                        {lead.email || lead.phone || "No contact"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 rounded-full">{lead.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedLeadId && (
        <div className="flex justify-end">
          <Button onClick={handleContinue} disabled={selectedLead.isLoading} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-5 font-extrabold shadow-lg shadow-violet-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
            {selectedLead.isLoading ? "Loading lead..." : <>Continue with selected lead <ChevronRight className="size-4" aria-hidden="true" /></>}
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button variant="ghost" onClick={onSkip} className="min-h-11 rounded-2xl font-bold text-stone-600 hover:text-stone-950">
          Skip - Create fresh member
        </Button>
      </div>
    </div>
  )
}
