"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, ChevronDown, CreditCard, HeartPulse, Home, Target, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getCurrentBranchId, setCurrentBranchId } from "@/lib/branch-context"
import {
  useAddMember,
  type Gender,
  type MemberType,
  type ParqAnswers,
  type PaymentMethod,
} from "@/lib/hooks/use-add-member"
import { useBranches } from "@/lib/hooks/use-branches"
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans"
import { useAssignableTrainers, useMembers } from "@/lib/hooks/use-members"
import type { Lead, MembershipPlan } from "@/lib/types/gym"
import { cn, displayCurrencyAmount } from "@/lib/utils"
import { LeadPicker } from "./lead-picker"
import { PhotoPicker } from "./photo-picker"

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
]

const MEMBER_TYPES: Array<{ value: MemberType; label: string }> = [
  { value: "GYM", label: "Gym" },
  { value: "PT", label: "Personal training" },
  { value: "GYM_PT", label: "Gym + PT" },
]

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank" },
]

const GOALS = [
  { value: "WEIGHT_LOSS", label: "Weight loss" },
  { value: "MUSCLE_GAIN", label: "Muscle gain" },
  { value: "STRENGTH", label: "Strength" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "GENERAL_FITNESS", label: "General fitness" },
]

const SOURCES = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "REFERRAL", label: "Referral" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE", label: "Google" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Other" },
]

const PARQ: Array<{ key: keyof ParqAnswers; label: string }> = [
  { key: "heartCondition", label: "Heart condition" },
  { key: "chestPain", label: "Chest pain during exercise" },
  { key: "dizziness", label: "Dizziness or fainting" },
  { key: "jointProblems", label: "Joint or bone problems" },
  { key: "onMedication", label: "Taking regular medication" },
  { key: "pregnant", label: "Pregnant" },
  { key: "otherConcerns", label: "Any other health concern" },
]

const NO_PARQ: ParqAnswers = {
  heartCondition: false,
  chestPain: false,
  dizziness: false,
  jointProblems: false,
  onMedication: false,
  pregnant: false,
  otherConcerns: false,
}

/** Today on the device's calendar, which at the desk is the gym's. */
function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function planLength(days: number) {
  if (days % 365 === 0) return days === 365 ? "1 year" : `${days / 365} years`
  if (days % 30 === 0) return days === 30 ? "1 month" : `${days / 30} months`
  return `${days} days`
}

function digits(value: string) {
  return value.replace(/\D/g, "")
}

interface FormState {
  lead: Lead | null
  branchId: string
  firstName: string
  lastName: string
  phone: string
  email: string
  gender: Gender | ""
  dateOfBirth: string
  photo: File | null
  planId: string
  startDate: string
  discount: string
  /** null until someone types an amount: then follows the price. */
  paid: string | null
  paymentMethod: PaymentMethod
  memberType: MemberType
  trainerId: string
  addressLine1: string
  city: string
  postalCode: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  fitnessGoal: string
  leadSource: string
  heightCm: string
  weightKg: string
  injuries: string
  medicalNotes: string
  parq: ParqAnswers
  waiver: boolean
}

const EMPTY: FormState = {
  lead: null,
  branchId: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  photo: null,
  planId: "",
  startDate: localToday(),
  discount: "",
  paid: null,
  paymentMethod: "CASH",
  memberType: "GYM",
  trainerId: "",
  addressLine1: "",
  city: "",
  postalCode: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  fitnessGoal: "",
  leadSource: "",
  heightCm: "",
  weightKg: "",
  injuries: "",
  medicalNotes: "",
  parq: NO_PARQ,
  waiver: false,
}

type Errors = Partial<Record<"firstName" | "lastName" | "phone" | "email" | "branchId" | "discount" | "paid" | "waiver", string>>

