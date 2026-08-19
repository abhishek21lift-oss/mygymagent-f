/**
 * Holds the current access token in memory only (never localStorage/
 * sessionStorage, to keep it out of reach of an XSS payload). The refresh
 * token itself never touches JS at all -- it lives only in the httpOnly
 * cookie the backend sets on /auth/login, /auth/register, and /auth/refresh.
 */
let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

export function subscribeToAccessToken(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
