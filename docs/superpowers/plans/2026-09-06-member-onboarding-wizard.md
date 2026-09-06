# Member Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple member creation form with a premium 6-step onboarding wizard that captures a complete Member 360 profile.

**Architecture:** A React wizard component that accumulates form data across steps and submits in a single coordinated flow: POST /members to create core member, then sequential POSTs for photo, PAR-Q screening, and measurements. No new backend endpoints required.

**Tech Stack:** Next.js App Router, React Hook Form, Zod, TanStack Query, Tailwind CSS, Lucide icons, Sonner toasts

**Spec:** `docs/superpowers/specs/2026-09-06-member-onboarding-wizard.md`

---

## File Structure

```
src/app/(app)/members/new/
├── page.tsx                    # Replace existing page, render wizard
├── onboarding-wizard.tsx       # Main wizard container + stepper + state
└── steps/
    ├── lead-selection-step.tsx  # Step 1: Search/select CRM lead
    ├── personal-info-step.tsx   # Step 2: Name, contact, DOB, gender, photo
    ├── contact-emergency-step.tsx # Step 3: Address + emergency contact
    ├── gym-setup-step.tsx      # Step 4: Branch, trainer, member type, goal
    ├── fitness-health-step.tsx  # Step 5: Height, weight, PAR-Q, waiver
    └── review-step.tsx          # Step 6: Summary + create

src/lib/validation/
└── gym.ts                      # Extend createMemberSchema with new fields

src/lib/hooks/
└── use-onboarding.ts           # useCompleteOnboarding mutation (creates member + photo + screening + measurement)
```

**Modify existing:**
- `src/app/(app)/members/new/page.tsx` → Replace with wizard page
- `src/lib/validation/gym.ts` → Extend `createMemberSchema`

---

## Task Decomposition

### Task 1: Extend createMemberSchema validation

**Files:**
- Modify: `src/lib/validation/gym.ts` — add new fields to schema

**Interfaces:**
- Produces: Extended `createMemberSchema` with all wizard fields

- [ ] **Step 1: Read existing schema**

```typescript
// src/lib/validation/gym.ts - find createMemberSchema
const createMemberSchema = z.object({
  primaryBranchId: z.string().min(1, "Branch is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  // ... existing fields
})
```

- [ ] **Step 2: Extend schema with new fields**

Add to the schema:
```typescript
// Contact fields
addressLine1: z.string().optional(),
addressLine2: z.string().optional(),
city: z.string().optional(),
state: z.string().optional(),
postalCode: z.string().optional(),
country: z.string().optional(),
// Emergency
emergencyContactName: z.string().optional(),
emergencyContactPhone: z.string().optional(),
emergencyContactRelationship: z.string().optional(),
// Gym setup
assignedTrainerId: z.string().optional(),
memberType: z.enum(["GYM", "PT", "GYM_PT"]).optional(),
fitnessGoal: z.string().optional(),
leadSource: z.string().optional(),
leadId: z.string().optional(), // to track lead conversion
// Fitness/Health
heightCm: z.number().optional(),
weightKg: z.number().optional(),
fitnessExperience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
injuries: z.string().optional(),
allergies: z.string().optional(),
medicalNotes: z.string().optional(),
// PAR-Q
parqHeartCondition: z.boolean().optional(),
parqChestPain: z.boolean().optional(),
parqDizziness: z.boolean().optional(),
parqJointProblems: z.boolean().optional(),
parqMedication: z.boolean().optional(),
parqPregnant: z.boolean().optional(),
parqOtherConcerns: z.boolean().optional(),
flaggedForMedicalClearance: z.boolean().optional(),
// Consent
waiverConsent: z.boolean(),
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/validation/gym.ts
git commit -m "feat(onboarding): extend createMemberSchema with all wizard fields"
```

---

### Task 2: Create useCompleteOnboarding hook

**Files:**
- Create: `src/lib/hooks/use-onboarding.ts`

**Interfaces:**
- Consumes: Member data object from wizard
- Produces: `useCompleteOnboarding` mutation hook

- [ ] **Step 1: Create the hook file**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Member } from "@/lib/types/gym"

