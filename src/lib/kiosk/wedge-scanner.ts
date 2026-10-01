/**
 * USB / Bluetooth QR readers ("keyboard wedge" scanners) are the most
 * common check-in hardware bolted to a kiosk. They type the code as
 * keystrokes, far faster than a person, and finish with Enter.
 *
 * This buffer tells the two apart by rhythm: characters arriving within
 * `maxGapMs` of each other accumulate; a slower key starts over; Enter
 * after at least `minLength` fast characters is a scan. A person typing
 * on a keyboard never produces one, so the listener can stay attached to
 * the READY screen without hijacking typing anywhere else.
 */
export class WedgeBuffer {
  private chars = ""
  private lastAt = 0

  constructor(
    private readonly maxGapMs = 60,
    private readonly minLength = 16,
  ) {}

  /** Feed one key. Returns the scanned code on Enter, otherwise null. */
  push(key: string, at: number): string | null {
    if (key === "Enter") {
      const code = this.chars
      this.chars = ""
      return code.length >= this.minLength ? code : null
    }
    if (key.length !== 1) return null
    if (this.chars && at - this.lastAt > this.maxGapMs) this.chars = ""
    this.chars += key
    this.lastAt = at
    return null
  }

  reset() {
    this.chars = ""
  }
}
