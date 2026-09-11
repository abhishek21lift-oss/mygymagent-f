"use client"

import { Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { OnboardingWizard } from "./onboarding-wizard"

export default function NewMemberPage() {
  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="new-member-title" className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-violet-300/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-cyan-300/30 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-fuchsia-300/20 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <Link
              href="/members"
              className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-xs font-extrabold text-stone-600 transition hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to members
            </Link>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-violet-700">
              <Sparkles className="size-3.5" aria-hidden="true" /> Onboarding · Member OS
            </p>
            <h1 id="new-member-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl">New member onboarding</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600">Complete the onboarding wizard to create a new member profile — lead, personal, contact, gym, health, then review.</p>
          </div>
        </section>
        <OnboardingWizard />
      </div>
    </div>
  )
}
