import { getAccessToken, setAccessToken } from "./token-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
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
    this.status = status
    this.code = body.error.code
    this.details = body.error.details
    this.requestId = body.error.requestId
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  branchId?: string
  /** Internal: prevents infinite retry loops around a 401 refresh attempt. */
  _isRetry?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

/** Calls POST /auth/refresh using the httpOnly cookie. Coalesces concurrent
 * callers into a single in-flight request so a burst of 401s doesn't fire
 * a refresh storm. */
async function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        setAccessToken(null)
        return false
      }
      const json = (await res.json()) as { data: { accessToken: string } }
      setAccessToken(json.data.accessToken)
      return true
    } catch {
      setAccessToken(null)
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.replace(/^\//, ""), `${API_URL}/`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
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
  if (branchId) headers["x-branch-id"] = branchId

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

  const json = (await res.json().catch(() => null)) as { data: T } | ApiErrorBody | null

  if (!res.ok) {
    throw new ApiError(res.status, (json as ApiErrorBody) ?? {
      error: { code: "UNKNOWN", message: res.statusText },
    })
  }

  return (json as { data: T }).data
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
