import { safeNext } from "./safe-next";

/**
 * `?next=` lets the login page honour an intent ("go to the Command
 * Center"), which means it is attacker-controllable input that ends up in
 * a router call. Unvalidated, `?next=//evil.com` is an open redirect: the
 * browser treats a protocol-relative URL as absolute and leaves the site
 * with the Referer attached.
 */

describe("safeNext", () => {
  it("accepts a same-site absolute path", () => {
    expect(safeNext("/platform/command-center")).toBe("/platform/command-center");
  });

  it("keeps a path with its query string", () => {
    expect(safeNext("/members?page=2")).toBe("/members?page=2");
  });

  it("rejects a protocol-relative URL, which would leave the site", () => {
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("//evil.com/path")).toBeNull();
  });

  it("rejects an absolute URL", () => {
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext("http://evil.com")).toBeNull();
  });

  it("rejects a relative path that does not start at the root", () => {
    expect(safeNext("evil.com")).toBeNull();
    expect(safeNext("platform/command-center")).toBeNull();
  });

  it("rejects anything that is not a string", () => {
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext(["/a", "/b"])).toBeNull();
    expect(safeNext(42)).toBeNull();
  });

  it("rejects a backslash, which some browsers normalise to a slash", () => {
    // "/\evil.com" is treated as protocol-relative by several browsers, so
    // a leading-backslash check is not enough on its own.
    expect(safeNext("/\\evil.com")).toBeNull();
  });

  it("accepts the root path", () => {
    expect(safeNext("/")).toBe("/");
  });
});
