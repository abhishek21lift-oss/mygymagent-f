/**
 * Holds the access token in memory only — never in localStorage/sessionStorage.
 *
 * Rationale: any XSS payload (or compromised third-party script) can read
 * localStorage and exfiltrate a long-lived token. An in-memory variable is
 * cleared on reload and unreachable across tabs, so theft requires live JS
 * execution at the moment a token exists. The refresh token lives in an
 * httpOnly cookie (never accessible to JS); AuthProvider bootstraps the
 * session on load via POST /auth/refresh with credentials: 'include'.
 */

let accessToken: string | null = null
const listeners = new Set<(token: string | null) => void>()

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  for (const listener of listeners) listener(token)
}

export function subscribeToAccessToken(listener: (token: string | null) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
