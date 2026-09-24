import { homeRouteFor } from "./home-route";

/**
 * One decision, two callers (the login page and the staff layout), so it
 * is worth pinning on its own. The bug it replaces was a hard-coded
 * `/dashboard` on the login page: a member signed in successfully and
 * landed in the staff app, where every request 403s and nothing offers
 * a way to the portal.
 */
describe("homeRouteFor", () => {
  it("sends a member to their portal", () => {
    expect(homeRouteFor({ memberId: "mem_1" })).toBe("/portal");
  });

  it("sends a staff account to the dashboard", () => {
    expect(homeRouteFor({ memberId: null })).toBe("/dashboard");
  });

  it("falls back to the staff app when there is no user yet", () => {
    // The staff app re-checks auth and bounces to /login; the portal
    // would first fire a request it knows will be refused.
    expect(homeRouteFor(null)).toBe("/dashboard");
  });
});
