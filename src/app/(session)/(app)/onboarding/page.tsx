"use client";

// A client component only because it hands `PageHero` an icon.
// The masthead reads the route to pick its accent, so it runs on
// the client, and a component passed from a server page would cross
// that boundary as a function. This page is a static shell around
// the wizard, which is a client component already, so nothing is
// lost by rendering it there.
import { Sparkles } from "lucide-react";
import { BusinessOnboardingWizard } from "./business-onboarding-wizard";
import { PageHero } from "@/components/shared/page-hero";

export default function OnboardingPage() {
 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="onboarding-title"
 icon={Sparkles}
 title="THE CULT CLIENT"
 align="center"
 />
 <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card">
 <span className="block h-1.5 bg-violet-600" aria-hidden="true" />
 <BusinessOnboardingWizard />
 </div>
 </div>
 </div>
 );
}
