import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

/**
 * The WhatsApp Automation Control Center's server state: the per-key
 * switches, the gym's preferences, and the read-only irregular-members
 * preview. Every mutation patches one key at a time -- the API merges
 * partial updates, so saving one switch never rewrites the others.
 */

const KEYS = {
  settings: ["automation", "settings"] as const,
  profile: ["automation", "whatsapp-profile"] as const,
  irregular: (rangeDays: number | null) =>
    ["automation", "irregular-members", rangeDays] as const,
}

export type AutomationKey =
  | "BIRTHDAY_WISH"
  | "PAYMENT_OVERDUE_REMINDER"
  | "MEMBERSHIP_EXPIRY_ON_DAY"
  | "MEMBERSHIP_RENEWAL_REMINDER"
  | "MEMBERSHIP_POST_EXPIRY"
  | "MEMBER_INACTIVE_RECOVERY"
  | "LEAD_FIRST_TOUCH"
  | "INVOICE_DUE_REMINDER"
  | "PAYMENT_RECEIPT"

export interface AutomationSettingRow {
  key: string
  enabled: boolean
  channelOverride: "AUTO" | "WHATSAPP" | "EMAIL" | null
  cooldownDays: number | null
  quietHoursStart: string | null
  quietHoursEnd: string | null
  /** HH:mm in the gym's timezone; null means the scanner's own default. */
  runAt: string | null
  updatedAt: string | null
}

export type Salutation =
  | "Dear"
  | "Hello"
  | "Respected"
  | "Hi"
  | "Hey"
  | "Greetings"

export interface WhatsappProfile {
  organizationId: string
  salutation: Salutation
  autoResend: boolean
  maxResendAttempts: number
  defaultCountryCode: string
  customBillMessage: string | null
  irregularThresholdDays: number
  irregularCustomDays: number | null
  timezone: string
  updatedAt: string | null
}

export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "NONE"

export interface IrregularMember {
  id: string
  name: string
  phone: string | null
  email: string | null
  lastCheckInAt: string | null
  daysInactive: number
  subscriptionStatus: SubscriptionStatus
  membershipEndDate: string | null
}

export interface IrregularMembersReport {
  thresholdDays: number
  generatedAt: string
  members: IrregularMember[]
}

export function useAutomationSettings() {
  return useQuery({
    queryKey: KEYS.settings,
    queryFn: () => api.get<AutomationSettingRow[]>("/automation/settings"),
  })
}

/** Patch a single setting. Only the fields given are written, so two
 * saves racing (e.g. a switch flipped while a time is being edited) do
 * not clobber each other's keys. */
export function useUpdateAutomationSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      key,
      input,
    }: {
      key: string
      input: Partial<Pick<AutomationSettingRow, "enabled" | "runAt">>
    }) => api.patch<AutomationSettingRow>(`/automation/settings/${key}`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: KEYS.settings }),
  })
}

export function useWhatsappProfile() {
  return useQuery({
    queryKey: KEYS.profile,
    queryFn: () => api.get<WhatsappProfile>("/automation/whatsapp-profile"),
  })
}

export function useUpdateWhatsappProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<WhatsappProfile>) =>
      api.patch<WhatsappProfile>("/automation/whatsapp-profile", input),
    onSuccess: (data) =>
      queryClient.setQueryData(KEYS.profile, data),
  })
}

/**
 * The Irregular Members preview. Never sends anything -- it only reads.
 * `rangeDays` is the UI's Last 3/7/15/30 or a custom value; omitted, the
 * API uses the gym's saved threshold.
 */
export function useIrregularMembers(rangeDays: number | null, enabled = true) {
  return useQuery({
    queryKey: KEYS.irregular(rangeDays),
    queryFn: () =>
      api.get<IrregularMembersReport>("/automation/irregular-members", {
        ...(rangeDays === null ? {} : { query: { rangeDays } }),
      }),
    enabled,
  })
}