/** Exact origins allowed to drive the Meta embedded-signup `postMessage`
 * flow. A substring match (e.g. `origin.includes("facebook.com")`) would
 * also accept `https://evilfacebook.com` -- compare the full origin
 * instead. */
export const META_MESSAGE_ORIGINS: ReadonlySet<string> = new Set([
  "https://www.facebook.com",
  "https://web.facebook.com",
  "https://m.facebook.com",
])

export function isAllowedMetaMessageOrigin(origin: string): boolean {
  return META_MESSAGE_ORIGINS.has(origin)
}
