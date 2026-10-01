/* THE CULT CLIENT push service worker.
 *
 * Deliberately free of the Firebase SDK. The page's CSP only allows
 * scripts from 'self', so `importScripts` from gstatic would be blocked,
 * and nothing here needs it: FCM delivers an ordinary Web Push message
 * whose JSON body is { notification: { title, body }, data, fcmOptions }.
 * Showing it and opening the right page on click is all that is required.
 *
 * The page registers this file and hands the registration to Firebase's
 * getToken(), so this is the worker that owns the push subscription.
 */

self.addEventListener("install", () => {
  // A new version should take over at once rather than wait for every
  // tab to close -- the handlers below are stateless.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { notification: { body: event.data ? event.data.text() : "" } }
  }

  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || "THE CULT CLIENT"
  // A relative link from the API (e.g. "/billing") travels in data.url;
  // an absolute one may come as fcmOptions.link.
  const url = data.url || (payload.fcmOptions && payload.fcmOptions.link) || "/dashboard"

  event.waitUntil(
    self.registration.showNotification(title, {
      body: notification.body || "",
      icon: "/brand/tcc-icon-192.png",
      badge: "/brand/tcc-badge-96.png",
      // Same type replaces rather than stacks, so a burst of low-stock
      // alerts reads as one current notice.
      tag: data.type || undefined,
      data: { url },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/dashboard",
    self.location.origin,
  )
  // Never navigate off-site, whatever the payload says.
  if (target.origin !== self.location.origin) return

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === target.origin && "focus" in client) {
          return client.focus().then((focused) => ("navigate" in focused ? focused.navigate(target.href) : focused))
        }
      }
      return self.clients.openWindow(target.href)
    }),
  )
})
