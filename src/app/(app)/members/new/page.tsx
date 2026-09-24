"use client"

import { ArrowLeft, UserRound } from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/shared/page-hero"
import { OnboardingWizard } from "./onboarding-wizard"

export default function NewMemberPage() {
 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="new-member-title"
 icon={UserRound}
 title="New member"
 actions={
 <Link
 href="/members"
 className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-card px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
 >
 <ArrowLeft className="size-4" aria-hidden="true" />
 Back
 </Link>
 }
 />
 <OnboardingWizard />
 </div>
 </div>
 )
}
