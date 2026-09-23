import { Sparkles } from "lucide-react";
import { BusinessOnboardingWizard } from "./business-onboarding-wizard";
import { PageHero } from "@/components/shared/page-hero";

export default function OnboardingPage() {
 return (
 <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
 <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
 <PageHero
 id="onboarding-title"
 variant="dark"
 accent="violet"
 icon={Sparkles}
 title="THE CULT CLIENT"
 align="center"
 />
 <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <span className="block h-1.5 bg-violet-600" aria-hidden="true" />
 <BusinessOnboardingWizard />
 </div>
 </div>
 </div>
 );
}
