"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  MapPin,
  Settings,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CreditCard,
  Calendar,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOrganization, useUpdateOrganization } from "@/lib/hooks/use-organization";
import { useBranches, useUpdateBranch } from "@/lib/hooks/use-branches";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

const STEPS = [
  { id: "welcome", title: "Welcome", description: "Let's set up your business" },
  { id: "business", title: "Business", description: "Your gym details" },
  { id: "branch", title: "Branch", description: "Primary location" },
  { id: "configuration", title: "Config", description: "Settings & preferences" },
  { id: "team", title: "Team", description: "Invite your staff" },
  { id: "complete", title: "Complete", description: "You're ready!" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
  { value: "SGD", label: "SGD (S$)", symbol: "S$" },
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
  { value: "SAR", label: "SAR (﷼)", symbol: "﷼" },
];

const BUSINESS_TYPES = [
  { value: "GYM", label: "Fitness Gym" },
  { value: "STUDIO", label: "Boutique Studio" },
  { value: "CROSSFIT", label: "CrossFit Box" },
  { value: "YOGA", label: "Yoga Studio" },
  { value: "MARTIAL_ARTS", label: "Martial Arts Center" },
  { value: "PT", label: "Personal Training" },
  { value: "ONLINE", label: "Online/Remote" },
  { value: "OTHER", label: "Other" },
];

interface OnboardingData {
  businessName: string;
  businessType: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  branchName: string;
  branchAddress: string;
  branchCity: string;
  branchState: string;
  branchPostalCode: string;
  branchCountry: string;
  branchPhone: string;
  branchEmail: string;
  timezone: string;
  currency: string;
  staffEmails: string[];
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative" aria-label={`Step ${currentStep + 1} of ${STEPS.length}`}>
      <div className="relative z-10 flex items-start justify-between gap-1">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                index < currentStep
                  ? "border-transparent bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  : index === currentStep
                    ? "border-transparent bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30"
                    : "border-stone-200 bg-white text-stone-500"
              }`}
              aria-current={index === currentStep ? "step" : undefined}
            >
              {index < currentStep ? (
                <CheckCircle2 className="size-5" aria-hidden="true" />
              ) : (
                <span className="text-sm font-black">{index + 1}</span>
              )}
            </div>
            <div className="hidden text-center sm:block">
              <p
                className={`text-xs font-extrabold ${
                  index <= currentStep ? "text-stone-900" : "text-stone-500"
                }`}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-stone-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-5 right-5 top-5 h-1 rounded-full bg-stone-100" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function WelcomeStep({ onUpdate }: { onUpdate: (data: Partial<OnboardingData>) => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,#0f0c29,#6d28d9_55%,#be185d)] shadow-[0_20px_50px_-20px_rgba(124,58,237,.6)]">
        <Sparkles className="size-10 text-white" aria-hidden="true" />
      </div>
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">Welcome to MyGymAgent</h2>
      <p className="mt-3 max-w-md text-sm font-medium leading-6 text-stone-600">
        Let&apos;s set up your gym business in just a few minutes. We&apos;ll help you configure your organization, branch, and team.
      </p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        <FeatureCard
          icon={Building2}
          tile="from-violet-600 to-fuchsia-600 shadow-violet-500/25"
          title="Business Setup"
          description="Configure your gym details"
        />
        <FeatureCard
          icon={MapPin}
          tile="from-cyan-500 to-blue-600 shadow-cyan-500/25"
          title="Branch Location"
          description="Set up your primary location"
        />
        <FeatureCard
          icon={Settings}
          tile="from-amber-500 to-orange-600 shadow-amber-500/25"
          title="Preferences"
          description="Timezone, currency & more"
        />
        <FeatureCard
          icon={Users}
          tile="from-emerald-500 to-teal-600 shadow-emerald-500/25"
          title="Team"
          description="Invite trainers & staff"
        />
      </div>

      <Button
        size="lg"
        className="mt-8 min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-8 shadow-lg shadow-violet-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        onClick={() => onUpdate({})}
      >
        Let&apos;s Get Started
        <ChevronRight className="ml-2 size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  tile,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  tile: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-stone-200/70 bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br text-white shadow-md ${tile}`}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-stone-900">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-stone-600">{description}</p>
      </div>
    </div>
  );
}

