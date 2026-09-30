import {
  normaliseWebsite,
  profileChanges,
  profileFormFrom,
  profileProblems,
} from "./gym-profile";
import type { Organization } from "./types/auth";

const org: Organization = {
  id: "org-1",
  name: "619 Fitness Studio",
  slug: "619",
  status: "ACTIVE",
  timezone: "Asia/Kolkata",
  currency: "INR",
  parentOrganizationId: null,
  settings: {},
  logoUrl: null,
  contactPhone: "+91 98765 43210",
  contactEmail: null,
  website: null,
  instagram: "six19.fitness",
  emailFromName: null,
  emailReplyTo: null,
  createdAt: "",
  updatedAt: "",
};

describe("gym profile form", () => {
  it("starts from the saved values, the Instagram handle with its @", () => {
    expect(profileFormFrom(org)).toMatchObject({
      contactPhone: "+91 98765 43210",
      contactEmail: "",
      instagram: "@six19.fitness",
    });
  });

  it("sends only what changed, blanks as null, websites made whole", () => {
    const form = {
      ...profileFormFrom(org),
      contactPhone: "",
      website: "six19.in",
      instagram: "@six19.fitness",
    };
    expect(profileChanges(form, org)).toEqual({
      contactPhone: null,
      website: "https://six19.in",
    });
  });

  it("sends nothing when nothing changed", () => {
    expect(profileChanges(profileFormFrom(org), org)).toEqual({});
  });

  it("names each field that is wrong", () => {
    const form = {
      ...profileFormFrom(org),
      name: "x",
      contactPhone: "call me",
      contactEmail: "nope",
      website: "not a site",
      instagram: "has space",
      emailReplyTo: "desk@",
    };
    expect(Object.keys(profileProblems(form)).sort()).toEqual(
      [
        "contactEmail",
        "contactPhone",
        "emailReplyTo",
        "instagram",
        "name",
        "website",
      ].sort(),
    );
    expect(profileProblems(profileFormFrom(org))).toEqual({});
  });

  it("adds https:// only where it is missing", () => {
    expect(normaliseWebsite(" six19.in ")).toBe("https://six19.in");
    expect(normaliseWebsite("http://six19.in")).toBe("http://six19.in");
    expect(normaliseWebsite("")).toBe("");
  });
});
