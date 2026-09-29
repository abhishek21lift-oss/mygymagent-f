import { api } from "@/lib/api/client"
import {
  disableWebPush,
  enableWebPush,
  PUSH_CHANGE_EVENT,
  PushPermissionDeniedError,
  PushSetupError,
  pushUnavailableReason,
  refreshWebPush,
  storedPushDeviceId,
  storedPushToken,
  unregisterPushOnSignOut,
  webPushSupport,
} from "@/lib/push/web-push"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const mockGetToken = jest.fn()
const mockDeleteToken = jest.fn()
jest.mock("firebase/app", () => ({
  getApps: () => [],
  initializeApp: jest.fn(() => ({ name: "app" })),
}))
jest.mock("firebase/messaging", () => ({
  getMessaging: jest.fn(() => ({ name: "messaging" })),
  getToken: (...args: unknown[]) => mockGetToken(...args),
  deleteToken: (...args: unknown[]) => mockDeleteToken(...args),
}))

const mockPost = api.post as jest.Mock
const registration = { scope: "/" }
const register = jest.fn()

const FIREBASE_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "api-key",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mga",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: "vapid-public-key",
}

function installBrowserPush(permission: NotificationPermission, answer: NotificationPermission = permission) {
  Object.defineProperty(window, "PushManager", { value: function PushManager() {}, configurable: true })
  Object.defineProperty(window, "Notification", {
    value: { permission, requestPermission: jest.fn(async () => answer) },
    configurable: true,
  })
  Object.defineProperty(navigator, "serviceWorker", {
    value: { register, ready: Promise.resolve(registration) },
    configurable: true,
  })
}

function removeBrowserPush() {
  for (const key of ["PushManager", "Notification"] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any)[key]
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (navigator as any).serviceWorker
}

beforeEach(() => {
  Object.assign(process.env, FIREBASE_ENV)
  window.localStorage.clear()
  register.mockResolvedValue(registration)
  mockGetToken.mockResolvedValue("fcm-token-1")
  mockPost.mockImplementation(async (path: string) =>
    path === "/notifications/devices" ? { id: "device-1", active: true, createdAt: "" } : { removed: true },
  )
})

afterEach(() => {
  removeBrowserPush()
  for (const key of Object.keys(FIREBASE_ENV)) delete process.env[key]
})

describe("webPushSupport", () => {
  it("is unsupported where there is no Push API, as in the Android WebView", () => {
    removeBrowserPush()
    expect(webPushSupport()).toBe("unsupported")
  })

  it("is unconfigured when the build has no Firebase web config", () => {
    installBrowserPush("default")
    delete process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    expect(webPushSupport()).toBe("unconfigured")
  })

  it("is supported with the Push API and all five config values", () => {
    installBrowserPush("default")
    expect(webPushSupport()).toBe("supported")
  })
})

describe("enableWebPush", () => {
  it("registers nothing when the user declines the prompt", async () => {
    installBrowserPush("default", "denied")
    await expect(enableWebPush()).rejects.toBeInstanceOf(PushPermissionDeniedError)
    expect(register).not.toHaveBeenCalled()
    expect(mockPost).not.toHaveBeenCalled()
    expect(storedPushToken()).toBeNull()
  })

  it("gets a token through our own service worker and registers it with the API", async () => {
    installBrowserPush("default", "granted")
    const changed = jest.fn()
    window.addEventListener(PUSH_CHANGE_EVENT, changed)

    await expect(enableWebPush()).resolves.toBe("fcm-token-1")

    expect(register).toHaveBeenCalledWith("/push-sw.js", { scope: "/" })
    // Our registration, not Firebase's default /firebase-messaging-sw.js,
    // which would need scripts the CSP does not allow.
    expect(mockGetToken).toHaveBeenCalledWith(expect.anything(), {
      vapidKey: "vapid-public-key",
      serviceWorkerRegistration: registration,
    })
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices", { token: "fcm-token-1" })
    expect(storedPushToken()).toBe("fcm-token-1")
    expect(storedPushDeviceId()).toBe("device-1")
    expect(changed).toHaveBeenCalled()
    window.removeEventListener(PUSH_CHANGE_EVENT, changed)
  })
})