interface OnboardingData {
  // Core member fields (matches CreateMemberDto)
  primaryBranchId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  assignedTrainerId?: string
  notes?: string
  // Fitness data (for measurements)
  heightCm?: number
  weightKg?: number
  fitnessExperience?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  injuries?: string
  allergies?: string
  medicalNotes?: string
  // PAR-Q
  parqHeartCondition?: boolean
  parqChestPain?: boolean
  parqDizziness?: boolean
  parqJointProblems?: boolean
  parqMedication?: boolean
  parqPregnant?: boolean
  parqOtherConcerns?: boolean
  flaggedForMedicalClearance?: boolean
  // Consent
  waiverConsent: boolean
  // Photo
  profilePhoto?: File | null
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      // 1. Create member
      const member = await api.post<Member>("/members", {
        primaryBranchId: data.primaryBranchId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        assignedTrainerId: data.assignedTrainerId || null,
        notes: data.medicalNotes || null,
      })

      // 2. Upload profile photo if provided
      if (data.profilePhoto) {
        const formData = new FormData()
        formData.append("file", data.profilePhoto)
        formData.append("category", "PROGRESS_PHOTO")
        formData.append("description", "Profile photo")
        await api.post(`/members/${member.id}/documents`, formData)
      }

      // 3. Create PAR-Q screening
      const parqResponses: Record<string, boolean> = {}
      if (data.parqHeartCondition !== undefined) parqResponses.heartCondition = data.parqHeartCondition
      if (data.parqChestPain !== undefined) parqResponses.chestPain = data.parqChestPain
      if (data.parqDizziness !== undefined) parqResponses.dizziness = data.parqDizziness
      if (data.parqJointProblems !== undefined) parqResponses.jointProblems = data.parqJointProblems
      if (data.parqMedication !== undefined) parqResponses.medication = data.parqMedication
      if (data.parqPregnant !== undefined) parqResponses.pregnant = data.parqPregnant
      if (data.parqOtherConcerns !== undefined) parqResponses.otherConcerns = data.parqOtherConcerns

      await api.post(`/members/${member.id}/screenings`, {
        responses: parqResponses,
        flaggedForMedicalClearance: data.flaggedForMedicalClearance || false,
        notes: data.medicalNotes || null,
      })

      // 4. Create initial measurement
      if (data.heightCm || data.weightKg) {
        await api.post(`/members/${member.id}/measurements`, {
          heightCm: data.heightCm || null,
          weightKg: data.weightKg || null,
          notes: data.fitnessExperience ? `Fitness level: ${data.fitnessExperience}` : null,
        })
      }

      return member
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/use-onboarding.ts
git commit -m "feat(onboarding): add useCompleteOnboarding mutation hook"
```

---

### Task 3: Create lead-selection-step component

**Files:**
- Create: `src/app/(app)/members/new/steps/lead-selection-step.tsx`

**Interfaces:**
- Produces: `LeadSelectionStep` component with props `{onSelectLead(lead), onSkip()}`

- [ ] **Step 1: Create the step component**

```typescript
"use client"

import * as React from "react"
import { Search, UserPlus, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLeads, useLead } from "@/lib/hooks/use-leads"
import type { Lead } from "@/lib/types/gym"

interface LeadSelectionStepProps {
  onSelectLead: (lead: Lead) => void
  onSkip: () => void
}

export function LeadSelectionStep({ onSelectLead, onSkip }: LeadSelectionStepProps) {
  const [search, setSearch] = React.useState("")
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null)

  const leadsQuery = useLeads({
    page: 1,
    pageSize: 20,
    search: search.length >= 2 ? search : undefined,
  })

  const selectedLead = useLead(selectedLeadId ?? undefined)

  function handleSelectLead(lead: Lead) {
    setSelectedLeadId(lead.id)
  }

