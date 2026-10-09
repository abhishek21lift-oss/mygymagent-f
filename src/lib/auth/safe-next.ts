/**
 * Validates a `?next=` destination read from the login page.
 *
 * The login page honours an intent ("I came here to reach the Command
 * Center"), which makes this string attacker-controllable input that ends
 * up in a router call. Unvalidated, `?next=//evil.com` is an open redirect:
 * browsers treat a protocol-relative URL as absolute and send the visitor
 * off-site, Referer and all.
 *
 * Deliberately a strict allow-shape rather than a blocklist -- there is no
 * list of unsafe hosts to keep up to date, only one shape that is safe.
 * Returns null for anything else, and the caller falls back to the normal
 * post-login destination.
 */
export function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  // URL parsing drops tabs and newlines and reads `\` as `/`, so
  // `/\t/evil.com` and `/\evil.com` both become `//evil.com`. No path in
  // this app needs either.
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;
  // Then let the URL parser have the last word: whatever it makes of the
  // string must still be on this origin.
  let resolved: URL;
  try {
    resolved = new URL(value, SAME_ORIGIN);
  } catch {
    return null;
  }
  if (resolved.origin !== SAME_ORIGIN) return null;
  return value;
}

const SAME_ORIGIN = "https://same-origin.invalid";
