import { PRODUCT_NAME } from "@/lib/brand";

/**
 * The public site's facts, in one place for the landing page, its
 * metadata, the sitemap and robots.txt.
 */
export const SITE = {
  name: PRODUCT_NAME,
  /** What the page should rank for, first. */
  title: "Gym Management Software with WhatsApp & AI",
  description:
    "THE CULT CLIENT is gym management software for Indian gyms and fitness studios: memberships, renewals, WhatsApp reminders and AI replies, attendance and check-in, personal training, payments, staff payroll and reports, in one app.",
  keywords: [
    "gym management software",
    "gym management software India",
    "gym software",
    "fitness studio software",
    "gym membership management",
    "gym billing software",
    "gym CRM",
    "gym attendance system",
    "WhatsApp gym reminders",
    "personal training software",
    "gym app for members",
  ],
  locale: "en_IN",
} as const;

/** Where the public site lives: the one canonical address. */
export const DEFAULT_SITE_URL = "https://mygymagent.tech";

/**
 * The site's origin, for canonical URLs, the sitemap and social cards.
 *
 * The app answers on more than one host (the VPS, a Vercel preview);
 * every one of them names this origin as canonical, so search engines
 * index one site rather than several copies of it. `NEXT_PUBLIC_SITE_URL`
 * overrides it, e.g. for a staging domain.
 */
export function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // Fall back to the default.
    }
  }
  return new URL(DEFAULT_SITE_URL);
}

/**
 * The plans a gym can subscribe to, as sold today. Mirrors the
 * `subscription_plans` table (priceMinor in paise, billed monthly, as the
 * in-app Subscription page shows them). Change both together.
 */
export const PLATFORM_PLANS = [
  {
    key: "trial",
    name: "Free Trial",
    pricePerMonth: 0,
    blurb: "Try everything with a real gym's data.",
    limits: { members: 100, branches: 1, staff: 5, whatsappMonthly: 500 },
    highlight: false,
  },
  {
    key: "starter",
    name: "Starter",
    pricePerMonth: 999,
    blurb: "For a single gym getting organised.",
    limits: { members: 500, branches: 2, staff: 10, whatsappMonthly: 2500 },
    highlight: false,
  },
  {
    key: "professional",
    name: "Professional",
    pricePerMonth: 2499,
    blurb: "For busy gyms with trainers and PT.",
    limits: { members: 2000, branches: 5, staff: 30, whatsappMonthly: 10000 },
    highlight: true,
  },
  {
    key: "business",
    name: "Business",
    pricePerMonth: 4999,
    blurb: "For chains running many branches.",
    limits: { members: 10000, branches: 20, staff: 100, whatsappMonthly: 50000 },
    highlight: false,
  },
] as const;

/** Routes that only make sense signed in: kept out of search results. */
export const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/members",
  "/memberships",
  "/membership-plans",
  "/billing",
  "/crm",
  "/settings",
  "/automation",
  "/pt-operations",
  "/calendar",
  "/classes",
  "/workout-sessions",
  "/workouts",
  "/nutrition",
  "/attendance",
  "/inventory",
  "/branches",
  "/staff",
  "/payroll",
  "/coo",
  "/owner-os",
  "/command-center",
  "/intelligence",
  "/business-os",
  "/ai",
  "/ai-actions",
  "/search",
  "/onboarding",
  "/platform",
  "/portal",
  "/member-portal",
  "/trainer",
  "/kiosk",
  "/verify-email",
  "/reset-password",
  "/api",
] as const;