  function handleContinue() {
    if (selectedLead.data) {
      onSelectLead(selectedLead.data)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {leadsQuery.isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
      ) : leadsQuery.data?.items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No leads found</p>
          <Button variant="outline" onClick={onSkip}>
            Create fresh member instead
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leadsQuery.data?.items.map((lead) => (
            <Card
              key={lead.id}
              className={`cursor-pointer transition-colors ${
                selectedLeadId === lead.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => handleSelectLead(lead)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.email || lead.phone || "No contact"}
                    </p>
                  </div>
                  <Badge variant="secondary">{lead.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedLeadId && (
        <div className="flex justify-end">
          <Button onClick={handleContinue} disabled={selectedLead.isLoading}>
            Continue with selected lead <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button variant="ghost" onClick={onSkip}>
          Skip - Create fresh member
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/new/steps/lead-selection-step.tsx
git commit -m "feat(onboarding): add lead selection step"
```

---

### Task 4: Create personal-info-step component

**Files:**
- Create: `src/app/(app)/members/new/steps/personal-info-step.tsx`

**Interfaces:**
- Consumes: Optional prefill from lead (`{firstName, lastName, email, phone}`)
- Produces: `PersonalInfoStep` component with props `{defaultValues, onUpdate(data), onContinue}`

- [ ] **Step 1: Create the step component**

```typescript
"use client"

import * as React from "react"
import { Camera, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Lead } from "@/lib/types/gym"

interface PersonalInfoData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED" | ""
  profilePhoto: File | null
}

interface PersonalInfoStepProps {
  defaultValues?: Partial<PersonalInfoData>
  onUpdate: (data: PersonalInfoData) => void
  onContinue: () => void
}

export function PersonalInfoStep({ defaultValues, onUpdate, onContinue }: PersonalInfoStepProps) {
  const [form, setForm] = React.useState<PersonalInfoData>({
    firstName: defaultValues?.firstName || "",
    lastName: defaultValues?.lastName || "",
    email: defaultValues?.email || "",
    phone: defaultValues?.phone || "",
    dateOfBirth: defaultValues?.dateOfBirth || "",
    gender: defaultValues?.gender || "",
    profilePhoto: null,
  })
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)

  function updateField<K extends keyof PersonalInfoData>(key: K, value: PersonalInfoData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      updateField("profilePhoto", file)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const isValid = form.firstName && form.lastName && form.phone

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile"
              className="size-24 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="size-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground">
              <Camera className="size-8 text-muted-foreground" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 cursor-pointer">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Upload className="size-4" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
        <p className="text-sm text-muted-foreground">Profile photo (optional)</p>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name *</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      {/* Contact fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="john@example.com"
          />
        </div>
      </div>

      {/* DOB and Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateField("dateOfBirth", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={form.gender} onValueChange={(v) => updateField("gender", v as PersonalInfoData["gender"])}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
              <SelectItem value="UNDISCLOSED">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/new/steps/personal-info-step.tsx
git commit -m "feat(onboarding): add personal info step"
```

---

### Task 5: Create contact-emergency-step component

**Files:**
- Create: `src/app/(app)/members/new/steps/contact-emergency-step.tsx`

**Interfaces:**
- Produces: `ContactEmergencyStep` component with props `{data, onUpdate, onContinue, onBack}`

- [ ] **Step 1: Create the step component**

```typescript
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContactEmergencyData {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

interface ContactEmergencyStepProps {
  data: ContactEmergencyData
  onUpdate: (data: ContactEmergencyData) => void
  onContinue: () => void
  onBack: () => void
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir",
  "Ladakh", "Chandigarh", "Puducherry", "Andaman & Nicobar Islands",
  "Dadra & Nagar Haveli", "Daman & Diu", "Lakshadweep"
]

export function ContactEmergencyStep({ data, onUpdate, onContinue, onBack }: ContactEmergencyStepProps) {
  const [form, setForm] = React.useState<ContactEmergencyData>(data)

  function updateField<K extends keyof ContactEmergencyData>(key: K, value: ContactEmergencyData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  const isValid = form.emergencyContactName && form.emergencyContactPhone

  return (
    <div className="flex flex-col gap-6">
      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="font-medium">Address</h3>
        <div className="space-y-2">
          <Label htmlFor="addressLine1">Address line 1</Label>
          <Input
            id="addressLine1"
            value={form.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
            placeholder="House/Flat no., Street"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input
            id="addressLine2"
            value={form.addressLine2}
            onChange={(e) => updateField("addressLine2", e.target.value)}
            placeholder="Area, Landmark"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Mumbai"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Pincode</Label>
            <Input
              id="postalCode"
              value={form.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
              placeholder="400001"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={form.state} onValueChange={(v) => updateField("state", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country || "India"}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="India"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="space-y-4">
        <h3 className="font-medium">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact name *</Label>
            <Input
              id="emergencyContactName"
              value={form.emergencyContactName}
              onChange={(e) => updateField("emergencyContactName", e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Contact phone *</Label>
            <Input
              id="emergencyContactPhone"
              value={form.emergencyContactPhone}
              onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactRelationship">Relationship</Label>
          <Select value={form.emergencyContactRelationship} onValueChange={(v) => updateField("emergencyContactRelationship", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SPOUSE">Spouse</SelectItem>
              <SelectItem value="PARENT">Parent</SelectItem>
              <SelectItem value="SIBLING">Sibling</SelectItem>
              <SelectItem value="CHILD">Child</SelectItem>
              <SelectItem value="FRIEND">Friend</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/new/steps/contact-emergency-step.tsx
git commit -m "feat(onboarding): add contact emergency step"
```

---

### Task 6: Create gym-setup-step component

**Files:**
- Create: `src/app/(app)/members/new/steps/gym-setup-step.tsx`

**Interfaces:**
- Produces: `GymSetupStep` component with props `{data, onUpdate, onContinue, onBack}`

- [ ] **Step 1: Create the step component**

```typescript
"use client"

import * as React from "react"
import { Building2, User, Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BranchSelect } from "@/components/shared/branch-select"
import { UserSelect } from "@/components/shared/user-select"

interface GymSetupData {
  primaryBranchId: string
  assignedTrainerId: string
  memberType: "GYM" | "PT" | "GYM_PT" | ""
  fitnessGoal: string
  leadSource: string
}

interface GymSetupStepProps {
  data: GymSetupData
  onUpdate: (data: GymSetupData) => void
  onContinue: () => void
  onBack: () => void
}

const MEMBER_TYPES = [
  { value: "GYM", label: "Gym Only", description: "Access to gym facilities" },
  { value: "PT", label: "Personal Training", description: "1-on-1 trainer sessions" },
  { value: "GYM_PT", label: "Gym + PT", description: "Full gym access + trainer sessions" },
]

const FITNESS_GOALS = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "STRENGTH", label: "Strength" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "GENERAL_FITNESS", label: "General Fitness" },
  { value: "OTHER", label: "Other" },
]

export function GymSetupStep({ data, onUpdate, onContinue, onBack }: GymSetupStepProps) {
  const [form, setForm] = React.useState<GymSetupData>(data)

  function updateField<K extends keyof GymSetupData>(key: K, value: GymSetupData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  const isValid = form.primaryBranchId && form.memberType

  return (
    <div className="flex flex-col gap-6">
      {/* Branch Selection */}
      <div className="space-y-2">
        <Label>Branch *</Label>
        <BranchSelect
          value={form.primaryBranchId}
          onChange={(v) => updateField("primaryBranchId", v)}
          placeholder="Select branch"
        />
      </div>

      {/* Trainer Assignment */}
      <div className="space-y-2">
        <Label>Assign Trainer (optional)</Label>
        <UserSelect
          value={form.assignedTrainerId}
          onChange={(v) => updateField("assignedTrainerId", v)}
          placeholder="Select trainer"
        />
      </div>

      {/* Member Type */}
      <div className="space-y-3">
        <Label>Member Type *</Label>
        <div className="grid grid-cols-3 gap-3">
          {MEMBER_TYPES.map((type) => (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all ${
                form.memberType === type.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => updateField("memberType", type.value as GymSetupData["memberType"])}
            >
              <CardContent className="p-3 text-center">
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Fitness Goal */}
      <div className="space-y-2">
        <Label>Fitness Goal</Label>
        <Select value={form.fitnessGoal} onValueChange={(v) => updateField("fitnessGoal", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select goal" />
          </SelectTrigger>
          <SelectContent>
            {FITNESS_GOALS.map((goal) => (
              <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead Source */}
      <div className="space-y-2">
        <Label>Lead Source</Label>
        <Select value={form.leadSource} onValueChange={(v) => updateField("leadSource", v)}>
          <SelectTrigger>
            <SelectValue placeholder="How did they hear about us?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WALK_IN">Walk-in</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
            <SelectItem value="INSTAGRAM">Instagram</SelectItem>
            <SelectItem value="FACEBOOK">Facebook</SelectItem>
            <SelectItem value="GOOGLE">Google</SelectItem>
            <SelectItem value="WEBSITE">Website</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/new/steps/gym-setup-step.tsx
git commit -m "feat(onboarding): add gym setup step"
```

---

### Task 7: Create fitness-health-step component

**Files:**
- Create: `src/app/(app)/members/new/steps/fitness-health-step.tsx`

**Interfaces:**
- Produces: `FitnessHealthStep` component with props `{data, onUpdate, onContinue, onBack}`

- [ ] **Step 1: Create the step component**

```typescript
"use client"

import * as React from "react"
import { AlertTriangle, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FitnessHealthData {
  heightCm: string
  weightKg: string
  fitnessExperience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | ""
  injuries: string
  allergies: string
  medicalNotes: string
  parqHeartCondition: boolean
  parqChestPain: boolean
  parqDizziness: boolean
  parqJointProblems: boolean
  parqMedication: boolean
  parqPregnant: boolean
  parqOtherConcerns: boolean
  waiverConsent: boolean
}

interface FitnessHealthStepProps {
  data: FitnessHealthData
  onUpdate: (data: FitnessHealthData) => void
  onContinue: () => void
  onBack: () => void
}

const PARQ_QUESTIONS = [
  { key: "parqHeartCondition", label: "Do you have any heart condition?" },
  { key: "parqChestPain", label: "Do you experience chest pain during physical activity?" },
  { key: "parqDizziness", label: "Do you often feel dizzy or have fainted?" },
  { key: "parqJointProblems", label: "Do you have any joint problems or pain?" },
  { key: "parqMedication", label: "Are you currently taking any medication?" },
  { key: "parqPregnant", label: "Are you pregnant?" },
  { key: "parqOtherConcerns", label: "Do you have any other health concerns?" },
]

export function FitnessHealthStep({ data, onUpdate, onContinue, onBack }: FitnessHealthStepProps) {
  const [form, setForm] = React.useState<FitnessHealthData>(data)

  function updateField<K extends keyof FitnessHealthData>(key: K, value: FitnessHealthData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  const anyParqYes = form.parqHeartCondition || form.parqChestPain || form.parqDizziness ||
    form.parqJointProblems || form.parqMedication || form.parqPregnant || form.parqOtherConcerns

  const isValid = form.waiverConsent

  return (
    <div className="flex flex-col gap-6">
      {/* Basic Measurements */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="heightCm">Height (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            value={form.heightCm}
            onChange={(e) => updateField("heightCm", e.target.value)}
            placeholder="175"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input
            id="weightKg"
            type="number"
            value={form.weightKg}
            onChange={(e) => updateField("weightKg", e.target.value)}
            placeholder="70"
          />
        </div>
      </div>

      {/* Fitness Experience */}
      <div className="space-y-2">
        <Label htmlFor="fitnessExperience">Fitness Experience</Label>
        <Select
          value={form.fitnessExperience}
          onValueChange={(v) => updateField("fitnessExperience", v as FitnessHealthData["fitnessExperience"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BEGINNER">Beginner - Just starting</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate - 6+ months experience</SelectItem>
            <SelectItem value="ADVANCED">Advanced - 2+ years experience</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Health Info */}
      <div className="space-y-2">
        <Label htmlFor="injuries">Injuries / Limitations</Label>
        <Textarea
          id="injuries"
          value={form.injuries}
          onChange={(e) => updateField("injuries", e.target.value)}
          placeholder="Any past injuries or physical limitations..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">Allergies</Label>
        <Textarea
          id="allergies"
          value={form.allergies}
          onChange={(e) => updateField("allergies", e.target.value)}
          placeholder="Any allergies (food, environmental, etc.)..."
        />
      </div>

      {/* PAR-Q Section */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">PAR-Q Health Questionnaire</h3>
          <p className="text-sm text-muted-foreground">
            Please answer the following questions about your health
          </p>
        </div>

        {PARQ_QUESTIONS.map((q) => (
          <div key={q.key} className="flex items-start gap-3">
            <Checkbox
              id={q.key}
              checked={form[q.key as keyof FitnessHealthData] as boolean}
              onCheckedChange={(checked) =>
                updateField(q.key as keyof FitnessHealthData, checked as boolean)
              }
            />
            <Label htmlFor={q.key} className="text-sm cursor-pointer">
              {q.label}
            </Label>
          </div>
        ))}

        {anyParqYes && (
          <Alert variant="warning">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Some health concerns noted. A medical clearance may be required before starting.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Waiver Consent */}
      <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
        <Checkbox
          id="waiverConsent"
          checked={form.waiverConsent}
          onCheckedChange={(checked) => updateField("waiverConsent", checked as boolean)}
        />
        <Label htmlFor="waiverConsent" className="text-sm cursor-pointer">
          I confirm that the information provided is accurate. I have read and agree to the
          gym&apos;s waiver and liability terms. *
        </Label>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/new/steps/fitness-health-step.tsx
git commit -m "feat(onboarding): add fitness health step with PAR-Q"
```

---

### Task 8: Create review-step component

**Files:**
- Create: `src/app/(app)/members/new/steps/review-step.tsx`

**Interfaces:**
- Consumes: All wizard data
- Produces: `ReviewStep` component with props `{data, onEdit(step), onSubmit, isSubmitting}`

- [ ] **Step 1: Create the step component**

```typescript
"use client"

import * as React from "react"
import { Edit2, User, MapPin, Building2, Heart, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ReviewStepProps {
  data: {
    lead?: { firstName: string; lastName: string; email: string; phone: string }
    personal: { firstName: string; lastName: string; email: string; phone: string; dateOfBirth: string; gender: string }
    contact: { addressLine1: string; city: string; state: string; postalCode: string; emergencyContactName: string; emergencyContactPhone: string }
    gym: { primaryBranchId: string; memberType: string; fitnessGoal: string; assignedTrainerId: string }
    fitness: { heightCm: string; weightKg: string; parqHeartCondition: boolean; waiverConsent: boolean }
  }
  onEdit: (step: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}

function SectionCard({ icon: Icon, title, onEdit, children }: {
  icon: React.ElementType
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="size-3 mr-1" /> Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {children}
      </CardContent>
    </Card>
  )
}

export function ReviewStep({ data, onEdit, onSubmit, isSubmitting }: ReviewStepProps) {
  const p = data.personal
  const c = data.contact
  const g = data.gym
  const f = data.fitness

  const memberTypeLabels: Record<string, string> = {
    GYM: "Gym Only",
    PT: "Personal Training",
    GYM_PT: "Gym + PT",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">Review & Create Member</h2>
        <p className="text-muted-foreground">Please review all details before creating</p>
      </div>

      <div className="grid gap-4">
        <SectionCard icon={User} title="Personal Information" onEdit={() => onEdit(1)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Name:</span> {p.firstName} {p.lastName}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span> {p.phone}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {p.email || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">DOB:</span> {p.dateOfBirth || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span> {p.gender || "—"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={MapPin} title="Contact & Emergency" onEdit={() => onEdit(2)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Address:</span> {c.addressLine1 || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">City:</span> {c.city || "—"}, {c.state || "—"} {c.postalCode || ""}
            </div>
            <div>
              <span className="text-muted-foreground">Emergency:</span> {c.emergencyContactName || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Emergency Phone:</span> {c.emergencyContactPhone || "—"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Building2} title="Gym Setup" onEdit={() => onEdit(3)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Branch:</span> {g.primaryBranchId || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Member Type:</span>{" "}
              <Badge variant="secondary">{memberTypeLabels[g.memberType] || g.memberType || "—"}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Goal:</span> {g.fitnessGoal || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Trainer:</span> {g.assignedTrainerId || "None"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Heart} title="Fitness & Health" onEdit={() => onEdit(4)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Height:</span> {f.heightCm ? `${f.heightCm} cm` : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span> {f.weightKg ? `${f.weightKg} kg` : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Heart Condition:</span>{" "}
              {f.parqHeartCondition ? (
                <Badge variant="destructive">Yes</Badge>
              ) : (
                <Badge variant="success">No</Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Waiver:</span>{" "}
              {f.waiverConsent ? (
                <Badge variant="success">Signed</Badge>
              ) : (
                <Badge variant="destructive">Not Signed</Badge>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => onEdit(4)}>Back</Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>Creating Member...</>
          ) : (
            <>
              <CheckCircle2 className="size-4 mr-2" />
              Create Member
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/new/steps/review-step.tsx
git commit -m "feat(onboarding): add review step"
```

---

### Task 9: Create main onboarding wizard component

**Files:**
- Create: `src/app/(app)/members/new/onboarding-wizard.tsx`

**Interfaces:**
- Consumes: All step components, useCompleteOnboarding hook
- Produces: `OnboardingWizard` component that manages step state and data

- [ ] **Step 1: Create the wizard component**

```typescript
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ChevronLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

import { LeadSelectionStep } from "./steps/lead-selection-step"
import { PersonalInfoStep } from "./steps/personal-info-step"
import { ContactEmergencyStep } from "./steps/contact-emergency-step"
import { GymSetupStep } from "./steps/gym-setup-step"
import { FitnessHealthStep } from "./steps/fitness-health-step"
import { ReviewStep } from "./steps/review-step"
import { useCompleteOnboarding } from "@/lib/hooks/use-onboarding"
import type { Lead } from "@/lib/types/gym"

const STEPS = [
  { id: 0, label: "Lead" },
  { id: 1, label: "Personal" },
  { id: 2, label: "Contact" },
  { id: 3, label: "Gym" },
  { id: 4, label: "Health" },
  { id: 5, label: "Review" },
]

interface WizardData {
  lead?: Lead
  personal: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED" | ""
    profilePhoto: File | null
  }
  contact: {
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    postalCode: string
    country: string
    emergencyContactName: string
    emergencyContactPhone: string
    emergencyContactRelationship: string
  }
  gym: {
    primaryBranchId: string
    assignedTrainerId: string
    memberType: "GYM" | "PT" | "GYM_PT" | ""
    fitnessGoal: string
    leadSource: string
  }
  fitness: {
    heightCm: string
    weightKg: string
    fitnessExperience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | ""
    injuries: string
    allergies: string
    medicalNotes: string
    parqHeartCondition: boolean
    parqChestPain: boolean
    parqDizziness: boolean
    parqJointProblems: boolean
    parqMedication: boolean
    parqPregnant: boolean
    parqOtherConcerns: boolean
    waiverConsent: boolean
  }
}

const DEFAULT_DATA: WizardData = {
  personal: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profilePhoto: null,
  },
  contact: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  },
  gym: {
    primaryBranchId: "",
    assignedTrainerId: "",
    memberType: "",
    fitnessGoal: "",
    leadSource: "",
  },
  fitness: {
    heightCm: "",
    weightKg: "",
    fitnessExperience: "",
    injuries: "",
    allergies: "",
    medicalNotes: "",
    parqHeartCondition: false,
    parqChestPain: false,
    parqDizziness: false,
    parqJointProblems: false,
    parqMedication: false,
    parqPregnant: false,
    parqOtherConcerns: false,
    waiverConsent: false,
  },
}

export function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [data, setData] = React.useState<WizardData>(DEFAULT_DATA)
  const completeOnboarding = useCompleteOnboarding()

  function updateData<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function goToStep(step: number) {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step)
    }
  }

  function goNext() {
    goToStep(currentStep + 1)
  }

  function goBack() {
    goToStep(currentStep - 1)
  }

  async function handleSubmit() {
    try {
      const member = await completeOnboarding.mutateAsync({
        primaryBranchId: data.gym.primaryBranchId,
        firstName: data.personal.firstName,
        lastName: data.personal.lastName,
        email: data.personal.email || undefined,
        phone: data.personal.phone,
        dateOfBirth: data.personal.dateOfBirth || undefined,
        gender: data.personal.gender || undefined,
        addressLine1: data.contact.addressLine1 || undefined,
        addressLine2: data.contact.addressLine2 || undefined,
        city: data.contact.city || undefined,
        state: data.contact.state || undefined,
        postalCode: data.contact.postalCode || undefined,
        country: data.contact.country || undefined,
        emergencyContactName: data.contact.emergencyContactName || undefined,
        emergencyContactPhone: data.contact.emergencyContactPhone || undefined,
        emergencyContactRelationship: data.contact.emergencyContactRelationship || undefined,
        assignedTrainerId: data.gym.assignedTrainerId || undefined,
        heightCm: data.fitness.heightCm ? parseFloat(data.fitness.heightCm) : undefined,
        weightKg: data.fitness.weightKg ? parseFloat(data.fitness.weightKg) : undefined,
        fitnessExperience: data.fitness.fitnessExperience || undefined,
        injuries: data.fitness.injuries || undefined,
        allergies: data.fitness.allergies || undefined,
        medicalNotes: data.fitness.medicalNotes || undefined,
        parqHeartCondition: data.fitness.parqHeartCondition,
        parqChestPain: data.fitness.parqChestPain,
        parqDizziness: data.fitness.parqDizziness,
        parqJointProblems: data.fitness.parqJointProblems,
        parqMedication: data.fitness.parqMedication,
        parqPregnant: data.fitness.parqPregnant,
        parqOtherConcerns: data.fitness.parqOtherConcerns,
        flaggedForMedicalClearance:
          data.fitness.parqHeartCondition ||
          data.fitness.parqChestPain ||
          data.fitness.parqDizziness ||
          data.fitness.parqJointProblems ||
          data.fitness.parqMedication ||
          data.fitness.parqPregnant ||
          data.fitness.parqOtherConcerns,
        waiverConsent: data.fitness.waiverConsent,
        profilePhoto: data.personal.profilePhoto,
      })

      toast.success("Member created successfully!")
      router.push(`/members/${member.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create member")
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between px-4">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`size-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  idx < currentStep
                    ? "bg-primary text-primary-foreground"
                    : idx === currentStep
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {idx < currentStep ? <Check className="size-4" /> : step.id + 1}
              </div>
              <span className="text-xs text-muted-foreground">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  idx < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <LeadSelectionStep
            onSelectLead={(lead) => {
              updateData("lead", lead)
              updateData("personal", {
                ...data.personal,
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email || "",
                phone: lead.phone || "",
              })
              goNext()
            }}
            onSkip={goNext}
          />
        )}

        {currentStep === 1 && (
          <PersonalInfoStep
            defaultValues={data.personal}
            onUpdate={(personal) => updateData("personal", personal)}
            onContinue={goNext}
          />
        )}

        {currentStep === 2 && (
          <ContactEmergencyStep
            data={data.contact}
            onUpdate={(contact) => updateData("contact", contact)}
            onContinue={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 3 && (
          <GymSetupStep
            data={data.gym}
            onUpdate={(gym) => updateData("gym", gym)}
            onContinue={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 4 && (
          <FitnessHealthStep
            data={data.fitness}
            onUpdate={(fitness) => updateData("fitness", fitness)}
            onContinue={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 5 && (
          <ReviewStep
            data={data}
            onEdit={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={completeOnboarding.isPending}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/new/onboarding-wizard.tsx
git commit -m "feat(onboarding): add main onboarding wizard component"
```

---

### Task 10: Replace /members/new/page.tsx

**Files:**
- Modify: `src/app/(app)/members/new/page.tsx` — replace with wizard

**Interfaces:**
- Consumes: OnboardingWizard component
- Produces: Updated page that renders the wizard

- [ ] **Step 1: Read existing page**

```bash
cat src/app/\(app\)/members/new/page.tsx
```

- [ ] **Step 2: Replace with wizard page**

```typescript
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
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/members/new/page.tsx
git commit -m "feat(onboarding): replace new member page with wizard"
```

---

### Task 11: Create steps directory and ensure build

**Files:**
- Ensure: `src/app/(app)/members/new/steps/` directory exists

**Note:** This directory was created by Tasks 3-8, but verify it exists and run final build.

- [ ] **Step 1: Check directory exists**

```bash
ls -la src/app/\(app\)/members/new/steps/
```

- [ ] **Step 2: Run full typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: Both pass

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(onboarding): complete member onboarding wizard implementation"
```

---

## Self-Review Checklist

- [ ] All 6 steps implemented
- [ ] All forms have validation
- [ ] PAR-Q health questionnaire complete
- [ ] Stepper navigation works
- [ ] Data flows correctly between steps
- [ ] Member creation calls correct APIs
- [ ] Photo upload works after member creation
- [ ] PAR-Q screening created after member
- [ ] Measurements created after member
- [ ] Redirect to Member 360 on success
- [ ] Typecheck passes
- [ ] Lint passes (0 errors)
- [ ] Build succeeds

---

## Files Summary

**Created (12 files):**
1. `src/lib/hooks/use-onboarding.ts`
2. `src/app/(app)/members/new/steps/lead-selection-step.tsx`
3. `src/app/(app)/members/new/steps/personal-info-step.tsx`
4. `src/app/(app)/members/new/steps/contact-emergency-step.tsx`
5. `src/app/(app)/members/new/steps/gym-setup-step.tsx`
6. `src/app/(app)/members/new/steps/fitness-health-step.tsx`
7. `src/app/(app)/members/new/steps/review-step.tsx`
8. `src/app/(app)/members/new/onboarding-wizard.tsx`
9. `docs/superpowers/specs/2026-09-06-member-onboarding-wizard.md`

**Modified (2 files):**
1. `src/app/(app)/members/new/page.tsx`
2. `src/lib/validation/gym.ts`

**Backend Changes:** None (uses existing APIs)

**Total commits:** 10 (1 spec + 9 feature commits)
