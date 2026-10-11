import { createMembershipPlanSchema } from "@/lib/validation/gym";
import { fromDurationDays, toDurationDays } from "./plan-form";

const base = {
  name: "12-Month Unlimited",
  code: "YR-UNLTD",
  category: "Premium",
  description: "",
  branchId: "",
  durationDays: 365,
  price: 20000,
  currency: "INR",
  benefits: ["Steam bath"],
  maxFreezeDays: 10,
  isFeatured: true,
  isPublic: true,
};

describe("toDurationDays", () => {
  it("converts units to stored days", () => {
    expect(toDurationDays(1, "days")).toBe(1);
    expect(toDurationDays(2, "weeks")).toBe(14);
    expect(toDurationDays(3, "months")).toBe(90);
    expect(toDurationDays(1, "years")).toBe(365);
  });

  it("never stores zero or negative days", () => {
    expect(toDurationDays(0, "months")).toBe(1);
    expect(toDurationDays(-2, "weeks")).toBe(1);
  });
});

describe("fromDurationDays", () => {
  it("reopens stored days in the largest exact unit", () => {
    expect(fromDurationDays(365)).toEqual({ value: 1, unit: "years" });
    expect(fromDurationDays(90)).toEqual({ value: 3, unit: "months" });
    expect(fromDurationDays(14)).toEqual({ value: 2, unit: "weeks" });
    expect(fromDurationDays(45)).toEqual({ value: 45, unit: "days" });
  });

  it("round-trips through the API representation", () => {
    for (const days of [30, 90, 365, 14, 45]) {
      const { value, unit } = fromDurationDays(days);
      expect(toDurationDays(value, unit)).toBe(days);
    }
  });
});

describe("createMembershipPlanSchema", () => {
  it("accepts the full upgraded form", () => {
    expect(createMembershipPlanSchema.safeParse(base).success).toBe(true);
  });

  it("rejects bad money and bad durations", () => {
    expect(
      createMembershipPlanSchema.safeParse({ ...base, price: -5 }).success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({ ...base, durationDays: 0 })
        .success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({ ...base, maxFreezeDays: -1 })
        .success,
    ).toBe(false);
  });

  it("rejects oversized display fields", () => {
    expect(
      createMembershipPlanSchema.safeParse({ ...base, code: "x".repeat(41) })
        .success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({
        ...base,
        benefits: Array.from({ length: 21 }, (_, i) => `perk ${i}`),
      }).success,
    ).toBe(false);
  });

  it("accepts the upgraded offer, fee, tax, limit, trial and content fields", () => {
    const parsed = createMembershipPlanSchema.safeParse({
      ...base,
      displayOrder: 2,
      compareAtPrice: 25000,
      joiningFee: 500,
      taxMode: "exclusive",
      taxRate: 18,
      weeklyClassLimit: 3,
      ptSessionCredits: 2,
      appointmentTypes: ["Trial"],
      trialDays: 7,
      termsAndConditions: "No refunds.",
      faqs: [{ q: "Can I freeze?", a: "Yes, up to the freeze budget." }],
      imageUrl: "https://example.com/plan.jpg",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a non-offer was-price and a zero class limit", () => {
    expect(
      createMembershipPlanSchema.safeParse({ ...base, compareAtPrice: 20000 })
        .success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({ ...base, compareAtPrice: 15000 })
        .success,
    ).toBe(false);
    const zeroLimit = createMembershipPlanSchema.safeParse({
      ...base,
      weeklyClassLimit: 0,
    });
    expect(zeroLimit.success).toBe(false);
    if (!zeroLimit.success) {
      expect(zeroLimit.error.issues[0].message).toMatch(/unlimited/);
    }
    // Blank means unlimited.
    expect(
      createMembershipPlanSchema.safeParse({ ...base, weeklyClassLimit: "" })
        .success,
    ).toBe(true);
  });

  it("requires a tax rate when tax applies and a valid currency", () => {
    expect(
      createMembershipPlanSchema.safeParse({ ...base, taxMode: "exclusive" })
        .success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({ ...base, currency: "inr" }).success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({ ...base, currency: "XX" }).success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({
        ...base,
        imageUrl: "http://example.com/plan.jpg",
      }).success,
    ).toBe(false);
    expect(
      createMembershipPlanSchema.safeParse({
        ...base,
        description: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });
});