describe("refreshWebPush", () => {
  async function enabled() {
    installBrowserPush("default", "granted")
    await enableWebPush()
    mockPost.mockClear()
    Object.defineProperty(window, "Notification", {
      value: { permission: "granted", requestPermission: jest.fn() },
      configurable: true,
    })
  }

  it("does nothing for a browser that never opted in", async () => {
    installBrowserPush("granted")
    await refreshWebPush()
    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("re-registers a token FCM rotated", async () => {
    await enabled()
    mockGetToken.mockResolvedValueOnce("fcm-token-2")
    await refreshWebPush()
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices", { token: "fcm-token-2" })
    expect(storedPushToken()).toBe("fcm-token-2")
  })

  it("leaves an unchanged token alone", async () => {
    await enabled()
    await refreshWebPush()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("stops claiming the device when permission was revoked in browser settings", async () => {
    await enabled()
    Object.defineProperty(window, "Notification", {
      value: { permission: "denied", requestPermission: jest.fn() },
      configurable: true,
    })
    await refreshWebPush()
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices/unregister", { token: "fcm-token-1" })
    expect(storedPushToken()).toBeNull()
    expect(mockGetToken).toHaveBeenCalledTimes(1)
  })
})

describe("signing out and turning off", () => {
  it("unregisters this browser's token on sign-out and forgets it", async () => {
    installBrowserPush("default", "granted")
    await enableWebPush()
    mockPost.mockClear()

    await unregisterPushOnSignOut()
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices/unregister", { token: "fcm-token-1" })
    expect(storedPushToken()).toBeNull()
    expect(storedPushDeviceId()).toBeNull()
  })

  it("makes no call when this browser never registered", async () => {
    await unregisterPushOnSignOut()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("never lets a hung API hold up sign-out", async () => {
    installBrowserPush("default", "granted")
    await enableWebPush()
    jest.useFakeTimers()
    mockPost.mockImplementation(() => new Promise(() => {}))
    const done = jest.fn()
    void unregisterPushOnSignOut().then(done)
    await jest.advanceTimersByTimeAsync(3000)
    expect(done).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it("turning off unregisters this browser and forgets its token", async () => {
    installBrowserPush("default", "granted")
    await enableWebPush()
    await disableWebPush()
    expect(mockPost).toHaveBeenCalledWith("/notifications/devices/unregister", { token: "fcm-token-1" })
    expect(storedPushToken()).toBeNull()
  })
})

describe("setup failures", () => {
  it("turns a browser subscribe error into a sentence a person can act on", async () => {
    installBrowserPush("default", "granted")
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
    mockGetToken.mockRejectedValueOnce(
      new DOMException("Failed to execute 'subscribe' on 'PushManager': The provided applicationServerKey is not valid."),
    )
    const error = await enableWebPush().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PushSetupError)
    expect((error as Error).message).not.toMatch(/PushManager|applicationServerKey/)
    expect(consoleError).toHaveBeenCalled()
    // Nothing half-registered.
    expect(mockPost).not.toHaveBeenCalled()
    expect(storedPushToken()).toBeNull()
    consoleError.mockRestore()
  })
})

describe("pushUnavailableReason", () => {
  const originalUA = navigator.userAgent
  function as(ua: string, opts: { touch?: number; standalone?: boolean } = {}) {
    Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true })
    Object.defineProperty(navigator, "maxTouchPoints", { value: opts.touch ?? 0, configurable: true })
    Object.defineProperty(window, "matchMedia", {
      value: () => ({ matches: Boolean(opts.standalone) }),
      configurable: true,
    })
  }
  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", { value: originalUA, configurable: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Capacitor
  })

  const IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"

  it("sends an iPhone in a Safari tab to the Home Screen", () => {
    as(IPHONE)
    expect(pushUnavailableReason()).toBe("ios-not-installed")
  })

  it("recognises an iPad, which reports itself as a Mac", () => {
    as("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", {
      touch: 5,
    })
    expect(pushUnavailableReason()).toBe("ios-not-installed")
  })

  it("blames the iOS version once the app is already installed", () => {
    as(IPHONE, { standalone: true })
    expect(pushUnavailableReason()).toBe("ios-outdated")
  })

  it("recognises the Android app shell", () => {
    as("Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).Capacitor = { isNativePlatform: () => true }
    expect(pushUnavailableReason()).toBe("in-app")
  })

  it("treats a desktop Mac without touch as just a browser", () => {
    as("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15")
    expect(pushUnavailableReason()).toBe("browser")
  })
})
