import {
  defaultPaymentMembership,
  membershipIdForPayment,
  NOT_FOR_MEMBERSHIP,
} from "./member-payments";

const now = new Date("2026-10-01T10:00:00Z");

describe("defaultPaymentMembership", () => {
  it("picks the term running now over a renewal queued for later", () => {
    expect(
      defaultPaymentMembership(
        [
          { id: "next", status: "ACTIVE", startDate: "2026-11-01T00:00:00Z" },
          { id: "now", status: "ACTIVE", startDate: "2026-09-01T00:00:00Z" },
        ],
        now,
      ),
    ).toBe("now");
  });

  it("falls back to the earliest upcoming term", () => {
    expect(
      defaultPaymentMembership(
        [
          { id: "later", status: "ACTIVE", startDate: "2027-01-01T00:00:00Z" },
          { id: "sooner", status: "ACTIVE", startDate: "2026-11-01T00:00:00Z" },
        ],
        now,
      ),
    ).toBe("sooner");
  });

  it("counts a frozen term, and ignores closed ones", () => {
    expect(
      defaultPaymentMembership(
        [
          { id: "old", status: "EXPIRED", startDate: "2026-01-01T00:00:00Z" },
          { id: "frozen", status: "FROZEN", startDate: "2026-09-01T00:00:00Z" },
        ],
        now,
      ),
    ).toBe("frozen");
  });

  it("says 'not a membership' when there is none to pay", () => {
    expect(defaultPaymentMembership([], now)).toBe(NOT_FOR_MEMBERSHIP);
  });
});

describe("membershipIdForPayment", () => {
  it("sends no membership for the 'not a membership' choice", () => {
    expect(membershipIdForPayment(NOT_FOR_MEMBERSHIP)).toBeUndefined();
    expect(membershipIdForPayment("")).toBeUndefined();
    expect(membershipIdForPayment("m-1")).toBe("m-1");
  });
});
