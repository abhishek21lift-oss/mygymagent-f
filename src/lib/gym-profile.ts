import type { OrganizationUpdate } from "@/lib/hooks/use-organization";
import type { Organization } from "@/lib/types/auth";

/** The Gym profile form's fields, as typed. */
export interface ProfileForm {
  name: string;
  timezone: string;
  currency: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  instagram: string;
  emailFromName: string;
  emailReplyTo: string;
}

/** The form as the organization now stands. */
export function profileFormFrom(org: Organization): ProfileForm {
  return {
    name: org.name,
    timezone: org.timezone,
    currency: org.currency,
    contactPhone: org.contactPhone ?? "",
    contactEmail: org.contactEmail ?? "",
    website: org.website ?? "",
    instagram: org.instagram ? `@${org.instagram}` : "",
    emailFromName: org.emailFromName ?? "",
    emailReplyTo: org.emailReplyTo ?? "",
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "profilefitness.in" is what people type; the API wants a full URL. */
export function normaliseWebsite(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function profileProblems(
  form: ProfileForm,
): Partial<Record<keyof ProfileForm, string>> {
  const found: Partial<Record<keyof ProfileForm, string>> = {};
  if (form.name.trim().length < 2) found.name = "Enter the gym's name.";
  if (
    form.contactPhone.trim() &&
    !/^\+?[0-9][0-9 ()-]{5,19}$/.test(form.contactPhone.trim())
  )
    found.contactPhone = "Enter a phone number, e.g. +91 98765 43210.";
  if (form.contactEmail.trim() && !EMAIL.test(form.contactEmail.trim()))
    found.contactEmail = "Enter a valid email.";
  if (form.emailReplyTo.trim() && !EMAIL.test(form.emailReplyTo.trim()))
    found.emailReplyTo = "Enter a valid email.";
  if (
    form.website.trim() &&
    !/^https?:\/\/[^\s.]+\.\S+$/i.test(normaliseWebsite(form.website))
  )
    found.website = "Enter a web address, e.g. profilefitness.in.";
  if (
    form.instagram.trim() &&
    !/^@?[A-Za-z0-9._]{1,30}$/.test(form.instagram.trim())
  )
    found.instagram = "Enter the handle, e.g. @profile.fitness.";
  return found;
}

/** The changes, blank optional fields sent as null so they clear. */
export function profileChanges(
  form: ProfileForm,
  org: Organization,
): OrganizationUpdate {
  const next: Required<OrganizationUpdate> = {
    name: form.name.trim(),
    timezone: form.timezone,
    currency: form.currency,
    contactPhone: form.contactPhone.trim() || null,
    contactEmail: form.contactEmail.trim() || null,
    website: normaliseWebsite(form.website) || null,
    instagram: form.instagram.trim().replace(/^@/, "") || null,
    emailFromName: form.emailFromName.trim() || null,
    emailReplyTo: form.emailReplyTo.trim() || null,
  };
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => (org[key as keyof Organization] ?? null) !== value,
    ),
  ) as OrganizationUpdate;
}
