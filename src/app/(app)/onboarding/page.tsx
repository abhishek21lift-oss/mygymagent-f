import { Sparkles } from "lucide-react";
import { BusinessOnboardingWizard } from "./business-onboarding-wizard";
import { PageHero } from "@/components/shared/page-hero";

export default function OnboardingPage() {
  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="onboarding-title"
          variant="dark"
          accent="violet"
          icon={Sparkles}
          eyebrow="Business setup"
          title="MyGymAgent"
          description="Launch your gym in minutes — organization, branch, preferences and team, all in one vivid flow."
          align="center"
        />
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
          <span className="block h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" aria-hidden="true" />
          <BusinessOnboardingWizard />
        </div>
      </div>
    </div>
  );
}
