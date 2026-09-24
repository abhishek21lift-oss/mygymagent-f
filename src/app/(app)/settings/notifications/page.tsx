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
 getNotificationCategories,
 getNotificationPreferences,
 updateNotificationPreference,
 type NotificationPreference,
} from "@/lib/notifications"
import { ApiError } from "@/lib/api/client"
/**
 * Only the channels the server actually delivers on get a switch.
 *
 * This table used to offer five per category -- fifty switches, of which
 * forty wrote a column nothing reads: `NotificationsService` selects
 * `inApp` and nothing else, and `src/notifications/README.md` says so
 * outright ("WhatsApp/SMS/push have typed provider interfaces but no
 * implementation wired in yet"). A switch that saves a value no sender
 * consults is worse than an absent one: it is a promise the product does
 * not keep, and the footnote admitting as much sat below fifty controls
 * that looked live.
 *
 * They are named below the table instead, so the capability stays
 * visible as planned rather than pretended. When a sender starts reading
 * one of those columns, move it up here.
 */
const channels = [
 { key: "inApp", label: "In-app", icon: Bell },
] as const

const PENDING_CHANNELS = [
 { label: "Email", icon: Mail },
 { label: "WhatsApp", icon: MessageCircle },
 { label: "SMS", icon: Smartphone },
 { label: "Push", icon: Zap },
] as const

type ChannelKey = (typeof channels)[number]["key"]

function preferenceValue(preference: NotificationPreference | undefined, channel: ChannelKey) {
 if (!preference) return channel === "inApp" || channel === "email"
 return preference[channel]
}

export default function NotificationSettingsPage() {
 const queryClient = useQueryClient()
 // The catalog is the backend's, not a copy of it kept in step by hand:
 // a category added there shows up here without a frontend change, and a
 // category removed there stops offering a switch that saves nothing.
 const categories = useQuery({
 queryKey: ["notification-categories"],
 queryFn: getNotificationCategories,
 staleTime: 60 * 60 * 1000,
 })
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
 // The row the server stores still carries these columns; they
 // are simply not offered as switches while nothing sends on
 // them, so the optimistic copy just mirrors the defaults.
 email: true,
 whatsapp: false,
 sms: false,
 push: false,
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
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="notification-settings-title"
 icon={Bell}
 title="Notification preferences"
 description="Choose which activity reaches you and through which channels."
 actions={
 <Button asChild variant="outline" className="min-h-11 rounded-lg bg-card">
 <Link href="/settings"><ArrowLeft className="size-4" aria-hidden="true" /> Settings</Link>
 </Button>
 }
 />

 <Card className="overflow-hidden border-border bg-card">
 <CardContent className="p-0">
 <div>
 <div className="grid grid-cols-[1fr_5rem] items-center border-b border-border bg-stone-50/80 px-5 py-3">
 <div className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Activity</div>
 {channels.map(({ key, label, icon: Icon }) => (
 <div key={key} className="flex flex-col items-center gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-stone-500">
 <Icon className="size-4" aria-hidden="true" />
 {label}
 </div>
 ))}
 </div>

 {categories.isPending || preferences.isPending ? (
 <div className="space-y-4 p-6" role="status" aria-label="Loading notification preferences">
 {[1, 2, 3, 4].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-muted" />)}
 </div>
 ) : categories.isError || preferences.isError ? (
 <div className="p-8 text-center">
 <p className="text-sm font-semibold">Preferences could not be loaded.</p>
 <p className="mt-1 text-xs text-muted-foreground">Please retry without leaving this page.</p>
 <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { void categories.refetch(); void preferences.refetch() }}>Try again</Button>
 </div>
 ) : (
 <div>
 {(categories.data ?? []).map((category) => {
 const preference = preferenceMap.get(category.key)
 return (
 <div key={category.key} className="grid grid-cols-[1fr_5rem] items-center gap-0 border-b border-stone-100 px-5 py-4 last:border-b-0">
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

 <section aria-labelledby="pending-channels" className="rounded-lg border border-border bg-muted/40 p-4">
 <h2 id="pending-channels" className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Not delivering yet</h2>
 <p className="mt-1.5 text-xs leading-5 text-muted-foreground">These channels are built but not yet connected to a sender, so there is nothing here to switch on. They will appear in the table above once messages actually go out through them.</p>
 <ul className="mt-3 flex flex-wrap gap-2">
 {PENDING_CHANNELS.map(({ label, icon: Icon }) => (
 <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
 <Icon className="size-3.5" aria-hidden="true" />
 {label}
 </li>
 ))}
 </ul>
 </section>
 </div>
 </div>
 )
}
