/**
 * Stores access token in localStorage for persistence across page refreshes.
 * The refresh token lives in httpOnly cookie (never accessible to JS).
 */
const STORAGE_KEY = "accessToken"

let accessToken: string | null = null
const listeners = new Set<(token: string | null) => void>()

function loadFromStorage(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEY)
}

function saveToStorage(token: string | null): void {
  if (typeof window === "undefined") return
  if (token === null) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, token)
  }
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  saveToStorage(token)
  for (const listener of listeners) listener(token)
}

export function subscribeToAccessToken(listener: (token: string | null) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

accessToken = loadFromStorage()
