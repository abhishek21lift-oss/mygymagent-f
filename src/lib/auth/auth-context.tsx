"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api/client"
import { getAccessToken, setAccessToken } from "@/lib/api/token-store"
import { setCurrentBranchId } from "@/lib/branch-context"
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
  const queryClient = useQueryClient()

  // Bumped on every explicit session change (login/register/logout) but NOT
  // on silent access-token refresh. Lets an in-flight /auth/me tell apart
  // "same session, token rotated underneath me" (safe to apply) from "the
  // user switched accounts while I was in flight" (must discard).
  const sessionGen = React.useRef(0)

  function clearSession(nextGen: number) {
    sessionGen.current = nextGen
    setAccessToken(null)
    setUser(null)
    setPermissions([])
    setCurrentBranchId(null)
    setCurrentBranchId(null)
  }

  const loadMe = React.useCallback(async (): Promise<void> => {
    const genAtStart = sessionGen.current

    try {
      const me = await api.get<MeResponse>("/auth/me")

      // Account switched mid-request: a newer session owns the UI now.
      if (genAtStart !== sessionGen.current) return

      setUser(me.user)
      setPermissions(me.permissions)
      setCurrentBranchId(me.user.primaryBranchId)
    } catch (error) {
      // A newer session started while this request was in flight -- never
      // let the stale response clobber it.
      if (genAtStart !== sessionGen.current) return
      if (error instanceof ApiError && error.status === 401) {
        // Same session, server says it is dead: log out for real instead
        // of leaving the UI authenticated with no usable token.
        clearSession(genAtStart)
        return
      }
      // Transient failure (network/5xx) on a session we already hold:
      // keep existing state. Only a bootstrap with no session at all
      // settles to logged-out.
      if (getAccessToken() === null) {
        clearSession(genAtStart)
      }
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        await loadMe()
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
      // New session: drop any cached data from a previous account first so
      // tenant data can never bleed across logins on a shared device.
      sessionGen.current += 1
      await queryClient.cancelQueries().catch(() => undefined)
      queryClient.clear()
      const res = await api.post<LoginResponse>("/auth/login", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      setPermissions([])
      setCurrentBranchId(res.user.primaryBranchId)

      void loadMe()
    },
    [loadMe, queryClient],
  )

  const register = React.useCallback(
    async (input: RegisterInput) => {
      sessionGen.current += 1
      await queryClient.cancelQueries().catch(() => undefined)
      queryClient.clear()
      const res = await api.post<RegisterResponse>("/auth/register", input)
      setAccessToken(res.accessToken)
      setUser(res.user)
      setPermissions([])
      setCurrentBranchId(res.user.primaryBranchId)
      void loadMe()
    },
    [loadMe, queryClient],
  )

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // Best effort; local auth state must still be cleared.
    }
    sessionGen.current += 1
    await queryClient.cancelQueries().catch(() => undefined)
    queryClient.clear()
    setAccessToken(null)
    setUser(null)
    setPermissions([])
  }, [queryClient])

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
