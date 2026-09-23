import { Sparkles } from "lucide-react";
import { BusinessOnboardingWizard } from "./business-onboarding-wizard";
import { PageHero } from "@/components/shared/page-hero";

export default function OnboardingPage() {
 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
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
