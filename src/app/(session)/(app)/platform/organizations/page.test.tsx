import { parseMonths } from "./page";

/**
 * The plan picker clamps months client-side to the server's 1-36 window.
 * Anything outside keeps the confirm shut; the server's 400 stays the
 * backstop, not the UX.
 */
describe("parseMonths", () => {
  it("accepts the bounds and the default", () => {
    expect(parseMonths("1")).toBe(1);
    expect(parseMonths("12")).toBe(12);
    expect(parseMonths("36")).toBe(36);
  });

  it("rejects zero, negatives and above the window", () => {
    expect(parseMonths("0")).toBeNull();
    expect(parseMonths("-3")).toBeNull();
    expect(parseMonths("37")).toBeNull();
  });

  it("rejects non-integers and blanks instead of coercing them", () => {
    expect(parseMonths("")).toBeNull();
    expect(parseMonths("  ")).toBeNull();
    expect(parseMonths("1.5")).toBeNull();
    expect(parseMonths("abc")).toBeNull();
  });
});
