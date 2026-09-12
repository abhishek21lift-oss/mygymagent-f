"use client"

import { ArrowLeft, UserRound } from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/shared/page-hero"
import { OnboardingWizard } from "./onboarding-wizard"

export default function NewMemberPage() {
  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
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
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
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
