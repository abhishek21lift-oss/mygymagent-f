"use client"

import * as React from "react"
import { api, ApiError } from "@/lib/api/client"
import { setAccessToken } from "@/lib/api/token-store"
import type { AuthUser, LoginResponse, MeResponse, RegisterResponse } from "@/lib/types/auth"
import type { LoginInput, RegisterInput } from "@/lib/validation/auth"

interface AuthContextValue {
  user: AuthUser | null
  permissions: string[]
  /** True while the initial session bootstrap (silent refresh + /auth/me) is running. */
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (key: string) => boolean
  refetchMe: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const loadMe = React.useCallback(async () => {
    try {
      const me = await api.get<MeResponse>("/auth/me")
      setUser(me.user)
      setPermissions(me.permissions)
    } catch {
      setUser(null)
      setPermissions([])
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      // No access token in memory yet (fresh page load) -- try the silent
      // refresh flow against the httpOnly cookie before giving up.
      try {
        const refreshed = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/refresh`,
          { method: "POST", credentials: "include" },
        )
        if (refreshed.ok) {
          const json = (await refreshed.json()) as { data: { accessToken: string } }
          setAccessToken(json.data.accessToken)
          if (!cancelled) await loadMe()
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [loadMe])

  const login = React.useCallback(
    async (input: LoginInput) => {
      const res = await api.post<LoginResponse>("/auth/login", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      await loadMe()
    },
    [loadMe],
  )

  const register = React.useCallback(
    async (input: RegisterInput) => {
      const res = await api.post<RegisterResponse>("/auth/register", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      await loadMe()
    },
    [loadMe],
  )

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // Best-effort -- clear local state regardless.
    }
    setAccessToken(null)
    setUser(null)
    setPermissions([])
  }, [])

  const hasPermission = React.useCallback(
    (key: string) => permissions.includes(key),
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
