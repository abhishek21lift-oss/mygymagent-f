import { homeRouteFor } from "./home-route";

/**
 * One decision, seven callers (the login page, the staff and trainer
 * shells, the not-found page, and the landing page's two CTAs), so it is
 * worth pinning on its own. The bug it replaces was a hard-coded
 * `/dashboard` on the login page: a member signed in successfully and
 * landed in the staff app, where every request 403s and nothing offers
 * a way to the portal.
 *
 * Platform staff are now routed to the Command Center, so they stop
 * landing on a product dashboard of revenue and member counts they have
 * no business seeing.
 */
describe("homeRouteFor", () => {
  it("sends a member to their portal", () => {
    expect(
      homeRouteFor({ memberId: "mem_1", platformRole: null }),
    ).toBe("/portal");
  });

  it("sends a gym staff account to the dashboard", () => {
    expect(homeRouteFor({ memberId: null, platformRole: null })).toBe(
      "/dashboard",
    );
  });

  it("falls back to the staff app when there is no user yet", () => {
    // The staff app re-checks auth and bounces to /login; the portal
    // would first fire a request it knows will be refused.
    expect(homeRouteFor(null)).toBe("/dashboard");
  });

  it("sends platform staff to the Command Center", () => {
    expect(
      homeRouteFor({ memberId: null, platformRole: "PLATFORM_OWNER" }),
    ).toBe("/platform/command-center");
    expect(
      homeRouteFor({ memberId: null, platformRole: "PLATFORM_ADMIN" }),
    ).toBe("/platform/command-center");
  });

  it("prefers the Command Center over the portal when both apply", () => {
    // Unusual, but the order has to be decided rather than incidental: a
    // platform owner who also had a member record should still get the
    // console, not a member portal.
    expect(
      homeRouteFor({ memberId: "mem_1", platformRole: "PLATFORM_OWNER" }),
    ).toBe("/platform/command-center");
  });

  it("leaves an ordinary member and gym owner exactly where they were", () => {
    // The two branches above are new; these two are the regression guard.
    expect(homeRouteFor({ memberId: "mem_2", platformRole: null })).toBe(
      "/portal",
    );
    expect(homeRouteFor({ memberId: null, platformRole: null })).toBe(
      "/dashboard",
    );
  });
});
