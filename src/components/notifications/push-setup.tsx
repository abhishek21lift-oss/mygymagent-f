"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BellRing, Loader2, Smartphone, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Panel } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import {
  disableWebPush,
  enableWebPush,
  getPushStatus,
  listPushDevices,
  notificationPermission,
  PushPermissionDeniedError,
  PushSetupError,
  isNativeApp,
  pushUnavailableReason,
  removePushDevice,
  sendTestPush,
  storedPushDeviceId,
  storedPushToken,
  subscribePushState,
  webPushSupport,
  type PushUnavailableReason,
  type WebPushSupport,
} from "@/lib/push/web-push"

const DEVICES_KEY = ["push-devices"] as const

type Audience = "staff" | "member"

/**
 * Staff and members see the same states in different words. A member
 * cannot add a Firebase key and does not know what one is -- to them
 * "not set up" means "your gym doesn't offer this yet".
 */
const COPY = {
  staff: {
    title: "Push on this device",
    notConfigured: "Push isn't connected on this workspace yet. An owner needs to add the Firebase key to the server.",
    noWebConfig: "This version of the web app has no Firebase web configuration, so it can't register for push.",
    on: "Alerts you switch on in the Push column arrive here.",
    off: "Turn push on here, then pick which activity to push using the Push column above.",
  },
  member: {
    title: "Notifications on this device",
    notConfigured: "Your gym hasn't turned on push notifications yet.",
    noWebConfig: "Your gym hasn't turned on push notifications yet.",
    on: "The updates you've switched on above arrive here.",
    off: "Turn notifications on here, then choose what to receive using the switches above.",
  },
} as const

const UNAVAILABLE: Record<PushUnavailableReason, string> = {
  "ios-not-installed":
    "On iPhone, notifications work once the app is on your Home Screen: tap Share, then Add to Home Screen, then open it from there and come back to this page.",
  "ios-outdated": "Notifications need iOS 16.4 or later. Update your iPhone, then try again.",
  // A build of the app made without the Firebase config has no push plugin.
  "in-app": "This version of the app can't receive push. Update the app, or open this page in Chrome to get notifications on this phone.",
  browser: "This browser can't receive push. Try Chrome, Edge, Firefox or Safari.",
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof PushPermissionDeniedError || error instanceof PushSetupError)
    return error.message
  return error instanceof Error && error.message ? error.message : fallback
}

/**
 * Turning push on for this browser, and seeing where else it is on.
 *
 * Every state that stops push from working gets its own sentence, because
 * each one has a different fix and only one of them is a button: the
 * deployment has no Firebase key (the owner's job), this browser cannot
 * receive push (use another), notifications are blocked (browser
 * settings), or it is simply off (turn it on).
 *
 * The per-category Push switches above decide *what* is pushed; this
 * decides *where*. Both are needed, and the copy says so.
 */
