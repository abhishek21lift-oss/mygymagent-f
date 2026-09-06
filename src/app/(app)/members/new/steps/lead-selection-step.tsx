"use client"

import * as React from "react"
import { Search, ChevronRight } from "lucide-react"
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {leadsQuery.isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
      ) : leadsQuery.data?.items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No leads found</p>
          <Button variant="outline" onClick={onSkip}>
            Create fresh member instead
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leadsQuery.data?.items.map((lead) => (
            <Card
              key={lead.id}
              className={`cursor-pointer transition-colors ${
                selectedLeadId === lead.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => handleSelectLead(lead)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.email || lead.phone || "No contact"}
                    </p>
                  </div>
                  <Badge variant="secondary">{lead.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedLeadId && (
        <div className="flex justify-end">
          <Button onClick={handleContinue} disabled={selectedLead.isLoading}>
            Continue with selected lead <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button variant="ghost" onClick={onSkip}>
          Skip - Create fresh member
        </Button>
      </div>
    </div>
  )
}