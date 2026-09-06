"use client"

import { OnboardingWizard } from "./onboarding-wizard"
import { PageHeader } from "@/components/shared/page-header"

export default function NewMemberPage() {
  return (
    <div className="container py-8">
      <PageHeader
        title="New Member Onboarding"
        description="Complete the onboarding wizard to create a new member profile"
      />
      <OnboardingWizard />
    </div>
  )
}