export function PushSetup({ audience = "staff" }: { audience?: Audience } = {}) {
  const copy = COPY[audience]
  const queryClient = useQueryClient()
  // Everything here depends on `window`, so the server snapshot is null
  // and the client reads it after hydration. Serialised to a string so the
  // snapshot compares by value.
  const snapshot = React.useSyncExternalStore(
    subscribePushState,
    () =>
      JSON.stringify({
        support: webPushSupport(),
        reason: pushUnavailableReason(),
        native: isNativeApp(),
        permission: notificationPermission(),
        token: storedPushToken(),
        deviceId: storedPushDeviceId(),
      }),
    () => null,
  )
  const client = React.useMemo(
    () =>
      snapshot
        ? (JSON.parse(snapshot) as {
            support: WebPushSupport
            reason: PushUnavailableReason
            native: boolean
            permission: NotificationPermission | "unsupported"
            token: string | null
            deviceId: string | null
          })
        : null,
    [snapshot],
  )
  // Permission is decided in a browser prompt that fires no event here, so
  // after an enable/disable attempt the snapshot is re-read explicitly.
  const [, rerender] = React.useReducer((n: number) => n + 1, 0)
  const readClient = rerender

  const status = useQuery({ queryKey: ["push-status"], queryFn: getPushStatus, staleTime: 5 * 60 * 1000 })
  const devices = useQuery({ queryKey: DEVICES_KEY, queryFn: listPushDevices })

  const enable = useMutation({
    mutationFn: enableWebPush,
    onSuccess: () => toast.success("Push is on for this device"),
    onError: (error) => toast.error(errorMessage(error, "Could not turn push on")),
    onSettled: () => {
      readClient()
      void queryClient.invalidateQueries({ queryKey: DEVICES_KEY })
    },
  })
  const disable = useMutation({
    mutationFn: disableWebPush,
    onSuccess: () => toast.success("Push is off for this device"),
    onError: (error) => toast.error(errorMessage(error, "Could not turn push off")),
    onSettled: () => {
      readClient()
      void queryClient.invalidateQueries({ queryKey: DEVICES_KEY })
    },
  })
  const test = useMutation({
    mutationFn: sendTestPush,
    onSuccess: (result) => {
      const failed = result.results.filter((r) => !r.ok).length
      if (result.devices === 0) toast.error("No devices to send to")
      else if (failed === 0) toast.success(`Test sent to ${result.devices} device${result.devices === 1 ? "" : "s"}`)
      else toast.error(`${failed} of ${result.devices} devices could not be reached`)
      void queryClient.invalidateQueries({ queryKey: DEVICES_KEY })
    },
    onError: (error) => toast.error(errorMessage(error, "Could not send a test push")),
  })
  const remove = useMutation({
    mutationFn: removePushDevice,
    onError: (error) => toast.error(errorMessage(error, "Could not remove the device")),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: DEVICES_KEY }),
  })

  const activeDevices = (devices.data ?? []).filter((d) => d.active)
  const enabledHere = Boolean(client?.token) && client?.permission === "granted"
  const busy = enable.isPending || disable.isPending

  let state: { tone: "muted" | "warning" | "success"; label: string; detail: string }
  if (!client || status.isPending) {
    state = { tone: "muted", label: "Checking", detail: "Checking whether this device can receive push…" }
  } else if (status.isError) {
    state = {
      tone: "warning",
      label: "Unavailable",
      detail: "Push settings could not be loaded. Reload the page to try again.",
    }
  } else if (status.data && !status.data.configured) {
    state = {
      tone: "muted",
      label: "Not set up",
      detail: copy.notConfigured,
    }
  } else if (client.support === "unsupported") {
    state = {
      tone: "muted",
      label: client.reason === "ios-not-installed" ? "Add to Home Screen first" : "Unavailable here",
      detail: UNAVAILABLE[client.reason],
    }
  } else if (client.support === "unconfigured") {
    state = {
      tone: "muted",
      label: "Not set up",
      detail: copy.noWebConfig,
    }
  } else if (client.permission === "denied") {
    state = {
      tone: "warning",
      label: "Blocked",
      detail: client.native
        ? "Notifications are turned off for this app. Allow them in Android Settings → Apps → THE CULT CLIENT → Notifications, then come back here."
        : "Notifications are blocked for this site. Allow them in your browser's site settings, then come back here.",
    }
  } else if (enabledHere) {
    state = { tone: "success", label: "On for this device", detail: copy.on }
  } else {
    state = {
      tone: "muted",
      label: "Off for this device",
      detail: copy.off,
    }
  }

  const canEnable =
    client?.support === "supported" && client.permission !== "denied" && status.data?.configured === true && !enabledHere

  return (
    <Panel
      title={copy.title}
      titleId="push-setup"
      description="Alerts even when the app is closed."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <BellRing className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0" aria-live="polite">
              <Badge
                variant={state.tone === "success" ? "success" : state.tone === "warning" ? "warning" : "secondary"}
              >
                {state.label}
              </Badge>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{state.detail}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {canEnable && (
              <Button className="min-h-11" disabled={busy} onClick={() => enable.mutate()}>
                {enable.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Turn on for this device
              </Button>
            )}
            {enabledHere && (
              <>
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={test.isPending}
                  onClick={() => test.mutate()}
                >
                  {test.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Send test
                </Button>
                <Button variant="ghost" className="min-h-11" disabled={busy} onClick={() => disable.mutate()}>
                  {disable.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Turn off
                </Button>
              </>
            )}
          </div>
        </div>

        {activeDevices.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              Receiving push on {activeDevices.length} device{activeDevices.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {activeDevices.map((device) => (
                <li key={device.id} className="flex items-center justify-between gap-3 rounded-md px-1 py-1 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">
                      {device.id === client?.deviceId ? "This device · " : ""}
                      Added {new Date(device.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={
                      device.id === client?.deviceId
                        ? "Turn push off for this device"
                        : `Stop pushing to the device added ${new Date(device.createdAt).toLocaleDateString()}`
                    }
                    disabled={remove.isPending || busy}
                    // Removing this browser's own row goes through the full
                    // turn-off, or the panel would keep saying "On".
                    onClick={() => (device.id === client?.deviceId ? disable.mutate() : remove.mutate(device.id))}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  )
}
