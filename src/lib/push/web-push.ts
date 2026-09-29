import { api } from "@/lib/api/client"

/**
 * Web push over FCM for the staff app.
 *
 * The API side (`/notifications/devices`, mygymagent-b B-P1-1) accepts an
 * FCM registration token and sends to it. This file is how a browser gets
 * one: ask for notification permission, register `/push-sw.js`, and hand
 * that registration to Firebase's `getToken()`.
 *
 * Firebase is imported only inside `enableWebPush`/`refreshWebPush`, so a
 * visitor who never turns push on never downloads it.
 *
 * Not covered here: the Android APK. It is a WebView around this site, and
 * Android WebView does not implement the Push API, so `webPushSupport()`
 * reports it unsupported. Native push there needs the Capacitor plugin and
 * the Firebase project's google-services.json in the build.
 */

export const PUSH_SERVICE_WORKER_URL = "/push-sw.js"
/** The token this browser registered, so sign-out can unregister it. An
 * FCM token only addresses this install; it grants nothing on the API. */
const TOKEN_STORAGE_KEY = "mga.push.token"
/** The API's row id for this browser, so the device list can say which
 * one is "this device" -- the API never returns tokens. */
const DEVICE_STORAGE_KEY = "mga.push.deviceId"
/** Fired on this window whenever the stored registration changes, so UI
 * reading it through useSyncExternalStore re-renders. */
export const PUSH_CHANGE_EVENT = "mga:push-change"

export interface FirebaseWebConfig {
  apiKey: string
  projectId: string
  messagingSenderId: string
  appId: string
  vapidKey: string
}

/** Public web config from the Firebase console. All five, or none: a
 * partial config fails inside getToken with an error nobody can act on. */
export function firebaseWebConfig(): FirebaseWebConfig | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
  }
  return Object.values(config).every(Boolean) ? config : null
}

export type WebPushSupport =
  /** No Push API here: an in-app WebView, or iOS Safari outside a
   * home-screen install. */
  | "unsupported"
  /** The browser could, but this build has no Firebase web config. */
  | "unconfigured"
  | "supported"

export function webPushSupport(): WebPushSupport {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported"
  }
  return firebaseWebConfig() ? "supported" : "unconfigured"
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
}

export function storedPushToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storedPushDeviceId(): string | null {
  try {
    return window.localStorage.getItem(DEVICE_STORAGE_KEY)
  } catch {
    return null
  }
}

function storePushToken(registration: { token: string; deviceId: string } | null) {
  try {
    if (registration) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, registration.token)
      window.localStorage.setItem(DEVICE_STORAGE_KEY, registration.deviceId)
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.localStorage.removeItem(DEVICE_STORAGE_KEY)
    }
    window.dispatchEvent(new Event(PUSH_CHANGE_EVENT))
  } catch {
    // Private mode or blocked storage: push still works this session; only
    // the sign-out unregister is lost, and the API re-homes the token on
    // the next sign-in anyway.
  }
}

/** For useSyncExternalStore: the storage event covers other tabs, the
 * custom event this one. */
export function subscribePushState(onChange: () => void): () => void {
  window.addEventListener(PUSH_CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(PUSH_CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export class PushPermissionDeniedError extends Error {
  constructor() {
    super("Notifications are blocked for this site. Allow them in your browser's site settings, then try again.")
    this.name = "PushPermissionDeniedError"
  }
}

/**
 * Setting up the subscription failed inside the browser or Firebase --
 * a bad VAPID key, Firebase unreachable, a blocked service worker. The
 * browser's own message ("Failed to execute 'subscribe' on
 * 'PushManager'…") means nothing to a gym owner, so it goes to the
 * console and the person gets a sentence they can act on.
 */
export class PushSetupError extends Error {
  constructor(readonly cause: unknown) {
    super("Push couldn't be set up in this browser. Try again, or use another browser. If it keeps happening, the workspace's Firebase web settings may be wrong.")
    this.name = "PushSetupError"
  }
}

async function messagingToken(config: FirebaseWebConfig): Promise<string> {
  try {
    return await fetchMessagingToken(config)
  } catch (error) {
    console.error("Push setup failed", error)
    throw new PushSetupError(error)
  }
}

async function fetchMessagingToken(config: FirebaseWebConfig): Promise<string> {
  const registration = await navigator.serviceWorker.register(PUSH_SERVICE_WORKER_URL, { scope: "/" })
  await navigator.serviceWorker.ready
  const [{ initializeApp, getApps }, { getMessaging, getToken }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ])
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: config.apiKey,
      projectId: config.projectId,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    })
  const token = await getToken(getMessaging(app), {
    vapidKey: config.vapidKey,
    serviceWorkerRegistration: registration,
  })
  if (!token) throw new Error("The browser did not issue a push token. Please try again.")
  return token
}

