import { Sparkles } from "lucide-react";
import { BusinessOnboardingWizard } from "./business-onboarding-wizard";

export default function OnboardingPage() {
  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="onboarding-title" className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0f0c29_0%,#302b63_38%,#6d28d9_68%,#be185d_100%)] p-6 text-center text-white shadow-[0_35px_110px_-48px_rgba(79,70,229,.65)] sm:p-8">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-cyan-400/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-fuchsia-400/30 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-white backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden="true" /> Business setup
            </span>
            <h1 id="onboarding-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-balance sm:text-5xl">
              MyGymAgent
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-white/75">
              Launch your gym in minutes — organization, branch, preferences and team, all in one vivid flow.
            </p>
          </div>
        </section>
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
          <span className="block h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" aria-hidden="true" />
          <BusinessOnboardingWizard />
        </div>
      </div>
    </div>
  );
}
