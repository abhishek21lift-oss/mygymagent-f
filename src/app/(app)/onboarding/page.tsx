import { BusinessOnboardingWizard } from "./business-onboarding-wizard";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto max-w-4xl py-8 px-4 sm:py-12 sm:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">MyGymAgent</h1>
          <p className="mt-1 text-muted-foreground">Business Setup</p>
        </div>
        <div className="rounded-3xl border bg-card shadow-sm">
          <BusinessOnboardingWizard />
        </div>
      </div>
    </div>
  );
}
