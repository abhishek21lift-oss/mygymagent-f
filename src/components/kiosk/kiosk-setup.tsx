"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, KeyRound, Loader2, LogIn, MonitorSmartphone, ShieldCheck, TriangleAlert } from "lucide-react"

import { BrandLogo } from "@/components/shared/brand-logo"
import { useAuth } from "@/lib/auth/auth-context"
import { getCurrentBranchId } from "@/lib/branch-context"
import { useBranches } from "@/lib/hooks/use-branches"
import { useRegisterDevice } from "@/lib/hooks/use-devices"
import type { SetupNotice } from "@/lib/kiosk/use-kiosk-device"

type ConnectResult = "ok" | "invalid" | "unreachable"

const fieldClass =
  "h-14 w-full rounded-2xl border border-white bg-white/80 px-4 text-lg text-[var(--kiosk-ink)] shadow-[0_1px_2px_rgba(15,18,34,0.06)] outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-200/70"

/**
 * First-run setup -- staff only, and done once per screen.
 *
 * Two ways in, both through the existing device registry:
 *  1. A staff member with `kiosk.manage` signed in on this screen registers
 *     it in place (`POST /devices`, kind KIOSK). The issued key goes
 *     straight into storage and is never drawn on screen. The staff
 *     session is then signed out, because a kiosk left signed in as staff
 *     is a staff console in the lobby.
 *  2. A key already issued from Branches → Devices is pasted in. It is
 *     checked against the API before it is kept, and the field is a
 *     password field cleared on success.
 */
