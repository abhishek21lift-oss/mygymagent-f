"use client"

import { ArrowLeft, UserRound } from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/shared/page-hero"
import { OnboardingWizard } from "./onboarding-wizard"

export default function NewMemberPage() {
 return (
 <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
 <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
 <PageHero
 id="new-member-title"
 icon={UserRound}
 title="New member"
 variant="light"
 accent="violet"
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
