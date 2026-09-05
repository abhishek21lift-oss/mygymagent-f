"use client"

import * as React from "react"
import { api, ApiError } from "@/lib/api/client"
import { getAccessToken, setAccessToken } from "@/lib/api/token-store"
import type { AuthUser, LoginResponse, MeResponse, RegisterResponse } from "@/lib/types/auth"
import type { LoginInput, RegisterInput } from "@/lib/validation/auth"

interface AuthContextValue {
  user: AuthUser | null
  permissions: string[]
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (key: string | string[]) => boolean
  refetchMe: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)
const AUTH_REFRESH_TIMEOUT_MS = 8000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const loadMe = React.useCallback(async (throwOnError = false): Promise<void> => {
    try {
      const me = await api.get<MeResponse>("/auth/me")
      setUser(me.user)
      setPermissions(me.permissions)
    } catch (error) {
      setUser(null)
      setPermissions([])
      if (throwOnError) throw error
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REFRESH_TIMEOUT_MS)

    async function bootstrap() {
      const tokenAtStart = getAccessToken()
      try {
        const refreshed = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
            signal: controller.signal,
          },
        )
        if (refreshed.ok) {
          const json = (await refreshed.json()) as { data: { accessToken: string } }
          setAccessToken(json.data.accessToken)
          if (!cancelled) await loadMe()
        } else if (getAccessToken() === tokenAtStart) {
          setAccessToken(null)
          if (!cancelled) setUser(null)
        }
      } catch {
        if (getAccessToken() === tokenAtStart) {
          setAccessToken(null)
          if (!cancelled) setUser(null)
        }
      } finally {
        window.clearTimeout(timeoutId)
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [loadMe])

  const login = React.useCallback(
    async (input: LoginInput) => {
      const res = await api.post<LoginResponse>("/auth/login", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      await loadMe(true)
    },
    [loadMe],
  )

  const register = React.useCallback(
    async (input: RegisterInput) => {
      const res = await api.post<RegisterResponse>("/auth/register", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      await loadMe(true)
    },
    [loadMe],
  )

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // Best effort; local auth state must still be cleared.
    }
    setAccessToken(null)
    setUser(null)
    setPermissions([])
  }, [])

  const hasPermission = React.useCallback(
    (key: string | string[]) =>
      Array.isArray(key) ? key.some((k) => permissions.includes(k)) : permissions.includes(key),
    [permissions],
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      hasPermission,
      refetchMe: loadMe,
    }),
    [user, permissions, isLoading, login, register, logout, hasPermission, loadMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}

export { ApiError }