export function validate(form: FormState, plan: MembershipPlan | undefined): Errors {
  const errors: Errors = {}
  if (!form.firstName.trim()) errors.firstName = "Enter the first name."
  if (!form.lastName.trim()) errors.lastName = "Enter the last name."
  if (digits(form.phone).length < 10) errors.phone = "Enter a 10-digit mobile number."
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "This email doesn't look right."
  if (!form.branchId) errors.branchId = "Choose the branch."
  if (plan) {
    const price = Number(plan.price)
    const discount = Number(form.discount || 0)
    if (discount < 0 || discount > price) errors.discount = `Discount can be 0 to ${price}.`
    const paid = Number(form.paid ?? price - discount)
    if (paid < 0 || paid > price - Math.max(0, discount)) errors.paid = "Can't be more than the amount due."
  }
  if (!form.waiver) errors.waiver = "The member needs to agree to the terms."
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  allowClear,
}: {
  label: string
  options: Array<{ value: T; label: string }>
  value: T | ""
  onChange: (value: T | "") => void
  allowClear?: boolean
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected && allowClear ? "" : option.value)}
            className={cn(
              "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-surface-hover",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

/** Start from an enquiry: its details fill the form, and saving converts it. */
function withLead(prev: FormState, lead: Lead | null): FormState {
  if (!lead) return { ...prev, lead: null }
  return {
    ...prev,
    lead,
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone ?? prev.phone,
    email: lead.email ?? prev.email,
    leadSource: lead.source ?? prev.leadSource,
    branchId: lead.branchId ?? prev.branchId,
  }
}

export function AddMemberForm({ initialLead }: { initialLead?: Lead | null }) {
  const router = useRouter()
  const [draft, setForm] = React.useState<FormState>(() => withLead(EMPTY, initialLead ?? null))
  const [submitted, setSubmitted] = React.useState(false)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const addMember = useAddMember()

  const branches = useBranches({ pageSize: 100 })
  const plans = useMembershipPlans({ pageSize: 100 })
  const branchList = React.useMemo(() => branches.data?.items ?? [], [branches.data])

  // One branch, or the one the app is working in: no need to ask.
  const defaultBranchId = React.useMemo(() => {
    const current = getCurrentBranchId()
    const pick = branchList.find((b) => b.id === current) ?? (branchList.length === 1 ? branchList[0] : undefined)
    return pick?.id ?? ""
  }, [branchList])
  const form: FormState = draft.branchId ? draft : { ...draft, branchId: defaultBranchId }

  const trainers = useAssignableTrainers(form.branchId || undefined)
  const activePlans = (plans.data?.items ?? []).filter(
    (p) => p.isActive && (!p.branchId || !form.branchId || p.branchId === form.branchId),
  )
  const plan = activePlans.find((p) => p.id === form.planId)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyLead(lead: Lead | null) {
    setForm((prev) => withLead(prev, lead))
  }

  // Someone already on the books with this number.
  const phoneDigits = digits(form.phone).slice(-10)
  const sameNumber = useMembers({ search: phoneDigits, pageSize: 3 }, { enabled: phoneDigits.length === 10 })
  const existing = phoneDigits.length === 10 ? sameNumber.data?.items ?? [] : []

  const price = plan ? Number(plan.price) : 0
  // Shown clamped to the price; validation reports a discount beyond it.
  const discount = plan ? Math.min(price, Math.max(0, Number(form.discount || 0))) : 0
  const due = Math.max(0, price - discount)
  const paid = plan ? Number(form.paid ?? due) : 0
  const balance = Math.max(0, due - paid)
  const currency = plan?.currency ?? "INR"

  const errors = submitted ? validate(form, plan) : {}
  const initials = `${form.firstName.trim()[0] ?? ""}${form.lastName.trim()[0] ?? ""}`.toUpperCase()
  const healthFlag = Object.values(form.parq).some(Boolean)

  async function submit(event?: React.FormEvent) {
    event?.preventDefault()
    setSubmitted(true)
    const found = validate(form, plan)
    const first = Object.keys(found)[0]
    if (first) {
      const field = document.getElementById(`field-${first}`)
      field?.scrollIntoView({ behavior: "smooth", block: "center" })
      field?.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true })
      return
    }
    try {
      const { member, problems } = await addMember.mutateAsync({
        leadId: form.lead?.id,
        primaryBranchId: form.branchId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        memberType: form.memberType,
        assignedTrainerId: form.trainerId || undefined,
        leadSource: form.leadSource || undefined,
        fitnessGoal: form.fitnessGoal || undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        city: form.city.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        country: form.addressLine1 || form.city ? "India" : undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        emergencyContactRelationship: form.emergencyContactRelationship.trim() || undefined,
        injuries: form.injuries.trim() || undefined,
        medicalNotes: form.medicalNotes.trim() || undefined,
        waiverConsent: form.waiver,
        photo: form.photo,
        // Saved only when something is ticked: that is what flags the profile.
        parq: healthFlag ? form.parq : undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        membership: plan
          ? {
              planId: plan.id,
              startDate: form.startDate,
              discount,
              amountPaid: paid,
              paymentMethod: form.paymentMethod,
            }
          : undefined,
      })
      setCurrentBranchId(form.branchId)
      if (problems.length > 0) {
        toast.warning(`${member.firstName} is added, but some parts didn't save`, {
          description: `Not saved: ${problems.join("; ")}. Add them from the profile.`,
          duration: 10_000,
        })
      } else {
        toast.success(
          plan
            ? `${member.firstName} is added on ${plan.name}`
            : `${member.firstName} is added`,
        )
      }
      router.push(`/members/${member.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add the member")
    }
  }

  const submitLabel = addMember.isPending
    ? "Adding…"
    : plan && paid > 0
      ? `Add & collect ${displayCurrencyAmount(paid, currency, 0)}`
      : "Add member"

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <Section icon={UserRound} title="Member" hint="Name and mobile are enough to start.">
          <div className="flex flex-col gap-5">
            <LeadPicker lead={form.lead} onChange={applyLead} />
            <PhotoPicker photo={form.photo} onChange={(photo) => set("photo", photo)} initials={initials} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5" id="field-firstName">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  aria-invalid={errors.firstName ? true : undefined}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                />
                <FieldError id="firstName-error" message={errors.firstName} />
              </div>
              <div className="space-y-1.5" id="field-lastName">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  aria-invalid={errors.lastName ? true : undefined}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                />
                <FieldError id="lastName-error" message={errors.lastName} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5" id="field-phone">
                <Label htmlFor="phone">Mobile</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={errors.phone ? "phone-error" : existing.length ? "phone-existing" : undefined}
                />
                <FieldError id="phone-error" message={errors.phone} />
                {existing.length > 0 ? (
                  <p id="phone-existing" className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      Already a member:{" "}
                      {existing.map((m, i) => (
                        <React.Fragment key={m.id}>
                          {i > 0 ? ", " : null}
                          <Link href={`/members/${m.id}`} className="font-semibold underline underline-offset-2">
                            {m.firstName} {m.lastName}
                          </Link>
                        </React.Fragment>
                      ))}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5" id="field-email">
                <Label htmlFor="email">
                  Email <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <FieldError id="email-error" message={errors.email} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Chips label="Gender" options={GENDERS} value={form.gender} onChange={(v) => set("gender", v)} allowClear />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">
                  Date of birth <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  max={localToday()}
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </div>
            </div>

            {branchList.length > 1 || errors.branchId ? (
              <div className="space-y-1.5" id="field-branchId">
                <Label htmlFor="branch">Branch</Label>
                <Select value={form.branchId} onValueChange={(v) => setForm((prev) => ({ ...prev, branchId: v, trainerId: "", planId: "" }))}>
                  <SelectTrigger id="branch" className="w-full" aria-invalid={errors.branchId ? true : undefined}>
                    <SelectValue placeholder="Choose the branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchList.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="branch-error" message={errors.branchId} />
              </div>
            ) : null}
          </div>
        </Section>

        <Section icon={CreditCard} title="Membership & payment" hint="Pick a plan to start them today, or skip and sell one later.">
          <div className="flex flex-col gap-5">
            {plans.isLoading ? (
              <div className="grid gap-2 sm:grid-cols-2" aria-label="Loading plans">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : activePlans.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                No active plans yet.{" "}
                <Link href="/membership-plans" className="font-semibold text-primary underline-offset-2 hover:underline">
                  Create one
                </Link>{" "}
                to sell it here.
              </p>
            ) : (
              <div role="radiogroup" aria-label="Plan" className="grid gap-2 sm:grid-cols-2">
                {activePlans.map((p) => {
                  const selected = p.id === form.planId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          planId: selected ? "" : p.id,
                          discount: "",
                          paid: null,
                        }))
                      }
                      className={cn(
                        "flex min-h-[72px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-card hover:bg-surface-hover",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="block text-xs text-muted-foreground">{planLength(p.durationDays)}</span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {displayCurrencyAmount(p.price, p.currency, 0)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {plan ? (
              <div className="grid gap-4 rounded-xl bg-muted/50 p-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Starts</Label>
                  <Input id="startDate" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value || localToday())} />
                </div>
                <div className="space-y-1.5" id="field-discount">
                  <Label htmlFor="discount">Discount (₹)</Label>
                  <Input
                    id="discount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={price}
                    placeholder="0"
                    value={form.discount}
                    onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value, paid: null }))}
                    aria-invalid={errors.discount ? true : undefined}
                    aria-describedby={errors.discount ? "discount-error" : undefined}
                  />
                  <FieldError id="discount-error" message={errors.discount} />
                </div>
                <div className="space-y-1.5" id="field-paid">
                  <Label htmlFor="paid">Paid now (₹)</Label>
                  <Input
                    id="paid"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={due}
                    value={form.paid ?? String(due)}
                    onChange={(e) => set("paid", e.target.value)}
                    aria-invalid={errors.paid ? true : undefined}
                    aria-describedby={errors.paid ? "paid-error" : undefined}
                  />
                  <FieldError id="paid-error" message={errors.paid} />
                </div>
                {paid > 0 ? (
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label>Paid by</Label>
                    <Chips
                      label="Payment method"
                      options={PAYMENT_METHODS}
                      value={form.paymentMethod}
                      onChange={(v) => v && set("paymentMethod", v)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Training</Label>
                <Chips label="Training" options={MEMBER_TYPES} value={form.memberType} onChange={(v) => v && set("memberType", v)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trainer">
                  Trainer <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Select value={form.trainerId || "none"} onValueChange={(v) => set("trainerId", v === "none" ? "" : v)} disabled={!form.branchId}>
                  <SelectTrigger id="trainer" className="w-full">
                    <SelectValue placeholder="No trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No trainer</SelectItem>
                    {(trainers.data ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Section>

        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-controls="more-details"
            className="flex w-full items-center gap-3 p-4 text-left sm:px-6"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Home className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">More details</span>
              <span className="block text-xs text-muted-foreground">Address, emergency contact, goal and health. All optional.</span>
            </span>
            <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", moreOpen && "rotate-180")} aria-hidden="true" />
          </button>

          {moreOpen ? (
            <div id="more-details" className="flex flex-col gap-6 border-t border-border p-4 sm:p-6">
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold">Address</legend>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Street</Label>
                  <Input id="address" autoComplete="street-address" value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pin">PIN code</Label>
                  <Input id="pin" inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
                </div>
              </fieldset>

              <fieldset className="grid gap-4 sm:grid-cols-3">
                <legend className="mb-3 text-sm font-semibold">Emergency contact</legend>
                <div className="space-y-1.5">
                  <Label htmlFor="ecName">Name</Label>
                  <Input id="ecName" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ecPhone">Mobile</Label>
                  <Input id="ecPhone" type="tel" inputMode="tel" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ecRelation">Relation</Label>
                  <Input id="ecRelation" placeholder="Father, spouse…" value={form.emergencyContactRelationship} onChange={(e) => set("emergencyContactRelationship", e.target.value)} />
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-4">
                <legend className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Target className="size-4 text-muted-foreground" aria-hidden="true" /> Goal & how they found us
                </legend>
                <Chips label="Goal" options={GOALS} value={form.fitnessGoal} onChange={(v) => set("fitnessGoal", v)} allowClear />
                <Chips label="Source" options={SOURCES} value={form.leadSource} onChange={(v) => set("leadSource", v)} allowClear />
              </fieldset>

              <fieldset className="flex flex-col gap-4">
                <legend className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <HeartPulse className="size-4 text-muted-foreground" aria-hidden="true" /> Health
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" inputMode="decimal" min={0} value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" inputMode="decimal" min={0} value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tick anything that applies (PAR-Q).</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PARQ.map((q) => (
                      <label key={q.key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-hover">
                        <Checkbox
                          checked={form.parq[q.key]}
                          onCheckedChange={(checked) =>
                            setForm((prev) => ({
                              ...prev,
                              parq: { ...prev.parq, [q.key]: checked === true },
                            }))
                          }
                        />
                        {q.label}
                      </label>
                    ))}
                  </div>
                  {healthFlag ? (
                    <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      Ask for a doctor&apos;s clearance before hard training. The profile will be flagged.
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="injuries">Injuries or limits</Label>
                    <Textarea id="injuries" rows={2} value={form.injuries} onChange={(e) => set("injuries", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="medical">Medical notes</Label>
                    <Textarea id="medical" rows={2} value={form.medicalNotes} onChange={(e) => set("medicalNotes", e.target.value)} />
                  </div>
                </div>
              </fieldset>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5 lg:sticky lg:top-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary" aria-hidden="true">
            {initials || <UserRound className="size-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : "New member"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{form.phone || "No mobile yet"}</p>
          </div>
        </div>

        {plan ? (
          <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{plan.name}</dt>
              <dd className="tabular-nums">{displayCurrencyAmount(price, currency, 0)}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">− {displayCurrencyAmount(discount, currency, 0)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Paid now</dt>
              <dd className="tabular-nums">{displayCurrencyAmount(paid, currency, 0)}</dd>
            </div>
            <div className="flex justify-between gap-3 pt-1 font-semibold">
              <dt>Balance due</dt>
              <dd className={cn("tabular-nums", balance > 0 && "text-amber-700 dark:text-amber-400")}>
                {displayCurrencyAmount(balance, currency, 0)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">No plan picked. You can sell one from the profile later.</p>
        )}

        <div id="field-waiver" className="space-y-1.5 border-t border-border pt-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <Checkbox
              checked={form.waiver}
              onCheckedChange={(checked) => set("waiver", checked === true)}
              aria-invalid={errors.waiver ? true : undefined}
              aria-describedby={errors.waiver ? "waiver-error" : undefined}
              className="mt-0.5"
            />
            <span>The member agrees to the gym&apos;s rules and liability waiver.</span>
          </label>
          <FieldError id="waiver-error" message={errors.waiver} />
        </div>

        <div className="hidden flex-col gap-2 lg:flex">
          <Button type="submit" size="lg" disabled={addMember.isPending} className="w-full">
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/members")} disabled={addMember.isPending}>
            Cancel
          </Button>
        </div>
      </aside>

      {/* Phones and tablets: the button stays in reach above the tab bar
          for the whole form, not just once the summary scrolls in. */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-10 flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pl-4 shadow-[var(--shadow-float)] md:bottom-4 lg:hidden">
        <div className="min-w-0 flex-1 text-sm">
          {plan ? (
            <>
              <p className="truncate font-semibold">{plan.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                Due {displayCurrencyAmount(balance, currency, 0)}
              </p>
            </>
          ) : (
            <p className="truncate text-muted-foreground">No plan</p>
          )}
        </div>
        <Button type="submit" disabled={addMember.isPending} className="shrink-0">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
