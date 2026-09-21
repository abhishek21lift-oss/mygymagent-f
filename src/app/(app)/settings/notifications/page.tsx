"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Bell, Mail, MessageCircle, Smartphone, Zap } from "lucide-react"
import { toast } from "sonner"

import { PageHero } from "@/components/shared/page-hero"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  getNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreference,
} from "@/lib/notifications"
import { ApiError } from "@/lib/api/client"

const categories = [
  { key: "MEMBER_CREATED", label: "New members", description: "When a member is added to your organization." },
  { key: "MEMBERSHIP_STARTED", label: "Memberships started", description: "When a member starts a membership." },
  { key: "MEMBERSHIP_CANCELLED", label: "Memberships cancelled", description: "When a membership is cancelled." },
  { key: "ATTENDANCE_RECORDED", label: "Attendance", description: "When attendance is recorded." },
  { key: "PAYMENT_RECORDED", label: "Payments", description: "When a payment is recorded." },
  { key: "PAYMENT_REFUNDED", label: "Refunds", description: "When a payment refund is recorded." },
  { key: "LEAD_CREATED", label: "New leads", description: "When a CRM lead is created." },
  { key: "LEAD_CONVERTED", label: "Lead conversions", description: "When a lead becomes a member." },
  { key: "WORKOUT_ASSIGNED", label: "Workout assignments", description: "When a workout is assigned." },
  { key: "WORKOUT_SESSION_STARTED", label: "Workout started", description: "When a member starts a workout session." },
  { key: "WORKOUT_SESSION_COMPLETED", label: "Workout completed", description: "When a workout session is completed." },
  { key: "DIET_ASSIGNED", label: "Diet assignments", description: "When a diet plan is assigned." },
  { key: "INVENTORY_LOW", label: "Low inventory", description: "When a product reaches its reorder threshold." },
  { key: "PT_SESSION_BOOKED", label: "PT bookings", description: "When a PT session is booked." },
  { key: "PT_SESSION_COMPLETED", label: "PT completed", description: "When a PT session is completed." },
  { key: "PT_SESSION_CANCELLED", label: "PT cancellations", description: "When a PT session is cancelled." },
  { key: "WHATSAPP_RECEIVED", label: "WhatsApp", description: "When a WhatsApp message is received." },
] as const

const channels = [
  { key: "inApp", label: "In-app", icon: Bell },
  { key: "email", label: "Email", icon: Mail },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "sms", label: "SMS", icon: Smartphone },
  { key: "push", label: "Push", icon: Zap },
] as const

type ChannelKey = (typeof channels)[number]["key"]

function preferenceValue(preference: NotificationPreference | undefined, channel: ChannelKey) {
  if (!preference) return channel === "inApp" || channel === "email"
  return preference[channel]
}

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient()
  const preferences = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
  })

  const update = useMutation({
    mutationFn: ({ category, channel, value }: { category: string; channel: ChannelKey; value: boolean }) =>
      updateNotificationPreference(category, { [channel]: value }),
    onMutate: async ({ category, channel, value }) => {
      await queryClient.cancelQueries({ queryKey: ["notification-preferences"] })
      const previous = queryClient.getQueryData<NotificationPreference[]>(["notification-preferences"])
      queryClient.setQueryData<NotificationPreference[]>(["notification-preferences"], (current = []) => {
        const existing = current.find((item) => item.category === category)
        if (!existing) {
          return [
            ...current,
            {
              id: `optimistic-${category}`,
              organizationId: "",
              userId: "",
              category,
              inApp: channel === "inApp" ? value : true,
              email: channel === "email" ? value : true,
              whatsapp: channel === "whatsapp" ? value : false,
              sms: channel === "sms" ? value : false,
              push: channel === "push" ? value : false,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ]
        }
        return current.map((item) => (item.category === category ? { ...item, [channel]: value } : item))
      })
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["notification-preferences"], context.previous)
      toast.error(error instanceof ApiError ? error.message : "Failed to save notification preference")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  })

  const preferenceMap = React.useMemo(
    () => new Map((preferences.data ?? []).map((item) => [item.category, item])),
    [preferences.data],
  )

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%)]" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-6 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="notification-settings-title"
          icon={Bell}
          title="Notification preferences"
          description="Choose which activity reaches you and through which channels."
          variant="light"
          accent="indigo"
          actions={
            <Button asChild variant="outline" className="min-h-11 rounded-2xl bg-white/80">
              <Link href="/settings"><ArrowLeft className="size-4" aria-hidden="true" /> Settings</Link>
            </Button>
          }
        />

        <Card className="overflow-hidden border-white/80 bg-white/85 shadow-xl shadow-indigo-900/5 backdrop-blur-xl">
          <CardContent className="overflow-x-auto p-0">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[minmax(18rem,1fr)_repeat(5,6rem)] items-center border-b border-stone-200/80 bg-stone-50/80 px-5 py-3">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Activity</div>
                {channels.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex flex-col items-center gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </div>

              {preferences.isPending ? (
                <div className="space-y-4 p-6" role="status" aria-label="Loading notification preferences">
                  {[1, 2, 3, 4].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : preferences.isError ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold">Preferences could not be loaded.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Please retry without leaving this page.</p>
                  <Button variant="outline" className="mt-4 rounded-xl" onClick={() => preferences.refetch()}>Try again</Button>
                </div>
              ) : (
                <div>
                  {categories.map((category) => {
                    const preference = preferenceMap.get(category.key)
                    return (
                      <div key={category.key} className="grid grid-cols-[minmax(18rem,1fr)_repeat(5,6rem)] items-center gap-0 border-b border-stone-100 px-5 py-4 last:border-b-0">
                        <div className="pr-5">
                          <div className="text-sm font-bold text-stone-900">{category.label}</div>
                          <div className="mt-1 text-xs leading-5 text-stone-500">{category.description}</div>
                        </div>
                        {channels.map(({ key }) => (
                          <div key={key} className="flex justify-center">
                            <Switch
                              checked={preferenceValue(preference, key)}
                              disabled={update.isPending}
                              onCheckedChange={(value) => update.mutate({ category: category.key, channel: key, value })}
                              aria-label={`${category.label}: ${key}`}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-900">
          Email, WhatsApp, SMS, and Push switches store your communication preferences. Delivery for channels that are not implemented is not simulated.
        </div>
      </div>
    </div>
  )
}
