import { PRODUCT_NAME } from "@/lib/brand";

/**
 * The facts the legal pages need that only the business can supply.
 *
 * Each one comes from a `NEXT_PUBLIC_LEGAL_*` variable set on Vercel, so
 * the policies can be completed or corrected without a code change. None
 * of them has a made-up default: a policy naming a company, an address or
 * a grievance officer that do not exist is worse than one that says the
 * detail is still to come, and `missingLegalDetails()` lists what is unset
 * so it can be checked before launch.
 *
 * The policy text itself (src/app/(legal)) is a starting template written
 * for an Indian SaaS business under the DPDP Act 2023. Have it reviewed by
 * a lawyer before relying on it.
 */
export const LEGAL = {
  productName: PRODUCT_NAME,
  /** Registered name of the company or proprietor operating the product. */
  entityName: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME),
  /** Registered postal address. */
  address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS),
  supportEmail: env(process.env.NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL),
  supportPhone: env(process.env.NEXT_PUBLIC_LEGAL_SUPPORT_PHONE),
  /** DPDP Act s.8(10): the person who answers privacy grievances. */
  grievanceOfficerName: env(process.env.NEXT_PUBLIC_LEGAL_GRIEVANCE_OFFICER_NAME),
  grievanceOfficerEmail: env(process.env.NEXT_PUBLIC_LEGAL_GRIEVANCE_OFFICER_EMAIL),
  /** City whose courts have jurisdiction, e.g. "Kanpur". */
  jurisdictionCity: env(process.env.NEXT_PUBLIC_LEGAL_JURISDICTION_CITY),
  /** When the current text took effect, e.g. "1 October 2026". */
  effectiveDate: env(process.env.NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE),
} as const;

export type LegalField = Exclude<keyof typeof LEGAL, "productName">;

export const LEGAL_ENV_NAMES: Record<LegalField, string> = {
  entityName: "NEXT_PUBLIC_LEGAL_ENTITY_NAME",
  address: "NEXT_PUBLIC_LEGAL_ADDRESS",
  supportEmail: "NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL",
  supportPhone: "NEXT_PUBLIC_LEGAL_SUPPORT_PHONE",
  grievanceOfficerName: "NEXT_PUBLIC_LEGAL_GRIEVANCE_OFFICER_NAME",
  grievanceOfficerEmail: "NEXT_PUBLIC_LEGAL_GRIEVANCE_OFFICER_EMAIL",
  jurisdictionCity: "NEXT_PUBLIC_LEGAL_JURISDICTION_CITY",
  effectiveDate: "NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE",
};

/** The env vars still to set, for the launch checklist. */
export function missingLegalDetails(): string[] {
  return (Object.keys(LEGAL_ENV_NAMES) as LegalField[])
    .filter((field) => !LEGAL[field])
    .map((field) => LEGAL_ENV_NAMES[field]);
}

function env(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** The public pages, for the footer links and the sitemap. */
export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/contact", label: "Contact" },
] as const;
