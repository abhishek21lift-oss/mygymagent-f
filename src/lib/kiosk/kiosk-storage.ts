/**
 * The one thing a kiosk keeps: its device key.
 *
 * Nothing else is persisted -- the gym, branch and device names are
 * fetched from `/kiosk/session` on every start, so a renamed branch or a
 * revoked device is never shown from a stale copy. The storage key is the
 * one the old kiosk page wrote, so screens already in the field keep
 * working after this ships.
 *
 * A browser offers nothing stronger than origin-scoped storage to a page;
 * the protection is that the key is never rendered after setup, is only
 * ever sent to the API in a request body, and can be revoked per device
 * from Branches.
 */
export const KIOSK_DEVICE_KEY_STORAGE = "mygymagent:kiosk-device-key"

export function readDeviceKey(): string | null {
  try {
    const value = window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)
    return value && value.trim() ? value.trim() : null
  } catch {
    return null
  }
}

export function writeDeviceKey(key: string): boolean {
  try {
    window.localStorage.setItem(KIOSK_DEVICE_KEY_STORAGE, key.trim())
    return true
  } catch {
    return false
  }
}

export function clearDeviceKey(): void {
  try {
    window.localStorage.removeItem(KIOSK_DEVICE_KEY_STORAGE)
  } catch {
    // Storage blocked: nothing was stored to clear.
  }
}
