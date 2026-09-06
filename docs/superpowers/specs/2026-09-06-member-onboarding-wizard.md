# Member Onboarding Wizard - Design Specification

**Date:** 2026-09-06
**Status:** Approved
**Repo:** abhishek21lift-oss/mygymagent-f

---

## Overview

Replace the existing simple member creation form (`/members/new/page.tsx`) with a premium, production-grade multi-step onboarding wizard that captures everything needed for a complete Member 360 profile.

---

## User Flow

```
Lead Selection → Personal Info → Contact & Emergency → Gym Setup → Fitness & Health → Review & Create
     Step 1              Step 2              Step 3              Step 4           Step 5           Step 6
```

### Step 1: Lead Selection
- Search existing CRM leads by name, email, or phone
- Select a lead → pre-fills Step 2 with lead data
- Option to create "Fresh Member" (skip lead selection)

### Step 2: Personal Info
- First name*, Last name*, Phone*, Email
- Date of birth, Gender
- Profile photo upload
- *Pre-filled if lead selected

### Step 3: Contact & Emergency
- Address: addressLine1, locality, city, state, pincode, country
- Emergency contact: name*, phone*, relationship

### Step 4: Gym Setup
- Branch* (required)
- Assigned trainer (optional)
- Member type: Gym / PT / Gym + PT
- Fitness goal: Weight Loss / Muscle Gain / Strength / Endurance / General Fitness / Other
- Lead source (pre-filled from lead if applicable)

### Step 5: Fitness & Health
- Height (cm), Weight (kg)
- Fitness experience: Beginner / Intermediate / Advanced
- Injuries/limitations (text)
- Allergies (text)
- Health/medical notes (text)
- PAR-Q questions (7 yes/no questions):
  1. Heart condition?
  2. Chest pain during activity?
  3. Dizziness?
  4. Joint problems?
  5. On medication?
  6. Pregnant?
  7. Other health concerns?
- Waiver/consent checkbox

### Step 6: Review & Create
- Summary of all entered data
- Edit buttons to jump to specific steps
- Create button → submits all data
- On success → redirect to Member 360 profile

---

## Technical Implementation

### Single POST Member Creation
Backend `CreateMemberDto` accepts all core fields in one request:
```typescript
{
  primaryBranchId, firstName, lastName, email, phone,
  dateOfBirth, gender,
  addressLine1, addressLine2, city, state, postalCode, country,
  emergencyContactName, emergencyContactPhone,
  assignedTrainerId, notes
}
```

### Sequential Post-Creation Calls
After member is created:
1. Upload profile photo (if provided) → `POST /members/:id/documents` with `category: PROGRESS_PHOTO`
2. Create PAR-Q screening → `POST /members/:id/screenings`
3. Create initial measurement → `POST /members/:id/measurements`

### Validation Schema
Extended `createMemberSchema` in `src/lib/validation/gym.ts`:
```typescript
z.object({
  primaryBranchId: z.string().min(1, "Branch is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]).optional(),
  addressLine1: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  memberType: z.enum(["GYM", "PT", "GYM_PT"]).optional(),
  fitnessGoal: z.string().optional(),
  leadSource: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  fitnessExperience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  injuries: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  parqResponses: z.record(z.boolean()).optional(),
  waiverConsent: z.boolean(),
})
```

### API Hooks
- `useCreateMember()` - existing, use as-is
- `useLead(id)` - fetch lead details
- `useLeads(search)` - search leads
- `useCreateMemberScreening()` - existing
- `useCreateMemberMeasurement()` - existing
- `useUploadMemberDocument()` - existing
- New: `useCompleteOnboarding()` - orchestrates all post-creation calls

### File Structure
```
src/app/(app)/members/new/
├── page.tsx                    # Redirects to wizard
├── onboarding-wizard.tsx       # Main wizard container
└── steps/
    ├── lead-selection-step.tsx
    ├── personal-info-step.tsx
    ├── contact-emergency-step.tsx
    ├── gym-setup-step.tsx
    ├── fitness-health-step.tsx
    └── review-step.tsx
```

### Component Architecture
- `OnboardingWizard` - manages step state, form data, navigation
- Each step is a separate component with local form state
- Step data is accumulated in parent wizard state
- Final step consolidates and submits all data

---

## UI/UX Specification

### Visual Design
- Premium MyGymAgent visual language
- Clean, colorful, glassy, modern - NOT dark UI
- White/light backgrounds with primary color accents
- Card-based step containers with subtle shadows
- Progress stepper at top showing all steps

### Stepper/Progress Indicator
- Horizontal stepper on desktop
- Compact step indicators: numbers with labels
- Current step highlighted with primary color
- Completed steps show checkmark
- Clickable to navigate back (not forward)

### Form Design
- Required fields marked with asterisk
- Inline validation errors (red text below field)
- Floating labels or top-aligned labels
- 2-column grid on desktop, 1-column on mobile
- Clear section dividers within steps

### Navigation
- "Back" and "Continue" buttons at bottom
- "Continue" disabled until required fields valid
- Confirmation on accidental navigation away
- Keyboard navigation (Enter to continue)

### Responsive Layout
- Mobile-first
- Single column on mobile
- 2-column grid on tablet+
- Full-width step cards on mobile
- Sticky footer with navigation buttons

### Error Handling
- Inline field errors
- Toast notifications for API errors
- Retry option on failure
- "Try Again" button if submission fails

### Loading States
- Button loading spinner during submission
- Step skeleton while loading data
- Progress indicator during multi-step creation

### Success Flow
1. Show success animation
2. Display "Member Created!" message
3. Auto-redirect to Member 360 profile after 2 seconds
4. "View Profile" button as alternative

---

## Backend Changes

**No new endpoints required.** Using existing APIs:
- `POST /members` - create member
- `POST /members/:id/documents` - upload photo
- `POST /members/:id/screenings` - PAR-Q
- `POST /members/:id/measurements` - height/weight

---

## Quality Gates

- `npm run typecheck` - must pass
- `npm run lint` - must pass (0 errors)
- `npm run build` - must pass
- Manual testing of full flow

---

## Out of Scope

- Membership/plan assignment (optional, can add later)
- Lead creation (only conversion of existing leads)
- Food diary / diet plans
- PT session booking
- Payment collection
