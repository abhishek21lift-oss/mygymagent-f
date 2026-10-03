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
  // Must start at the root, and must not start with `//` (protocol-relative)
  // or `/\` (which several browsers normalise into `//`).
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/\\")) return null;
  return value;
}
