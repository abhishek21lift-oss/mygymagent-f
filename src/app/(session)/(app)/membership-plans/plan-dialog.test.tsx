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
});
