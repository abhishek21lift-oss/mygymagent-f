# Members Module Frontend Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Members module frontend by adding attendance history, payment history, PAR-Q screening, PT sessions, and diet plans tabs to Member 360, plus a lead conversion page in CRM.

**Architecture:** Add new tabs to existing Member360Tabs component. Each tab is a separate panel component. Use existing API endpoints (attendance, payments, screenings, pt-sessions, diet-assignments) with query filters. Create new hooks following the existing pattern.

**Tech Stack:** React, TanStack Query, Next.js App Router, shadcn/ui components

**Spec:** `docs/superpowers/specs/2026-09-06-members-frontend-completion.md`

---

## Task 1: Add Missing Types to gym.ts

**Files:**
- Modify: `src/lib/types/gym.ts`

**Interfaces:**
- Adds: `Attendance`, `Payment`, `MemberScreening`, `PtSession`, `DietAssignment`, `DietPlan`, `FoodItem`, `FoodDiaryEntry`, `WorkoutSession` types

- [ ] **Step 1: Add missing types to gym.ts**

Add these types to `src/lib/types/gym.ts` (append before the closing brace or find appropriate location):

```typescript
export type AttendanceMethod = "QR" | "MANUAL" | "KIOSK" | "APP" | "STAFF"

export interface Attendance {
  id: string
  organizationId: string
  branchId: string
  memberId: string | null
  staffUserId: string | null
  checkInAt: string
  checkOutAt: string | null
  method: AttendanceMethod
  recordedByUserId: string | null
  createdAt: string
  member?: { id: string; firstName: string; lastName: string } | null
  staffUser?: { id: string; firstName: string; lastName: string } | null
  branch?: { id: string; name: string }
}

export type PaymentMethod = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER"
export type PaymentStatus = "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED"

export interface Refund {
  id: string
  paymentId: string
  amount: string
  reason: string | null
  recordedByUserId: string | null
  createdAt: string
}

export interface Payment {
  id: string
  organizationId: string
  branchId: string
  memberId: string
  membershipId: string | null
  amount: string
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  note: string | null
  recordedByUserId: string | null
  createdAt: string
  member?: { id: string; firstName: string; lastName: string }
  membership?: Membership
  refunds?: Refund[]
}

export type PtSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

export interface PtSession {
  id: string
  organizationId: string
  memberId: string
  trainerId: string
  workoutPlanId: string | null
  branchId: string
  scheduledAt: string
  status: PtSessionStatus
  notes: string | null
  completedAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  member?: { id: string; firstName: string; lastName: string }
  trainer?: { id: string; firstName: string; lastName: string }
  workoutPlan?: { id: string; name: string }
  branch?: { id: string; name: string }
}

export interface DietPlan {
  id: string
  organizationId: string
  name: string
  description: string | null
  targetCalories: number | null
  targetProteinG: string | null
  targetCarbsG: string | null
  targetFatG: string | null
  createdAt: string
  updatedAt: string
}

export type DietAssignmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

export interface DietAssignment {
  id: string
  organizationId: string
  dietPlanId: string
  memberId: string
  assignedByUserId: string | null
  status: DietAssignmentStatus
  startDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
  dietPlan?: DietPlan
  member?: { id: string; firstName: string; lastName: string }
  assignedByUser?: { id: string; firstName: string; lastName: string }
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd /home/abhishek/Desktop/tcc/mygymagent-f && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/gym.ts
git commit -m "types: add Attendance, Payment, PtSession, DietAssignment types"
```

---

## Task 2: Create Attendance Hook

**Files:**
- Create: `src/lib/hooks/use-member-attendance.ts`

**Interfaces:**
- Consumes: `api` from `@/lib/api/client`, `Attendance` type
- Produces: `useMemberAttendance(memberId)` hook

- [ ] **Step 1: Create use-member-attendance.ts**

```typescript
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Attendance } from "@/lib/types/gym"

export function useMemberAttendance(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-attendance", memberId],
    queryFn: () => api.get<Attendance[]>("/attendance", { memberId }),
    enabled: !!memberId,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-member-attendance.ts
git commit -m "hooks: add useMemberAttendance hook"
```

---

## Task 3: Create Payments Hook

**Files:**
- Create: `src/lib/hooks/use-member-payments.ts`

**Interfaces:**
- Consumes: `api`, `Payment` type
- Produces: `useMemberPayments(memberId)` hook

- [ ] **Step 1: Create use-member-payments.ts**

