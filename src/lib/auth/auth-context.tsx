"use client"

import * as React from "react"
import { api, ApiError, refreshSession } from "@/lib/api/client"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const loadMe = React.useCallback(async (): Promise<void> => {
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
      try {
        // Prefer an already-issued in-memory access token. This prevents the
        // startup refresh request from racing a login submitted immediately
        // after the login page mounts. A stale token is recovered by apiFetch's
        // single-flight 401 refresh path.
        if (getAccessToken()) {
          await loadMe()
        } else {
          const refreshed = await refreshSession()
          if (refreshed && !cancelled) await loadMe()
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null)
          setUser(null)
          setPermissions([])
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
      // A successful /auth/login response is already proof of authentication.
      // Do not make navigation depend on a second /auth/me request succeeding:
      // on a fresh page load that request can race the startup refresh flow and
      // turn a successful login into a visible sign-in failure.
      const res = await api.post<LoginResponse>("/auth/login", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      setPermissions([])

      // Permissions are useful for navigation, but they are not required to
      // establish the authenticated session. Refresh them opportunistically
      // after the login state is installed so a transient /auth/me failure does
      // not block the user from reaching the dashboard.
      void loadMe()
    },
    [loadMe],
  )

  const register = React.useCallback(
    async (input: RegisterInput) => {
      const res = await api.post<RegisterResponse>("/auth/register", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      setPermissions([])
      void loadMe()
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
