/** Pure scan-deduplication logic for the inventory camera scanner.

 * Camera scanners fire their decode callback once per frame; holding a
 * code in front of the lens produces many identical detections in a
 * second. This module decides which detections are "new" so the UI
 * never double-resolves the same code. Extracted from the component so
 * it can be unit-tested without jsdom camera APIs. */

export interface ScanDetection {
  code: string;
  at: number;
}

/** Stateful filter: returns true when `code` at time `at` (ms epoch)
 * should be treated as a NEW detection, false when it's a duplicate of a
 * recent detection of the same code inside the cooldown window. */
export class ScanDeduper {
  private last: ScanDetection | null = null;

  constructor(private readonly cooldownMs: number) {}

  accept(code: string, at: number): boolean {
    const last = this.last;
    if (last && last.code === code && at - last.at < this.cooldownMs) {
      return false;
    }
    this.last = { code, at };
    return true;
  }

  reset(): void {
    this.last = null;
  }
}
