import { ScanDeduper } from "./scan-dedupe";

describe("ScanDeduper (camera-frame duplicate suppression)", () => {
  it("accepts the first detection of a code", () => {
    const deduper = new ScanDeduper(2000);
    expect(deduper.accept("WHEY-1KG", 1000)).toBe(true);
  });

  it("rejects the same code re-detected inside the cooldown window (duplicate camera frames)", () => {
    const deduper = new ScanDeduper(2000);
    deduper.accept("WHEY-1KG", 1000);
    expect(deduper.accept("WHEY-1KG", 1100)).toBe(false);
    expect(deduper.accept("WHEY-1KG", 2900)).toBe(false);
  });

  it("accepts the same code again after the cooldown has elapsed (deliberate repeat scan)", () => {
    const deduper = new ScanDeduper(2000);
    deduper.accept("WHEY-1KG", 1000);
    expect(deduper.accept("WHEY-1KG", 3001)).toBe(true);
  });

  it("accepts a different code immediately even inside the cooldown of the previous one", () => {
    const deduper = new ScanDeduper(2000);
    deduper.accept("WHEY-1KG", 1000);
    expect(deduper.accept("EAN-0312345678901", 1100)).toBe(true);
  });

  it("after reset, the same code is accepted again (next scan session)", () => {
    const deduper = new ScanDeduper(2000);
    deduper.accept("WHEY-1KG", 1000);
    deduper.reset();
    expect(deduper.accept("WHEY-1KG", 1050)).toBe(true);
  });
});
