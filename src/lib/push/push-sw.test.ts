import { readFileSync } from "fs"
import { join } from "path"
import { runInNewContext } from "vm"

/**
 * public/push-sw.js is plain JS served as-is, so it is exercised the way a
 * browser would run it: evaluated against a fake `self`, with its
 * registered handlers invoked directly.
 */

type Handler = (event: Record<string, unknown>) => void

function loadWorker() {
  const handlers: Record<string, Handler> = {}
  const showNotification = jest.fn(async () => undefined)
  const openWindow = jest.fn(async () => undefined)
  const windows: Array<{ url: string; focus: jest.Mock; navigate: jest.Mock }> = []
  const self = {
    addEventListener: (type: string, fn: Handler) => {
      handlers[type] = fn
    },
    skipWaiting: jest.fn(),
    location: { origin: "https://app.mygymagent.test" },
    registration: { showNotification },
    clients: {
      claim: jest.fn(),
      openWindow,
      matchAll: jest.fn(async () => windows),
    },
  }
  runInNewContext(readFileSync(join(process.cwd(), "public/push-sw.js"), "utf8"), { self, URL })
  return { handlers, showNotification, openWindow, windows }
}

async function dispatch(handler: Handler, event: Record<string, unknown>) {
  let pending: Promise<unknown> = Promise.resolve()
  handler({ ...event, waitUntil: (p: Promise<unknown>) => (pending = p) })
  await pending
}

describe("push service worker", () => {
  it("shows the FCM notification and keeps the link for the click", async () => {
    const worker = loadWorker()
    await dispatch(worker.handlers.push, {
      data: {
        json: () => ({
          notification: { title: "Payment recorded", body: "₹2,000 from Asha" },
          data: { type: "PAYMENT_RECORDED", url: "/billing" },
        }),
      },
    })
    expect(worker.showNotification).toHaveBeenCalledWith(
      "Payment recorded",
      expect.objectContaining({ body: "₹2,000 from Asha", tag: "PAYMENT_RECORDED", data: { url: "/billing" } }),
    )
  })

  it("still shows something for a payload that is not JSON", async () => {
    const worker = loadWorker()
    await dispatch(worker.handlers.push, {
      data: {
        json: () => {
          throw new Error("not json")
        },
        text: () => "plain text",
      },
    })
    expect(worker.showNotification).toHaveBeenCalledWith(
      "THE CULT CLIENT",
      expect.objectContaining({ body: "plain text" }),
    )
  })

  it("opens a relative link on this origin", async () => {
    const worker = loadWorker()
    await dispatch(worker.handlers.notificationclick, {
      notification: { close: jest.fn(), data: { url: "/billing" } },
    })
    expect(worker.openWindow).toHaveBeenCalledWith("https://app.mygymagent.test/billing")
  })

  it("refuses to navigate off-site, whatever the payload says", async () => {
    const worker = loadWorker()
    await dispatch(worker.handlers.notificationclick, {
      notification: { close: jest.fn(), data: { url: "https://evil.example/phish" } },
    })
    expect(worker.openWindow).not.toHaveBeenCalled()
  })

  it("reuses an open tab instead of opening another", async () => {
    const worker = loadWorker()
    const focused = { navigate: jest.fn(async () => undefined) }
    worker.windows.push({
      url: "https://app.mygymagent.test/dashboard",
      focus: jest.fn(async () => focused),
      navigate: jest.fn(),
    })
    await dispatch(worker.handlers.notificationclick, {
      notification: { close: jest.fn(), data: { url: "/crm" } },
    })
    expect(focused.navigate).toHaveBeenCalledWith("https://app.mygymagent.test/crm")
    expect(worker.openWindow).not.toHaveBeenCalled()
  })
})