```typescript
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Payment } from "@/lib/types/gym"

export function useMemberPayments(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: () => api.get<Payment[]>("/payments", { memberId }),
    enabled: !!memberId,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-member-payments.ts
git commit -m "hooks: add useMemberPayments hook"
```

---

## Task 4: Create Screening Hooks

**Files:**
- Create: `src/lib/hooks/use-member-screenings.ts`

**Interfaces:**
- Consumes: `api`, `MemberScreening` type
- Produces: `useMemberScreenings(memberId)`, `useCreateMemberScreening(memberId)` hooks

- [ ] **Step 1: Create use-member-screenings.ts**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { MemberScreening } from "@/lib/types/gym"

export function useMemberScreenings(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-screenings", memberId],
    queryFn: () => api.get<MemberScreening[]>(`/members/${memberId}/screenings`),
    enabled: !!memberId,
  })
}

export interface CreateScreeningInput {
  responses: Record<string, boolean>
  flaggedForMedicalClearance?: boolean
  notes?: string
}

export function useCreateMemberScreening(memberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateScreeningInput) =>
      api.post<MemberScreening>(`/members/${memberId}/screenings`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member-screenings", memberId] }),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-member-screenings.ts
git commit -m "hooks: add useMemberScreenings and useCreateMemberScreening hooks"
```

---

## Task 5: Create PT Sessions Hooks

**Files:**
- Create: `src/lib/hooks/use-member-pt-sessions.ts`

**Interfaces:**
- Consumes: `api`, `PtSession` type
- Produces: `useMemberPtSessions(memberId)` hook

- [ ] **Step 1: Create use-member-pt-sessions.ts**

```typescript
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { PtSession } from "@/lib/types/gym"

export function useMemberPtSessions(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-pt-sessions", memberId],
    queryFn: () => api.get<PtSession[]>("/pt-sessions", { memberId }),
    enabled: !!memberId,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-member-pt-sessions.ts
git commit -m "hooks: add useMemberPtSessions hook"
```

---

## Task 6: Create Diet Assignments Hook

**Files:**
- Create: `src/lib/hooks/use-member-diet.ts`

**Interfaces:**
- Consumes: `api`, `DietAssignment` type
- Produces: `useMemberDietAssignments(memberId)` hook

- [ ] **Step 1: Create use-member-diet.ts**

```typescript
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { DietAssignment } from "@/lib/types/gym"

export function useMemberDietAssignments(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-diet-assignments", memberId],
    queryFn: () => api.get<DietAssignment[]>("/diet-assignments", { memberId }),
    enabled: !!memberId,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-member-diet.ts
git commit -m "hooks: add useMemberDietAssignments hook"
```

---

## Task 7: Add Attendance Panel to Member 360

**Files:**
- Modify: `src/app/(app)/members/[id]/member-360-tabs.tsx`
- Import: `useMemberAttendance` from `@/lib/hooks/use-member-attendance`

**Interfaces:**
- Consumes: `Attendance` type, `useMemberAttendance` hook
- Produces: Adds `AttendancePanel` component and new tab

- [ ] **Step 1: Add imports and AttendancePanel component**

Add to imports section:
```typescript
import { useMemberAttendance } from "@/lib/hooks/use-member-attendance"
```

Add new panel component before the `export function Member360Tabs`:

```typescript
function AttendancePanel({ memberId }: { memberId: string }) {
  const query = useMemberAttendance(memberId)

  if (query.isLoading) return <Skeleton className="h-24 w-full" />

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No attendance history"
        description="Check-in history will appear here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {query.data.map((record) => (
        <div key={record.id} className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {new Date(record.checkInAt).toLocaleDateString()} {" "}
                {new Date(record.checkInAt).toLocaleTimeString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {record.method} • {record.branch?.name ?? "—"}
              </p>
            </div>
          </div>
          {record.checkOutAt && (
            <Badge variant="secondary">
              Out: {new Date(record.checkOutAt).toLocaleTimeString()}
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}
```

Add to TabsList (inside Member360Tabs function):
```typescript
<TabsTrigger value="attendance">Attendance</TabsTrigger>
```

Add to TabsContent:
```typescript
<TabsContent value="attendance">
  <AttendancePanel memberId={memberId} />
</TabsContent>
```

- [ ] **Step 2: Verify the file still compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/\[id\]/member-360-tabs.tsx
git commit -m "feat: add attendance tab to member 360"
```

---

## Task 8: Add Payments Panel to Member 360

**Files:**
- Modify: `src/app/(app)/members/[id]/member-360-tabs.tsx`
- Import: `useMemberPayments` from `@/lib/hooks/use-member-payments`

**Interfaces:**
- Consumes: `Payment` type, `useMemberPayments` hook
- Produces: Adds `PaymentsPanel` component and new tab

- [ ] **Step 1: Add imports and PaymentsPanel component**

Add to imports:
```typescript
import { useMemberPayments } from "@/lib/hooks/use-member-payments"
import { CreditCard, RefreshCw } from "lucide-react"
```

Add component:
```typescript
function PaymentsPanel({ memberId }: { memberId: string }) {
  const query = useMemberPayments(memberId)

  if (query.isLoading) return <Skeleton className="h-24 w-full" />

  const totalSpent = query.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No payments yet"
        description="Payment history will appear here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Total spent</p>
        <p className="text-2xl font-semibold">
          {query.data[0]?.currency ?? "USD"} {totalSpent.toLocaleString()}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {query.data.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {payment.currency} {Number(payment.amount).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payment.method} • {new Date(payment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={payment.status === "COMPLETED" ? "default" : "secondary"}>
                {payment.status}
              </Badge>
              {payment.status === "REFUNDED" && <RefreshCw className="size-4 text-muted-foreground" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Add to TabsList:
```typescript
<TabsTrigger value="payments">Payments</TabsTrigger>
```

Add to TabsContent:
```typescript
<TabsContent value="payments">
  <PaymentsPanel memberId={memberId} />
</TabsContent>
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/\[id\]/member-360-tabs.tsx
git commit -m "feat: add payments tab to member 360"
```

---

## Task 9: Add Screening/PAR-Q Panel to Member 360

**Files:**
- Modify: `src/app/(app)/members/[id]/member-360-tabs.tsx`
- Import: `useMemberScreenings`, `useCreateMemberScreening` from `@/lib/hooks/use-member-screenings`

**Interfaces:**
- Consumes: `useMemberScreenings`, `useCreateMemberScreening` hooks
- Produces: Adds `ScreeningPanel` component and new tab

- [ ] **Step 1: Add imports and ScreeningPanel component**

Add to imports:
```typescript
import { useMemberScreenings, useCreateMemberScreening } from "@/lib/hooks/use-member-screenings"
```

Add PAR-Q questions constant and component:
```typescript
const PAR_Q_QUESTIONS = [
  { key: "heartCondition", question: "Has a doctor ever said you have a heart condition?" },
  { key: "chestPain", question: "Do you experience chest pain during physical activity?" },
  { key: "dizziness", question: "Do you ever feel dizzy or faint?" },
  { key: "jointProblems", question: "Do you have joint or bone problems that may worsen with exercise?" },
  { key: "onMedication", question: "Are you currently taking any medication?" },
  { key: "pregnant", question: "Are you pregnant or possibly pregnant?" },
]

function ScreeningPanel({ memberId }: { memberId: string }) {
  const query = useMemberScreenings(memberId)
  const create = useCreateMemberScreening(memberId)
  const [open, setOpen] = React.useState(false)
  const [responses, setResponses] = React.useState<Record<string, boolean>>({})

  async function handleSubmit() {
    const flagged = Object.entries(responses).some(([, value]) => value)
    await create.mutateAsync({
      responses,
      flaggedForMedicalClearance: flagged,
    })
    toast.success("PAR-Q submitted")
    setOpen(false)
    setResponses({})
  }

  if (query.isLoading) return <Skeleton className="h-24 w-full" />

  const latestScreening = query.data?.[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              New PAR-Q
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>PAR-Q Health Screening</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {PAR_Q_QUESTIONS.map((q) => (
                <div key={q.key} className="flex items-center justify-between">
                  <span className="text-sm">{q.question}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={responses[q.key] === true ? "default" : "outline"}
                      onClick={() => setResponses({ ...responses, [q.key]: true })}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={responses[q.key] === false ? "default" : "outline"}
                      onClick={() => setResponses({ ...responses, [q.key]: false })}
                    >
                      No
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={create.isPending}>
                {create.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {latestScreening ? (
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Latest PAR-Q</p>
              <p className="text-sm text-muted-foreground">
                {new Date(latestScreening.completedAt).toLocaleDateString()}
              </p>
            </div>
            {latestScreening.flaggedForMedicalClearance && (
              <Badge variant="destructive">Medical clearance needed</Badge>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(latestScreening.responses).map(([key, value]) => (
              <Badge key={key} variant={value ? "destructive" : "secondary"}>
                {PAR_Q_QUESTIONS.find((q) => q.key === key)?.question.slice(0, 30)}: {value ? "Yes" : "No"}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No PAR-Q on file"
          description="Complete a PAR-Q health screening to document health history."
        />
      )}
    </div>
  )
}
```

Add to TabsList:
```typescript
<TabsTrigger value="screening">PAR-Q</TabsTrigger>
```

Add to TabsContent:
```typescript
<TabsContent value="screening">
  <ScreeningPanel memberId={memberId} />
</TabsContent>
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/\[id\]/member-360-tabs.tsx
git commit -m "feat: add PAR-Q screening tab to member 360"
```

---

## Task 10: Add PT Sessions Panel to Member 360

**Files:**
- Modify: `src/app/(app)/members/[id]/member-360-tabs.tsx`
- Import: `useMemberPtSessions` from `@/lib/hooks/use-member-pt-sessions`

**Interfaces:**
- Consumes: `useMemberPtSessions` hook, `PtSession` type
- Produces: Adds `PtSessionsPanel` component and new tab

- [ ] **Step 1: Add imports and PtSessionsPanel component**

Add to imports:
```typescript
import { useMemberPtSessions } from "@/lib/hooks/use-member-pt-sessions"
import { Dumbbell, Calendar } from "lucide-react"
```

Add component:
```typescript
function PtSessionsPanel({ memberId }: { memberId: string }) {
  const query = useMemberPtSessions(memberId)

  if (query.isLoading) return <Skeleton className="h-24 w-full" />

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No PT sessions"
        description="Book a personal training session to get started."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {query.data.map((session) => (
        <div key={session.id} className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {new Date(session.scheduledAt).toLocaleDateString()} at{" "}
                  {new Date(session.scheduledAt).toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.trainer?.firstName} {session.trainer?.lastName}
                  {session.workoutPlan && ` • ${session.workoutPlan.name}`}
                </p>
              </div>
            </div>
            <Badge
              variant={
                session.status === "COMPLETED"
                  ? "default"
                  : session.status === "CANCELLED"
                    ? "secondary"
                    : "outline"
              }
            >
              {session.status}
            </Badge>
          </div>
          {session.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

Add to TabsList:
```typescript
<TabsTrigger value="pt-sessions">PT Sessions</TabsTrigger>
```

Add to TabsContent:
```typescript
<TabsContent value="pt-sessions">
  <PtSessionsPanel memberId={memberId} />
</TabsContent>
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/\[id\]/member-360-tabs.tsx
git commit -m "feat: add PT sessions tab to member 360"
```

---

## Task 11: Add Nutrition Panel to Member 360

**Files:**
- Modify: `src/app/(app)/members/[id]/member-360-tabs.tsx`
- Import: `useMemberDietAssignments` from `@/lib/hooks/use-member-diet`

**Interfaces:**
- Consumes: `useMemberDietAssignments` hook, `DietAssignment` type
- Produces: Adds `NutritionPanel` component and new tab

- [ ] **Step 1: Add imports and NutritionPanel component**

Add to imports:
```typescript
import { useMemberDietAssignments } from "@/lib/hooks/use-member-diet"
import { UtensilsCrossed } from "lucide-react"
```

Add component:
```typescript
function NutritionPanel({ memberId }: { memberId: string }) {
  const query = useMemberDietAssignments(memberId)

  if (query.isLoading) return <Skeleton className="h-24 w-full" />

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No diet plans assigned"
        description="Assign a diet plan to help track nutrition."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {query.data.map((assignment) => (
        <div key={assignment.id} className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{assignment.dietPlan?.name}</p>
              <p className="text-sm text-muted-foreground">
                Started {new Date(assignment.startDate).toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant={
                assignment.status === "ACTIVE"
                  ? "default"
                  : assignment.status === "COMPLETED"
                    ? "secondary"
                    : "outline"
              }
            >
              {assignment.status}
            </Badge>
          </div>
          {assignment.dietPlan && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {assignment.dietPlan.targetCalories && (
                <span className="text-muted-foreground">
                  {assignment.dietPlan.targetCalories} kcal
                </span>
              )}
              {assignment.dietPlan.targetProteinG && (
                <span className="text-muted-foreground">
                  P: {assignment.dietPlan.targetProteinG}g
                </span>
              )}
              {assignment.dietPlan.targetCarbsG && (
                <span className="text-muted-foreground">
                  C: {assignment.dietPlan.targetCarbsG}g
                </span>
              )}
              {assignment.dietPlan.targetFatG && (
                <span className="text-muted-foreground">
                  F: {assignment.dietPlan.targetFatG}g
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

Add to TabsList:
```typescript
<TabsTrigger value="nutrition">Nutrition</TabsTrigger>
```

Add to TabsContent:
```typescript
<TabsContent value="nutrition">
  <NutritionPanel memberId={memberId} />
</TabsContent>
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/members/\[id\]/member-360-tabs.tsx
git commit -m "feat: add nutrition tab to member 360"
```

---

## Task 12: Create Lead Conversion Page

**Files:**
- Create: `src/app/(app)/crm/leads/[id]/convert/page.tsx`
- Create: `src/lib/hooks/use-lead.ts` (for fetching lead data)

**Interfaces:**
- Consumes: `Lead` type, `api`, `useMutation`
- Produces: New page component for lead conversion

- [ ] **Step 1: Create use-lead.ts hook**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Lead } from "@/lib/types/gym"

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.get<Lead>(`/leads/${id}`),
    enabled: !!id,
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { primaryBranchId: string; assignedTrainerId?: string } }) =>
      api.post<{ memberId: string }>(`/leads/${id}/convert`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
  })
}
```

- [ ] **Step 2: Create the convert page**

```typescript
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PageHeader } from "@/components/shared/page-header"
import { BranchSelect } from "@/components/shared/branch-select"
import { UserSelect } from "@/components/shared/user-select"
import { useLead, useConvertLead } from "@/lib/hooks/use-lead"
import { ApiError } from "@/lib/api/client"

export default function ConvertLeadPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const leadQuery = useLead(params.id)
  const convertMutation = useConvertLead()

  const lead = leadQuery.data

  const form = useForm<{ primaryBranchId: string; assignedTrainerId?: string }>({
    defaultValues: {
      primaryBranchId: lead?.branchId ?? "",
      assignedTrainerId: lead?.assignedToUserId ?? undefined,
    },
  })

  React.useEffect(() => {
    if (lead) {
      form.reset({
        primaryBranchId: lead.branchId ?? "",
        assignedTrainerId: lead.assignedToUserId ?? undefined,
      })
    }
  }, [lead, form])

  async function onSubmit(values: { primaryBranchId: string; assignedTrainerId?: string }) {
    try {
      const result = await convertMutation.mutateAsync({ id: params.id, dto: values })
      toast.success("Lead converted to member")
      router.push(`/members/${result.memberId}`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to convert lead")
    }
  }

  if (leadQuery.isLoading) {
    return <div>Loading...</div>
  }

  if (!lead) {
    return <div>Lead not found</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <PageHeader
        title="Convert Lead to Member"
        description={`${lead.firstName} ${lead.lastName} will become an active member.`}
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="mb-6 rounded-lg bg-muted/50 p-4">
            <h3 className="font-medium">Lead Information</h3>
            <p className="text-sm text-muted-foreground">
              {lead.firstName} {lead.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{lead.email ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{lead.phone ?? "—"}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="primaryBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <FormControl>
                      <BranchSelect value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTrainerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Trainer (optional)</FormLabel>
                    <FormControl>
                      <UserSelect value={field.value} onChange={field.onChange} filter="trainer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={convertMutation.isPending}>
                  {convertMutation.isPending ? "Converting..." : "Convert to Member"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors (may need UserSelect component - check if it exists)

- [ ] **Step 4: Commit**

```bash
git add src/lib/hooks/use-lead.ts
git add src/app/\(app\)/crm/leads/\[id\]/convert/page.tsx
git commit -m "feat: add lead conversion page in CRM"
```

---

## Task 13: Final Verification

**Files:**
- All modified files

- [ ] **Step 1: Run full typecheck**

Run: `cd /home/abhishek/Desktop/tcc/mygymagent-f && npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Verify login fix still works**

The auth-context fix from earlier should still be in place. Verify `src/lib/auth/auth-context.tsx` has the fix at line 38-40.

- [ ] **Step 4: Final commit for verification task**

```bash
git add -A
git commit -m "chore: verify all new features compile correctly"
```

---

## Summary

This plan creates:
1. New types for Attendance, Payment, PtSession, DietAssignment
2. New hooks: useMemberAttendance, useMemberPayments, useMemberScreenings, useCreateMemberScreening, useMemberPtSessions, useMemberDietAssignments
3. New tabs in Member 360: Attendance, Payments, PAR-Q, PT Sessions, Nutrition
4. Lead conversion page in CRM at `/crm/leads/[id]/convert`

**Execution approach:** Subagent-driven (recommended) - dispatch one subagent per task with code review between tasks.