export function KioskSetup({
  notice,
  connect,
  adopt,
}: {
  notice: SetupNotice
  connect: (key: string) => Promise<ConnectResult>
  adopt: (key: string) => void
}) {
  const { user, isLoading, hasPermission, logout } = useAuth()
  const canRegister = !!user && hasPermission("kiosk.manage")

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 py-10">
      <div className="kiosk-rise flex flex-col items-center text-center">
        <BrandLogo className="h-12" priority />
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-violet-700 shadow-sm">
          <MonitorSmartphone className="size-4" aria-hidden />
          Kiosk setup · staff only
        </span>
        <h1 className="mt-4 text-[clamp(2rem,4.4vw,3.25rem)] font-bold tracking-tight">Set up this check-in screen</h1>
        <p className="mt-3 max-w-xl text-lg text-[var(--kiosk-ink-soft)]">
          Connect this screen to a branch once. After that, members check themselves in with their QR code or member
          ID.
        </p>
      </div>

      {notice === "revoked" && (
        <div
          role="alert"
          className="kiosk-rise kiosk-glass-strong flex w-full items-start gap-3 rounded-3xl p-5 text-left"
        >
          <TriangleAlert className="mt-0.5 size-6 shrink-0 text-amber-500" aria-hidden />
          <div>
            <p className="font-semibold">This screen was disconnected</p>
            <p className="text-[var(--kiosk-ink-soft)]">
              Its kiosk access was revoked or has expired. Set it up again to keep checking members in.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="kiosk-glass flex h-40 w-full items-center justify-center rounded-3xl">
          <Loader2 className="kiosk-spinner size-8 text-violet-600" aria-label="Loading" />
        </div>
      ) : canRegister ? (
        <RegisterHere connect={connect} adopt={adopt} logout={logout} staffName={user?.firstName ?? null} />
      ) : (
        <div className="kiosk-rise kiosk-glass-strong w-full rounded-3xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--kiosk-primary)] text-white">
              <LogIn className="size-6" aria-hidden />
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Quickest: sign in as staff</h2>
              <p className="mt-1 text-[var(--kiosk-ink-soft)]">
                {user
                  ? "Your account can’t manage kiosks. Ask an owner or branch manager to set this screen up."
                  : "Sign in on this screen with an account that can manage kiosks, then open this page again. You’ll be signed out automatically once it’s connected."}
              </p>
              {!user && (
                <Link
                  href="/login"
                  className="kiosk-press kiosk-primary mt-4 inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-semibold"
                >
                  Staff sign in
                  <ArrowRight className="size-5" aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <PasteKey connect={connect} />
    </div>
  )
}

function RegisterHere({
  connect,
  adopt,
  logout,
  staffName,
}: {
  connect: (key: string) => Promise<ConnectResult>
  adopt: (key: string) => void
  logout: () => Promise<void>
  staffName: string | null
}) {
  const branches = useBranches({ pageSize: 100 })
  const register = useRegisterDevice()
  const items = React.useMemo(() => branches.data?.items ?? [], [branches.data])
  const [chosenBranchId, setBranchId] = React.useState<string>("")
  const [name, setName] = React.useState("Lobby check-in")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  // The branch this staff member is working in, until they pick another.
  const branchId = React.useMemo(() => {
    if (chosenBranchId) return chosenBranchId
    const current = getCurrentBranchId()
    return items.find((branch) => branch.id === current)?.id ?? items[0]?.id ?? ""
  }, [chosenBranchId, items])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!branchId || !name.trim() || busy) return
    setBusy(true)
    setError(null)
    let key: string
    try {
      const created = await register.mutateAsync({ branchId, name: name.trim(), kind: "KIOSK" })
      key = created.key
    } catch {
      setError("This screen couldn’t be registered. Check your connection and try again.")
      setBusy(false)
      return
    }
    const result = await connect(key)
    if (result !== "ok") adopt(key)
    // Leave no staff session behind on a public screen. Done after the key
    // is kept, so a failed sign-out can never cost the registration.
    await logout().catch(() => {})
  }

  return (
    <form onSubmit={handleSubmit} className="kiosk-rise kiosk-glass-strong w-full rounded-3xl p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--kiosk-primary)] text-white">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Register this screen{staffName ? `, ${staffName}` : ""}</h2>
          <p className="mt-1 text-[var(--kiosk-ink-soft)]">
            It gets its own key, kept on this screen and never shown. You can revoke it any time from Branches. When
            it’s connected you’ll be signed out here, so members can’t reach your account.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[var(--kiosk-ink-soft)]">Branch</span>
          <select
            className={fieldClass}
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            disabled={branches.isLoading || busy}
            required
          >
            {branches.isLoading && <option value="">Loading branches…</option>}
            {items.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[var(--kiosk-ink-soft)]">Screen name</span>
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
            disabled={busy}
          />
        </label>
      </div>

      {branches.isError && (
        <p role="alert" className="mt-4 text-rose-600">
          Branches couldn’t be loaded. Check the connection and reload this page.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-rose-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !branchId || !name.trim()}
        className="kiosk-press kiosk-primary mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-semibold"
      >
        {busy ? <Loader2 className="kiosk-spinner size-5" aria-hidden /> : null}
        {busy ? "Connecting…" : "Register and start kiosk"}
      </button>
    </form>
  )
}

function PasteKey({ connect }: { connect: (key: string) => Promise<ConnectResult> }) {
  const [key, setKey] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!key.trim() || busy) return
    setBusy(true)
    setError(null)
    const result = await connect(key)
    setBusy(false)
    if (result === "ok") {
      setKey("")
      return
    }
    setError(
      result === "invalid"
        ? "That key isn’t recognised. It may have been revoked, or it belongs to a turnstile rather than a kiosk."
        : "The gym system can’t be reached right now. Check this screen's connection and try again.",
    )
  }

  return (
    <form onSubmit={handleSubmit} className="kiosk-rise kiosk-rise-2 kiosk-glass w-full rounded-3xl p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
          <KeyRound className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Or use a device key</h2>
          <p className="mt-1 text-[var(--kiosk-ink-soft)]">
            Issued once from Branches → Devices → Add device (type Kiosk).
          </p>
        </div>
      </div>
      <label htmlFor="kiosk-device-key" className="sr-only">
        Device key
      </label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          id="kiosk-device-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Paste the kiosk device key"
          className={fieldClass}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !key.trim()}
          className="kiosk-press kiosk-primary flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl px-8 text-lg font-semibold"
        >
          {busy ? <Loader2 className="kiosk-spinner size-5" aria-hidden /> : null}
          Connect
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-rose-600">
          {error}
        </p>
      )}
    </form>
  )
}
