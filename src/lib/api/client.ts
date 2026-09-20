import { getAccessToken, setAccessToken } from "./token-store"
import { getCurrentBranchId } from "@/lib/branch-context"

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL
if (!CONFIGURED_API_URL && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not configured — refusing to fall back to a hardcoded backend in production.",
  )
}
// No production fallback: the throw above guarantees a configured URL in
// prod, so any hardcoded host here would be dead code implying protection
// it does not provide. Development falls back to the local API.
const API_URL = CONFIGURED_API_URL ?? "http://localhost:4000"
const AUTH_PROXY_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"])
const REQUEST_TIMEOUT_MS = 20_000

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
    requestId?: string
  }
}

export class ApiError extends Error {
  code: string
  status: number
  details?: unknown
  requestId?: string

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message)
    this.name = "ApiError"
    this.code = body.error.code
    this.status = status
    this.details = body.error.details
    this.requestId = body.error.requestId
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | (string | number | boolean)[] | undefined>
  branchId?: string
  /** Internal: prevents infinite retry loops around a 401 refresh attempt. */
  _isRetry?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = globalThis.setTimeout
    ? globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : undefined
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    if (timer !== undefined) globalThis.clearTimeout(timer)
  }
}

/** Calls POST /auth/refresh through the same-origin BFF using the httpOnly
 * first-party cookie. Coalesces concurrent callers into a single in-flight
 * request so bootstrap and 401 recovery cannot rotate the refresh token
 * against each other. */
export async function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    const tokenAtStart = getAccessToken()

    try {
      const res = await fetchWithTimeout(buildUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        if (getAccessToken() === tokenAtStart) setAccessToken(null)
        return false
      }

      const json = (await res.json()) as { data?: { accessToken?: string } }
      const accessToken = json.data?.accessToken
      if (!accessToken) {
        if (getAccessToken() === tokenAtStart) setAccessToken(null)
        return false
      }

      if (getAccessToken() === tokenAtStart) setAccessToken(accessToken)
      return true
    } catch {
      if (getAccessToken() === tokenAtStart) setAccessToken(null)
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  // Browser auth mutations go through the Next.js same-origin BFF. Vercel
  // and Render are different sites, so a Render-hosted SameSite=None refresh
  // cookie is treated as a third-party cookie by some browsers (notably
  // Safari/iOS). The BFF keeps the refresh cookie first-party on the frontend
  // origin while forwarding it server-to-server.
  const baseUrl =
    typeof window !== "undefined" && AUTH_PROXY_PATHS.has(path)
      ? `${window.location.origin}/api/`
      : `${API_URL}/`
  const url = new URL(path.replace(/^\//, ""), baseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const item of value) url.searchParams.append(key, String(item))
        } else {
          url.searchParams.set(key, String(value))
        }
      }
    }
  }
  return url.toString()
}

/** Typed fetch wrapper around the API's `{ data, meta }` / `{ error }`
 * envelope. Automatically attaches the in-memory access token, retries once
 * through a silent refresh on 401, and always sends credentials so the
 * httpOnly refresh cookie is included on auth endpoints. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, branchId, _isRetry } = options
  const isFormData = body instanceof FormData

  const headers: Record<string, string> = {}
  if (!isFormData) headers["Content-Type"] = "application/json"
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const effectiveBranchId = branchId ?? getCurrentBranchId()
  if (effectiveBranchId) headers["x-branch-id"] = effectiveBranchId

  let res: Response
  try {
    res = await fetchWithTimeout(buildUrl(path, query), {
      method,
      headers,
      credentials: "include",
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, { error: { code: "REQUEST_TIMEOUT", message: `Request timed out: ${method} ${path}` } })
    }
    throw error
  }

  if (res.status === 401 && !_isRetry && path !== "/auth/refresh") {
    const refreshed = await refreshSession()
    if (refreshed) return apiFetch<T>(path, { ...options, _isRetry: true })
  }

  if (res.status === 204) return undefined as T

  let raw: unknown = null
  try {
    raw = await res.json()
  } catch {}

  if (!res.ok) {
    // Backend envelope is `{ error: { code, message, details?, requestId? } }`
    // but tolerate a bare `{ code, message }` shape too (defensive: proxies
    // or future endpoints may flatten it). Never drop code/message/details.
    const envelope =
      typeof raw === "object" && raw !== null && "error" in raw
        ? (raw as { error?: unknown }).error
        : raw
    const source =
      typeof envelope === "object" && envelope !== null
        ? (envelope as Record<string, unknown>)
        : {}
    const code = typeof source.code === "string" ? source.code : "UNKNOWN"
    const message =
      typeof source.message === "string" ? source.message : res.statusText
    throw new ApiError(
      res.status,
      {
        error: {
          code,
          message,
          details: source.details,
          requestId:
            typeof source.requestId === "string" ? source.requestId : undefined,
        },
      } as ApiErrorBody,
    )
  }

  if (typeof raw === "object" && raw !== null && "data" in raw && raw.data !== null && raw.data !== undefined) {
    return (raw as { data: T }).data
  }
  return (raw as T) ?? (({ code: "SUCCESS", message: "" } as { code: string; message: string }) as T)
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
}
