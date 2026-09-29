import { api } from "@/lib/api/client"
import {
  listenForNativeTaps,
  nativePushAvailable,
  nativePushToken,
  NativePermissionDeniedError,
  resetNativeTapListenerForTests,
  safeInAppPath,
} from "@/lib/push/native-push"
import {
  disableWebPush,
  enableWebPush,
  PushPermissionDeniedError,
  refreshWebPush,
  storedPushToken,
  webPushSupport,
} from "@/lib/push/web-push"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

type Listener = (payload: unknown) => void
const listeners: Record<string, Listener[]> = {}
let permission = "prompt"
let permissionAnswer = "granted"
let issuedToken = "native-token-1"
let failRegistration = false

const plugin = {
  checkPermissions: jest.fn(async () => ({ receive: permission })),
  requestPermissions: jest.fn(async () => {
    permission = permissionAnswer
    return { receive: permission }
  }),
  createChannel: jest.fn(async () => undefined),
  register: jest.fn(async () => {
    setTimeout(() => {
      if (failRegistration) listeners.registrationError?.forEach((fn) => fn({ error: "SERVICE_NOT_AVAILABLE" }))
      else listeners.registration?.forEach((fn) => fn({ value: issuedToken }))
    }, 0)
  }),
  unregister: jest.fn(async () => undefined),
  addListener: jest.fn(async (event: string, fn: Listener) => {
    ;(listeners[event] ??= []).push(fn)
    return {
      remove: async () => {
        listeners[event] = (listeners[event] ?? []).filter((f) => f !== fn)
      },
    }
  }),
}
jest.mock("@capacitor/push-notifications", () => ({ PushNotifications: plugin }))

const mockPost = api.post as jest.Mock

function inApp({ plugin: available = true } = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Capacitor = {
    isNativePlatform: () => true,
    isPluginAvailable: (name: string) => available && name === "PushNotifications",
  }
}

beforeEach(() => {
  for (const key of Object.keys(listeners)) delete listeners[key]
  permission = "prompt"
  permissionAnswer = "granted"
  issuedToken = "native-token-1"
  failRegistration = false
  window.localStorage.clear()
  resetNativeTapListenerForTests()
  mockPost.mockImplementation(async (path: string) =>
    path === "/notifications/devices" ? { id: "device-app", active: true, createdAt: "" } : { removed: true },
  )
})

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Capacitor
})

describe("native push availability", () => {
  it("is available only in the app, and only in a build with the plugin", () => {
    expect(nativePushAvailable()).toBe(false)
    inApp({ plugin: false })
    expect(nativePushAvailable()).toBe(false)
    expect(webPushSupport()).toBe("unsupported")
    inApp()
    expect(nativePushAvailable()).toBe(true)
  })

  it("needs no Firebase web config in the app", () => {
    inApp()
    expect(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY).toBeUndefined()
    expect(webPushSupport()).toBe("supported")
  })
})

describe("nativePushToken", () => {
  it("asks Android for permission only when prompting is allowed", async () => {
    inApp()
    await expect(nativePushToken(false)).rejects.toBeInstanceOf(NativePermissionDeniedError)
    expect(plugin.requestPermissions).not.toHaveBeenCalled()

    await expect(nativePushToken(true)).resolves.toBe("native-token-1")
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
    expect(plugin.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: "general" }))
  })

  it("rejects with the plugin's registration error instead of hanging", async () => {
    inApp()
    permission = "granted"
    failRegistration = true
    await expect(nativePushToken(false)).rejects.toThrow("SERVICE_NOT_AVAILABLE")
    // Listeners are removed either way.
    expect(listeners.registration ?? []).toHaveLength(0)
  })
})

describe("web-push inside the app", () => {
  it("registers the native token with the API and remembers it", async () => {
    inApp()
    await expect(enableWebPush()).resolves.toBe("native-token-1")
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices", { token: "native-token-1" })
    expect(storedPushToken()).toBe("native-token-1")
  })

  it("points a refusal at Android settings, not browser settings", async () => {
    inApp()
    permissionAnswer = "denied"
    const error = await enableWebPush().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PushPermissionDeniedError)
    expect((error as Error).message).toMatch(/Android Settings/)
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("re-registers a rotated token on refresh without prompting", async () => {
    inApp()
    await enableWebPush()
    mockPost.mockClear()
    plugin.requestPermissions.mockClear()
    issuedToken = "native-token-2"
    await refreshWebPush()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices", { token: "native-token-2" })
  })

  it("stops claiming the device when notifications were turned off in Android", async () => {
    inApp()
    await enableWebPush()
    mockPost.mockClear()
    permission = "denied"
    await refreshWebPush()
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices/unregister", { token: "native-token-1" })
    expect(storedPushToken()).toBeNull()
  })

  it("turning off unregisters with the API and on the device", async () => {
    inApp()
    await enableWebPush()
    await disableWebPush()
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices/unregister", { token: "native-token-1" })
    expect(plugin.unregister).toHaveBeenCalled()
  })
})

describe("tapping a notification in the app", () => {
  it("accepts only paths inside the app", () => {
    expect(safeInAppPath("/portal/billing")).toBe("/portal/billing")
    expect(safeInAppPath("https://evil.example")).toBeNull()
    expect(safeInAppPath("//evil.example/x")).toBeNull()
    expect(safeInAppPath(undefined)).toBeNull()
  })

  it("navigates to the notification's page, and nowhere else", async () => {
    inApp()
    const navigate = jest.fn()
    listenForNativeTaps(navigate)
    listenForNativeTaps(navigate) // idempotent
    await new Promise((r) => setTimeout(r, 0))
    expect(listeners.pushNotificationActionPerformed).toHaveLength(1)

    const tap = (url: string) =>
      listeners.pushNotificationActionPerformed[0]({ actionId: "tap", notification: { data: { url } } })
    tap("/portal/visits")
    tap("https://evil.example/phish")
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith("/portal/visits")
  })
})
