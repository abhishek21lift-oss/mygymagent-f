# Members Module Frontend Completion

Date: 2026-09-06

## Context

The Members module in mygymagent has substantial backend coverage but incomplete frontend UI. Several member-related features exist in the database but have no user interface.

## Goals

Complete the frontend for the Members module by adding:

1. Attendance history tab
2. Payment history tab
3. PAR-Q/Screening intake and history
4. Assessment sessions (refactored to link measurements to sessions)
5. Diet/Nutrition panel (meal plans + food diary)
6. PT Sessions panel
7. Lead → Member conversion page in CRM

## Design

### 1. Attendance History Tab

**Location:** `src/app/(app)/members/[id]/member-360-tabs.tsx`

Add `AttendancePanel` component showing:
- Check-in/check-out times
- Method (QR, MANUAL, KIOSK, APP, STAFF)
- Branch name
- Pagination (50 most recent)

**API Hook:**
```typescript
// New hook: use-member-attendance.ts
useMemberAttendance(memberId: string)
  -> GET /members/:memberId/attendance
```

### 2. Payment History Tab

**Location:** `src/app/(app)/members/[id]/member-360-tabs.tsx`

Add `PaymentsPanel` component showing:
- Payment amount, currency, method
- Status (COMPLETED, REFUNDED, PARTIALLY_REFUNDED)
- Associated membership plan
- Refunds if any
- Total spent calculation

**API Hook:**
```typescript
// New hook: use-member-payments.ts
useMemberPayments(memberId: string)
  -> GET /members/:memberId/payments
```

### 3. PAR-Q Screening Tab

**Location:** `src/app/(app)/members/[id]/member-360-tabs.tsx`

Add `ScreeningPanel` component:
- PAR-Q intake form (one-time):
  - Heart condition
  - Chest pain during activity
  - Dizziness
  - Joint problems
  - On medication
  - Pregnant
- Store as `MemberScreening` with responses JSON
- Show "Medical clearance needed" badge if flagged
- Display completed screening with date and who conducted it

**API Hook:**
```typescript
// New hook: use-member-screenings.ts
useMemberScreenings(memberId: string)
  -> GET /members/:memberId/screenings
useCreateMemberScreening(memberId: string)
  -> POST /members/:memberId/screenings
```

### 4. Assessment Sessions (Refactored)

**Location:** `src/app/(app)/members/[id]/member-360-tabs.tsx`

Refactor `AssessmentsPanel` to:
- Create assessment session first (INITIAL/PROGRESS/PAR_Q/FITNESS_TEST/CUSTOM)
- Then add measurements/fitness tests/screenings linked to session
- Show session cards with linked data

**New Hooks:**
```typescript
useMemberAssessments(memberId: string)
  -> GET /members/:memberId/assessments
useCreateMemberAssessment(memberId: string)
  -> POST /members/:memberId/assessments
```

### 5. Diet & Nutrition Tab

**Location:** `src/app/(app)/members/[id]/member-360-tabs.tsx`

Add `NutritionPanel` showing:
- Assigned diet plans (ACTIVE/COMPLETED/CANCELLED)
- Daily food diary entries with macro tracking
- Target vs actual macros
- Assign new diet plan dialog

**API Hooks:**
```typescript
useMemberDietAssignments(memberId: string)
  -> GET /members/:memberId/diet-assignments
useAssignDietPlan(memberId: string)
  -> POST /members/:memberId/diet-assignments
useMemberFoodDiary(memberId: string)
  -> GET /members/:memberId/food-diary
useLogFoodDiary(memberId: string)
  -> POST /members/:memberId/food-diary
```

### 6. PT Sessions Tab

**Location:** `src/app/(app)/members/[id]/member-360-tabs.tsx`

Add `PtSessionsPanel` showing:
- PT session date, trainer, status
- Workout plan linked
- Session notes
- Expand to see workout details

**API Hook:**
```typescript
useMemberPtSessions(memberId: string)
  -> GET /members/:memberId/pt-sessions
```

### 7. Lead → Member Conversion

**Location:** `src/app/(app)/crm/leads/[id]/convert/page.tsx`

New page to convert a lead to member:
- Pre-fill member form with lead data (name, email, phone)
- Select branch
- Assign trainer (optional)
- Creates member and updates lead status to WON

## Implementation Order

1. **Hooks:** Create hooks for all new API endpoints (attendance, payments, screenings, pt-sessions, diet)
2. **Tabs:** Add new tabs to Member360Tabs component
3. **Lead conversion:** Create lead conversion page in CRM

## Files to Create

- `src/lib/hooks/use-member-attendance.ts`
- `src/lib/hooks/use-member-payments.ts`
- `src/lib/hooks/use-member-screenings.ts`
- `src/lib/hooks/use-member-pt-sessions.ts`
- `src/lib/hooks/use-member-diet.ts`
- `src/app/(app)/crm/leads/[id]/convert/page.tsx`

## Files to Modify

- `src/app/(app)/members/[id]/member-360-tabs.tsx` — add new tabs
- `src/lib/types/gym.ts` — add missing types (Attendance, Payment, Screening, PtSession, DietAssignment, FoodDiaryEntry)

## Backend Verification

**Existing Backend Endpoints (verified):**
- Lead conversion: `POST /leads/:id/convert`
- Assessments: `GET/POST /members/:memberId/assessments`
- Measurements: `GET/POST /members/:memberId/measurements`
- Fitness tests: `GET/POST /members/:memberId/fitness-tests`
- Screenings: `GET/POST /members/:memberId/screenings`
- Attendance: `GET /attendance?memberId=xxx`
- Payments: `GET /payments?memberId=xxx`
- PT Sessions: `GET /pt-sessions?memberId=xxx`
- Diet Assignments: `GET /diet-assignments?memberId=xxx`

**Missing Backend (NOT in scope for this task):**
- Food diary - no endpoint exists (will note as future work)
