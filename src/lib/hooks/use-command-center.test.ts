import { isStale, STALE_AFTER_MS } from "./use-command-center";

describe("isStale", () => {
  const now = Date.parse("2026-10-03T12:00:00.000Z");

  it("treats a reading inside the window as current", () => {
    expect(isStale("2026-10-03T11:59:30.000Z", now)).toBe(false);
  });

  it("flags a reading older than the window", () => {
    const old = new Date(now - STALE_AFTER_MS - 1_000).toISOString();
    expect(isStale(old, now)).toBe(true);
  });

  it("does not flag a reading exactly at the boundary", () => {
    const edge = new Date(now - STALE_AFTER_MS).toISOString();
    expect(isStale(edge, now)).toBe(false);
  });

  it("flags an unparseable timestamp rather than trusting it", () => {
    // A malformed checkedAt would otherwise yield NaN, and NaN > anything is
    // false — so the card would present garbage as fresh.
    expect(isStale("not-a-date", now)).toBe(true);
  });
});
