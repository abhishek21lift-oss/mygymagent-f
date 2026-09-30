/**
 * Where a notification's link should open.
 *
 * Notifications keep the link they were created with, and some older ones
 * point at pages that never existed (the WhatsApp inbox, a PT session, a
 * single product). Those land on the page that shows the same thing, so
 * tapping an old alert never ends on "This page does not exist".
 */
const LEGACY_LINKS: Array<[RegExp, string]> = [
  [/^\/whatsapp(\/inbox)?\/?$/, "/settings/whatsapp#inbox"],
  [/^\/pt\/sessions(\/[^/]+)?\/?$/, "/pt-operations/sessions"],
  // `/inventory/products/new` is a real page; any other product id is not.
  [/^\/inventory\/products\/(?!new(?:\/|$))[^/]+\/?$/, "/inventory/reorder"],
]

export function notificationPath(url: string): string {
  const [path] = url.split(/[?#]/, 1)
  for (const [pattern, target] of LEGACY_LINKS) {
    if (pattern.test(path)) return target
  }
  return url
}
