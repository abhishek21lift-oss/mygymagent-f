"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api/client"
import { getAccessToken, setAccessToken } from "@/lib/api/token-store"
import { setCurrentBranchId } from "@/lib/branch-context"
import type {
 AuthUser,
 LoginResponse,
 LoginResult,
 MeResponse,
 MfaEnrolmentInfo,
 RegisterResponse,
} from "@/lib/types/auth"
import type { LoginInput, RegisterInput } from "@/lib/validation/auth"

interface AuthContextValue {
 user: AuthUser | null
 permissions: string[]
 /** Null until /auth/me has answered. `ENFORCED` means the backend has
 * confined this session to the enrolment screens. */
 mfaEnrolment: MfaEnrolmentInfo | null
 isLoading: boolean
 isAuthenticated: boolean
 /** Resolves to `{ mfaRequired: true, ... }` when the password was
 * correct but a second factor is enrolled. In that case NO session has
 * been established -- the caller must collect a code and pass the
 * returned `mfaToken` to `completeMfaLogin`. */
 login: (input: LoginInput) => Promise<LoginResult>
 /** Resolves to the session it established, so the caller can route
  * on it -- a member and a staff account open different apps. */
 completeMfaLogin: (mfaToken: string, code: string) => Promise<LoginResponse>
 /** Ask for a login code by SMS. Resolves the same way whether or not
  * the number is known -- the server will not say which, and neither
  * can this. */
 requestOtp: (phone: string) => Promise<void>
 /** Spend an SMS code. Resolves to the session it established, like
  * `completeMfaLogin`, so the caller can route on it. */
 loginWithOtp: (phone: string, code: string) => Promise<LoginResponse>
 register: (input: RegisterInput) => Promise<void>
 logout: () => Promise<void>
 /** Ends every session for this account, not just this browser's.
  * What you reach for when a device is lost or a password was shared. */
 logoutEverywhere: () => Promise<void>
 hasPermission: (key: string | string[]) => boolean
 refetchMe: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [user, setUser] = React.useState<AuthUser | null>(null)
 const [permissions, setPermissions] = React.useState<string[]>([])
 const [mfaEnrolment, setMfaEnrolment] =
 React.useState<MfaEnrolmentInfo | null>(null)
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
 setMfaEnrolment(null)
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
 setMfaEnrolment(me.mfaEnrolment ?? null)
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
 setMfaEnrolment(null)
 setCurrentBranchId(null)
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

 /** Shared tail of both login halves: adopt the returned session. */
 const adoptSession = React.useCallback(
 (res: LoginResponse) => {
 setAccessToken(res.accessToken)
 setUser(res.user)
 setPermissions([])
 // Taken from the login response so an enrolment-scoped session is
 // recognised immediately, rather than briefly rendering an app
 // whose every request will 403.
 setMfaEnrolment(res.mfaEnrolment ?? null)
 setCurrentBranchId(res.user.primaryBranchId)
 void loadMe()
 },
 [loadMe],
 )

 const login = React.useCallback(
 async (input: LoginInput): Promise<LoginResult> => {
 // New session: drop any cached data from a previous account first so
 // tenant data can never bleed across logins on a shared device.
 sessionGen.current += 1
 await queryClient.cancelQueries().catch(() => undefined)
 queryClient.clear()
 const res = await api.post<LoginResult>("/auth/login", input)

 // Second factor outstanding: there is no token to adopt yet, and the
 // session state stays cleared so the UI cannot show a half-login.
 if (res.mfaRequired) {
 clearSession(sessionGen.current)
 return res
 }

 adoptSession(res)
 return res
 },
 [adoptSession, queryClient],
 )

 const completeMfaLogin = React.useCallback(
 async (mfaToken: string, code: string) => {
 // The challenge token, not a session, authenticates this call. Bump
 // the generation again so a /auth/me left in flight from the failed
 // first half can never land on the session this establishes.
 sessionGen.current += 1
 await queryClient.cancelQueries().catch(() => undefined)
 queryClient.clear()
 const res = await api.post<LoginResponse>("/auth/mfa/verify", {
 mfaToken,
 code,
 })
 adoptSession(res)
 return res
 },
 [adoptSession, queryClient],
 )

 const requestOtp = React.useCallback(async (phone: string) => {
 await api.post("/auth/otp/request", { phone })
 }, [])

 const loginWithOtp = React.useCallback(
 async (phone: string, code: string) => {
 // Same session hygiene as the MFA second half: this establishes a
 // session from a request that carried none, so anything already in
 // flight must not land on it.
 sessionGen.current += 1
 await queryClient.cancelQueries().catch(() => undefined)
 queryClient.clear()
 const res = await api.post<LoginResponse>("/auth/otp/verify", {
 phone,
 code,
 })
 adoptSession(res)
 return res
 },
 [adoptSession, queryClient],
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
 // A brand-new organization starts on the OPTIONAL policy, so no
 // requirement can apply; the follow-up /auth/me confirms it anyway.
 setMfaEnrolment(null)
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
 setMfaEnrolment(null)
 setCurrentBranchId(null)
 }, [queryClient])

 /** Revokes every refresh token this account holds, then clears local
  * state exactly as `logout` does -- this browser is one of the sessions
  * being ended. Unlike `logout`, a failure here is surfaced rather than
  * swallowed: "signed out everywhere" that silently did not is worse
  * than an error, because the user stops looking for the lost device. */
 const logoutEverywhere = React.useCallback(async () => {
 await api.post("/auth/logout-all")
 sessionGen.current += 1
 await queryClient.cancelQueries().catch(() => undefined)
 queryClient.clear()
 setAccessToken(null)
 setUser(null)
 setPermissions([])
 setMfaEnrolment(null)
 setCurrentBranchId(null)
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
 mfaEnrolment,
 isLoading,
 isAuthenticated: user !== null,
 login,
 completeMfaLogin,
 requestOtp,
 loginWithOtp,
 register,
 logout,
 logoutEverywhere,
 hasPermission,
 refetchMe: loadMe,
 }),
 [
 user,
 permissions,
 mfaEnrolment,
 isLoading,
 login,
 completeMfaLogin,
 register,
 logout,
 logoutEverywhere,
 hasPermission,
 loadMe,
 ],
 )

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
 const ctx = React.useContext(AuthContext)
 if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
 return ctx
}

export { ApiError }