/**
 * Must be called from a user gesture: browsers refuse (or penalise) a
 * permission prompt that appears on page load, and it is the wrong moment
 * to ask anyway.
 */
export async function enableWebPush(): Promise<string> {
  const config = firebaseWebConfig()
  if (webPushSupport() !== "supported" || !config) {
    throw new Error("Push notifications aren't available in this browser.")
  }
  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new PushPermissionDeniedError()

  const token = await messagingToken(config)
  const device = await registerPushDevice(token)
  storePushToken({ token, deviceId: device.id })
  return token
}

/**
 * FCM rotates tokens now and then. Once per session, for a browser that
 * already opted in, fetch the current token and re-register it if it
 * changed. Never prompts: it does nothing unless permission is already
 * granted.
 */
export async function refreshWebPush(): Promise<void> {
  const previous = storedPushToken()
  const config = firebaseWebConfig()
  if (!previous || !config || webPushSupport() !== "supported") return
  if (Notification.permission !== "granted") {
    // Revoked in browser settings since: stop claiming this device.
    storePushToken(null)
    await unregisterPushDevice(previous).catch(() => undefined)
    return
  }
  const token = await messagingToken(config)
  if (token !== previous) {
    const device = await registerPushDevice(token)
    storePushToken({ token, deviceId: device.id })
  }
}

/** Turns push off for this browser only; other devices are untouched. */
export async function disableWebPush(): Promise<void> {
  const token = storedPushToken()
  storePushToken(null)
  if (token) await unregisterPushDevice(token)
  const config = firebaseWebConfig()
  if (!config || webPushSupport() !== "supported") return
  try {
    const [{ getApps }, { getMessaging, deleteToken }] = await Promise.all([
      import("firebase/app"),
      import("firebase/messaging"),
    ])
    const app = getApps()[0]
    if (app) await deleteToken(getMessaging(app))
  } catch {
    // The API no longer sends to this token either way.
  }
}

/**
 * Sign-out: stop this browser receiving the account's notifications. Best
 * effort and bounded -- signing out must never hang on it -- and it runs
 * while the session is still valid, since the endpoint is authenticated.
 */
export async function unregisterPushOnSignOut(): Promise<void> {
  const token = storedPushToken()
  if (!token) return
  storePushToken(null)
  await Promise.race([
    unregisterPushDevice(token).catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ])
}

/* ------------------------------------------------------------------- API */

export interface PushDevice {
  id: string
  active: boolean
  createdAt: string
}

export interface PushTestResult {
  devices: number
  results: Array<{ deviceId: string; ok: boolean; error?: string }>
}

export function getPushStatus() {
  return api.get<{ configured: boolean }>("/notifications/devices/status")
}
export function listPushDevices() {
  return api.get<PushDevice[]>("/notifications/devices")
}
export function registerPushDevice(token: string) {
  return api.post<PushDevice>("/notifications/devices", { token })
}
export function unregisterPushDevice(token: string) {
  return api.post<{ removed: boolean }>("/notifications/devices/unregister", { token })
}
export function removePushDevice(id: string) {
  return api.delete<{ removed: boolean }>(`/notifications/devices/${id}`)
}
export function sendTestPush() {
  return api.post<PushTestResult>("/notifications/devices/test")
}