function StepHeading({ icon: Icon, tile, title, subtitle }: { icon: typeof Building2; tile: string; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <div className={`mb-4 inline-flex size-14 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg ${tile}`}>
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-950">{title}</h2>
      <p className="mt-2 text-sm font-medium text-stone-600">{subtitle}</p>
    </div>
  );
}

function BusinessStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <StepHeading icon={Building2} tile="from-violet-600 to-fuchsia-600 shadow-violet-500/25" title="Business Details" subtitle="Tell us about your gym or fitness business" />

      <div className="mt-8 flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="businessName">
            Business Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder="Iron Paradise Gym"
            value={data.businessName}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            className="min-h-11 rounded-xl focus-visible:ring-violet-600"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">
            Business Type <span className="text-destructive">*</span>
          </Label>
          <Select value={data.businessType} onValueChange={(v) => onUpdate({ businessType: v })}>
            <SelectTrigger className="min-h-11 rounded-xl">
              <SelectValue placeholder="Select your business type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="text-sm font-extrabold text-stone-900">Owner Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ownerFirstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ownerFirstName"
              placeholder="John"
              value={data.ownerFirstName}
              onChange={(e) => onUpdate({ ownerFirstName: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerLastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ownerLastName"
              placeholder="Doe"
              value={data.ownerLastName}
              onChange={(e) => onUpdate({ ownerLastName: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerEmail">Email</Label>
          <Input
            id="ownerEmail"
            type="email"
            placeholder="john@example.com"
            value={data.ownerEmail}
            onChange={(e) => onUpdate({ ownerEmail: e.target.value })}
            className="min-h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerPhone">Phone</Label>
          <Input
            id="ownerPhone"
            placeholder="+1 (555) 123-4567"
            value={data.ownerPhone}
            onChange={(e) => onUpdate({ ownerPhone: e.target.value })}
            className="min-h-11 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

function BranchStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <StepHeading icon={MapPin} tile="from-cyan-500 to-blue-600 shadow-cyan-500/25" title="Branch Location" subtitle="Set up your primary gym location" />

      <div className="mt-8 flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="branchName">
            Branch Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="branchName"
            placeholder="Main Location"
            value={data.branchName}
            onChange={(e) => onUpdate({ branchName: e.target.value })}
            className="min-h-11 rounded-xl"
          />
          <p className="text-xs font-medium text-stone-600">
            This is how your branch will appear in the system
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="branchAddress">
            Street Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="branchAddress"
            placeholder="123 Main Street"
            value={data.branchAddress}
            onChange={(e) => onUpdate({ branchAddress: e.target.value })}
            className="min-h-11 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branchCity">City</Label>
            <Input
              id="branchCity"
              placeholder="New York"
              value={data.branchCity}
              onChange={(e) => onUpdate({ branchCity: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchState">State / Province</Label>
            <Input
              id="branchState"
              placeholder="NY"
              value={data.branchState}
              onChange={(e) => onUpdate({ branchState: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branchPostalCode">Postal Code</Label>
            <Input
              id="branchPostalCode"
              placeholder="10001"
              value={data.branchPostalCode}
              onChange={(e) => onUpdate({ branchPostalCode: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchCountry">Country</Label>
            <Input
              id="branchCountry"
              placeholder="United States"
              value={data.branchCountry}
              onChange={(e) => onUpdate({ branchCountry: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branchPhone">Phone</Label>
            <Input
              id="branchPhone"
              placeholder="+1 (555) 123-4567"
              value={data.branchPhone}
              onChange={(e) => onUpdate({ branchPhone: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchEmail">Email</Label>
            <Input
              id="branchEmail"
              type="email"
              placeholder="gym@example.com"
              value={data.branchEmail}
              onChange={(e) => onUpdate({ branchEmail: e.target.value })}
              className="min-h-11 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigurationStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <StepHeading icon={Settings} tile="from-amber-500 to-orange-600 shadow-amber-500/25" title="Configuration" subtitle="Set your preferences and defaults" />

      <div className="mt-8 flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="timezone">
            Timezone <span className="text-destructive">*</span>
          </Label>
          <Select value={data.timezone} onValueChange={(v) => onUpdate({ timezone: v })}>
            <SelectTrigger className="min-h-11 rounded-xl">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs font-medium text-stone-600">
            Used for scheduling and reporting
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">
            Currency <span className="text-destructive">*</span>
          </Label>
          <Select value={data.currency} onValueChange={(v) => onUpdate({ currency: v })}>
            <SelectTrigger className="min-h-11 rounded-xl">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs font-medium text-stone-600">
            All prices and payments will be in this currency
          </p>
        </div>

        <Separator className="my-4" />

        <div className="rounded-[20px] border border-violet-100 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md">
              <Zap className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-stone-900">Smart Defaults</p>
              <p className="mt-1 text-xs font-medium leading-5 text-stone-600">
                You can change these settings anytime in your business preferences.
                All new members and bookings will use these defaults.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}) {
  const [emailInput, setEmailInput] = React.useState("");

  function addEmail() {
    const email = emailInput.trim();
    if (email && !data.staffEmails.includes(email)) {
      onUpdate({ staffEmails: [...data.staffEmails, email] });
      setEmailInput("");
    }
  }

  function removeEmail(email: string) {
    onUpdate({ staffEmails: data.staffEmails.filter((e) => e !== email) });
  }

  return (
    <div className="mx-auto max-w-xl">
      <StepHeading icon={Users} tile="from-emerald-500 to-teal-600 shadow-emerald-500/25" title="Invite Your Team" subtitle="Add trainers and staff members (optional, you can skip this)" />

      <div className="mt-8 flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="staffEmail">Team Member Email</Label>
          <div className="flex gap-2">
            <Input
              id="staffEmail"
              type="email"
              placeholder="trainer@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              className="min-h-11 rounded-xl"
            />
            <Button variant="outline" onClick={addEmail} className="min-h-11 rounded-xl border-stone-200 bg-white/80">
              Add
            </Button>
          </div>
          <p className="text-xs font-medium text-stone-600">
            They&apos;ll receive an invitation to join your organization
          </p>
        </div>

        {data.staffEmails.length > 0 && (
          <div className="space-y-2">
            <Label>Invited Team Members</Label>
            <div className="flex flex-wrap gap-2">
              {data.staffEmails.map((email) => (
                <Badge key={email} variant="secondary" className="rounded-full px-3 py-1.5">
                  {email}
                  <button
                    type="button"
                    className="ml-2 min-h-11 min-w-11 text-stone-500 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:min-h-0 sm:min-w-0"
                    onClick={() => removeEmail(email)}
                    aria-label={`Remove ${email}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <div className="rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Shield className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-stone-900">Role-Based Access</p>
              <p className="mt-1 text-xs font-medium leading-5 text-stone-600">
                Team members will be assigned the Trainer role by default.
                You can change their roles and permissions later in Settings &gt; Staff.
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" className="mt-4 min-h-11 rounded-2xl" onClick={() => onUpdate({})}>
          Skip for Now
        </Button>
      </div>
    </div>
  );
}

function CompleteStep() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex size-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_20px_50px_-20px_rgba(16,185,129,.6)]">
        <CheckCircle2 className="size-12 text-white" aria-hidden="true" />
      </div>
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">Your Gym is Ready!</h2>
      <p className="mt-3 max-w-md text-sm font-medium leading-6 text-stone-600">
        Your business has been configured. Start adding members, creating workout plans, and growing your gym!
      </p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        <FeatureCard
          icon={Users}
          tile="from-violet-600 to-fuchsia-600 shadow-violet-500/25"
          title="Add Members"
          description="Start onboarding your first members"
        />
        <FeatureCard
          icon={Calendar}
          tile="from-cyan-500 to-blue-600 shadow-cyan-500/25"
          title="Schedule Sessions"
          description="Book PT sessions and classes"
        />
        <FeatureCard
          icon={CreditCard}
          tile="from-emerald-500 to-teal-600 shadow-emerald-500/25"
          title="Membership Plans"
          description="Create your pricing packages"
        />
        <FeatureCard
          icon={Settings}
          tile="from-amber-500 to-orange-600 shadow-amber-500/25"
          title="Configure"
          description="Fine-tune your business settings"
        />
      </div>

      <Button
        size="lg"
        className="mt-8 min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-8 shadow-lg shadow-violet-500/25"
        onClick={() => router.push("/dashboard")}
      >
        Go to Dashboard
        <ChevronRight className="ml-2 size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function ReviewStep({
  data,
  onBack,
  onComplete,
  isSubmitting,
}: {
  data: OnboardingData;
  onBack: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <StepHeading icon={CheckCircle2} tile="from-violet-600 to-fuchsia-600 shadow-violet-500/25" title="Review & Launch" subtitle="Here's what we'll set up for you" />

      <div className="mt-8 space-y-3">
        <ReviewCard
          icon={Building2}
          title="Business"
          items={[
            { label: "Name", value: data.businessName || "Not set" },
            { label: "Type", value: BUSINESS_TYPES.find((t) => t.value === data.businessType)?.label || "Not set" },
          ]}
        />
        <ReviewCard
          icon={User}
          title="Owner"
          items={[
            { label: "Name", value: `${data.ownerFirstName} ${data.ownerLastName}` || "Not set" },
            { label: "Email", value: data.ownerEmail || "Not set" },
          ]}
        />
        <ReviewCard
          icon={MapPin}
          title="Branch"
          items={[
            { label: "Name", value: data.branchName || "Not set" },
            { label: "Location", value: data.branchCity ? `${data.branchCity}, ${data.branchCountry || ""}` : "Not set" },
          ]}
        />
        <ReviewCard
          icon={Settings}
          title="Configuration"
          items={[
            { label: "Timezone", value: TIMEZONES.find((t) => t.value === data.timezone)?.label || "Not set" },
            { label: "Currency", value: CURRENCIES.find((c) => c.value === data.currency)?.label || "Not set" },
          ]}
        />
        {data.staffEmails.length > 0 && (
          <ReviewCard
            icon={Users}
            title="Team"
            items={[
              { label: "Invites", value: `${data.staffEmails.length} member${data.staffEmails.length > 1 ? "s" : ""}` },
            ]}
          />
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="min-h-11 rounded-2xl">
          <ChevronLeft className="mr-2 size-4" aria-hidden="true" />
          Back
        </Button>
        <Button className="min-h-11 flex-1 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] shadow-lg shadow-violet-500/25" onClick={onComplete} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Setting up...
            </>
          ) : (
            <>
              Launch Dashboard
              <ChevronRight className="ml-2 size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ReviewCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Building2;
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-[20px] border border-stone-200/70 bg-white/70 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-extrabold text-stone-900">{title}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 text-sm">
            <span className="font-medium text-stone-600">{item.label}</span>
            <span className="truncate font-bold text-stone-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusinessOnboardingWizard() {
  const { user } = useAuth();
  const { data: organization, isLoading: orgLoading } = useOrganization();
  const { data: branches } = useBranches();
  const updateOrg = useUpdateOrganization();
  const updateBranch = useUpdateBranch(branches?.items?.[0]?.id || "");
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const primaryBranch = branches?.items?.[0];

  const [data, setData] = React.useState<OnboardingData>(() => {
    const initial: OnboardingData = {
      businessName: "",
      businessType: "GYM",
      ownerFirstName: user?.firstName || "",
      ownerLastName: user?.lastName || "",
      ownerEmail: user?.email || "",
      ownerPhone: "",
      branchName: "Main Location",
      branchAddress: "",
      branchCity: "",
      branchState: "",
      branchPostalCode: "",
      branchCountry: "",
      branchPhone: "",
      branchEmail: "",
      timezone: "America/New_York",
      currency: "USD",
      staffEmails: [],
    };

    if (organization) {
      initial.businessName = organization.name;
      initial.timezone = organization.timezone;
      initial.currency = organization.currency;
    }

    if (primaryBranch) {
      initial.branchName = primaryBranch.name || "Main Location";
      initial.branchAddress = primaryBranch.addressLine1 || "";
      initial.branchCity = primaryBranch.city || "";
      initial.branchState = primaryBranch.state || "";
      initial.branchPostalCode = primaryBranch.postalCode || "";
      initial.branchCountry = primaryBranch.country || "";
      initial.branchPhone = primaryBranch.phone || "";
      initial.branchEmail = primaryBranch.email || "";
    }

    return initial;
  });

  React.useEffect(() => {
    if (organization && !data.businessName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData((prev) => ({
        ...prev,
        businessName: organization.name || prev.businessName,
        timezone: organization.timezone || prev.timezone,
        currency: organization.currency || prev.currency,
      }));
    }
  }, [organization, data.businessName]);

  React.useEffect(() => {
    if (primaryBranch && !data.branchAddress) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData((prev) => ({
        ...prev,
        branchName: primaryBranch.name || prev.branchName,
        branchAddress: primaryBranch.addressLine1 || prev.branchAddress,
        branchCity: primaryBranch.city || prev.branchCity,
        branchState: primaryBranch.state || prev.branchState,
        branchPostalCode: primaryBranch.postalCode || prev.branchPostalCode,
        branchCountry: primaryBranch.country || prev.branchCountry,
        branchPhone: primaryBranch.phone || prev.branchPhone,
        branchEmail: primaryBranch.email || prev.branchEmail,
      }));
    }
  }, [primaryBranch, data.branchAddress]);

  function updateData(updates: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      await updateOrg.mutateAsync({
        name: data.businessName || organization?.name,
        timezone: data.timezone,
        currency: data.currency,
      });

      if (primaryBranch) {
        await updateBranch.mutateAsync({
          name: data.branchName,
          phone: data.branchPhone || undefined,
          email: data.branchEmail || undefined,
          city: data.branchCity || undefined,
          country: data.branchCountry || undefined,
        });
      }

      toast.success("Business setup complete!");
      setCurrentStep(STEPS.length - 1);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  }

  function goNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function goBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  if (orgLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center" role="status" aria-label="Loading setup">
        <Loader2 className="size-8 animate-spin text-violet-600" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[600px] flex-col">
      {currentStep < STEPS.length - 1 && (
        <div className="mb-8 border-b border-stone-100/80 bg-gradient-to-r from-violet-50/60 via-white to-cyan-50/50 px-4 pt-6 sm:px-8">
          <ProgressIndicator currentStep={currentStep} />
          <div className="h-6" aria-hidden="true" />
        </div>
      )}

      <div className="flex-1 px-4 pb-8 sm:px-8">
        {currentStep === 0 && <WelcomeStep onUpdate={updateData} />}
        {currentStep === 1 && <BusinessStep data={data} onUpdate={updateData} />}
        {currentStep === 2 && <BranchStep data={data} onUpdate={updateData} />}
        {currentStep === 3 && <ConfigurationStep data={data} onUpdate={updateData} />}
        {currentStep === 4 && <TeamStep data={data} onUpdate={updateData} />}
        {currentStep === 5 && <CompleteStep />}
        {currentStep === 4 && (
          <div className="mt-8">
            <ReviewStep
              data={data}
              onBack={goBack}
              onComplete={handleComplete}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>

      {currentStep > 0 && currentStep < STEPS.length - 1 && currentStep !== 4 && (
        <div className="flex justify-between gap-3 border-t border-stone-100 bg-stone-50/60 px-4 py-4 sm:px-8">
          <Button variant="outline" onClick={goBack} className="min-h-11 rounded-2xl border-stone-200 bg-white/80">
            <ChevronLeft className="mr-2 size-4" aria-hidden="true" />
            Back
          </Button>
          <Button onClick={goNext} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] shadow-lg shadow-violet-500/25">
            Continue
            <ChevronRight className="ml-2 size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
