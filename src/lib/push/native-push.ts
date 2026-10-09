import type { PluginListenerHandle } from "@capacitor/core"
import type { PushNotificationsPlugin } from "@capacitor/push-notifications"
import { notificationPath } from "@/lib/notification-links"
import { safeNext } from "@/lib/auth/safe-next"

/**
 * Native push for the Android app.
 *
 * The app is a Capacitor WebView around this site, and WebView has no Push
 * API, so `web-push.ts` hands over to this file when it runs inside the
 * shell. The native plugin gets an FCM token from Firebase on the device;
 * the token is the same kind the API already sends to, so registration,
 * preferences and delivery are unchanged.
 *
 * The plugin is present only in builds made with the Firebase project's
 * google-services.json (see .github/workflows/android-apk.yml). A build
 * without it has no plugin, `nativePushAvailable()` is false, and the
 * settings panel says push isn't available in the app instead of offering
 * a button that could not work.
 *
 * Imported dynamically, so the browser build never loads the plugin.
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  isPluginAvailable?: (name: string) => boolean
}

function capacitor(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined
  return (window as { Capacitor?: CapacitorGlobal }).Capacitor
}

export function nativePushAvailable(): boolean {
  const cap = capacitor()
  return Boolean(cap?.isNativePlatform?.() && cap.isPluginAvailable?.("PushNotifications"))
}

async function plugin(): Promise<PushNotificationsPlugin> {
  const { PushNotifications } = await import("@capacitor/push-notifications")
  return PushNotifications
}

export type NativePermission = "granted" | "denied" | "default"

export async function nativePermission(): Promise<NativePermission> {
  const { receive } = await (await plugin()).checkPermissions()
  if (receive === "granted") return "granted"
  if (receive === "denied") return "denied"
  return "default"
}

export class NativePermissionDeniedError extends Error {
  constructor() {
    super("Notifications are turned off for this app. Allow them in Android Settings → Apps → Cult Client → Notifications.")
    this.name = "NativePermissionDeniedError"
  }
}

/** The Android channel notifications arrive on. Named, so the person sees
 * "Notifications" in the app's settings rather than "Miscellaneous". The
 * build points FCM's default channel at this id. */
export const NATIVE_CHANNEL_ID = "general"
const REGISTRATION_TIMEOUT_MS = 15_000

/**
 * The device's FCM token. `prompt` asks for permission when it is not yet
 * granted -- true only from the Turn on button; the per-session refresh
 * passes false and never prompts.
 */
export async function nativePushToken(prompt: boolean): Promise<string> {
  const push = await plugin()
  let { receive } = await push.checkPermissions()
  if (receive !== "granted" && prompt) ({ receive } = await push.requestPermissions())
  if (receive !== "granted") throw new NativePermissionDeniedError()

  await push
    .createChannel({ id: NATIVE_CHANNEL_ID, name: "Notifications", importance: 4, visibility: 1 })
    .catch(() => undefined)

  const handles: PluginListenerHandle[] = []
  const cleanup = () => handles.forEach((handle) => void handle.remove())
  try {
    return await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("The app did not receive a push token. Check the connection and try again.")),
        REGISTRATION_TIMEOUT_MS,
      )
      void (async () => {
        handles.push(
          await push.addListener("registration", (token) => {
            clearTimeout(timer)
            resolve(token.value)
          }),
          await push.addListener("registrationError", (error) => {
            clearTimeout(timer)
            reject(new Error(error.error || "Push registration failed"))
          }),
        )
        await push.register()
      })().catch((error: unknown) => {
        clearTimeout(timer)
        reject(error)
      })
    })
  } finally {
    cleanup()
  }
}

export async function unregisterNativePush(): Promise<void> {
  await (await plugin()).unregister()
}

/** A path inside this app, never another origin: the push payload is data,
 * and a tap must not become a way to open an arbitrary site. */
export function safeInAppPath(url: unknown): string | null {
  return safeNext(url)
}

let tapListener: Promise<PluginListenerHandle> | null = null

/**
 * Opens the notification's page when it is tapped. Registered once per app
 * run; the plugin keeps a tap that launched the app until a listener
 * arrives, so a cold start still lands on the right screen.
 */
export function listenForNativeTaps(navigate: (path: string) => void): void {
  if (!nativePushAvailable() || tapListener) return
  tapListener = plugin().then((push) =>
    push.addListener("pushNotificationActionPerformed", (action) => {
      const path = safeInAppPath((action.notification.data as { url?: unknown } | undefined)?.url)
      if (path) navigate(notificationPath(path))
    }),
  )
  tapListener.catch(() => {
    tapListener = null
  })
}

/** Test-only: forget the tap listener between cases. */
export function resetNativeTapListenerForTests(): void {
  tapListener = null
}
