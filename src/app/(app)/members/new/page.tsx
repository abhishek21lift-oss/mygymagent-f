"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, UserPlus } from "lucide-react"
import { PageHero } from "@/components/shared/page-hero"
import { useLead } from "@/lib/hooks/use-leads"
import { AddMemberForm } from "./add-member-form"

/** `/members/new?lead=<id>` starts from that enquiry. */
function FormFromQuery() {
  const leadId = useSearchParams().get("lead")
  const lead = useLead(leadId)
  if (leadId && lead.isLoading) return null
  // Keyed so the form starts over from the enquiry once it has loaded.
  return <AddMemberForm key={lead.data?.id ?? "new"} initialLead={lead.data ?? null} />
}

export default function NewMemberPage() {
  return (
    <div className="flex flex-col gap-5 pb-4">
      <PageHero
        id="new-member-title"
        icon={UserPlus}
        title="Add member"
        actions={
          <Link
            href="/members"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Members
          </Link>
        }
      />
      <React.Suspense fallback={null}>
        <FormFromQuery />
      </React.Suspense>
    </div>
  )
}
