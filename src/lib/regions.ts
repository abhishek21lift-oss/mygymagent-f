/**
 * Timezones and currencies a gym can pick. One list for onboarding and the
 * Gym profile, and both are select-only: the backend refuses anything that
 * is not an IANA zone or a 3-letter code, and free text let a typo shift
 * every date the gym sends.
 */
export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
] as const;

export const CURRENCIES = [
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
  { value: "SGD", label: "SGD (S$)", symbol: "S$" },
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
  { value: "SAR", label: "SAR (﷼)", symbol: "﷼" },
] as const;

/** The list with `current` in it, so a gym already on another zone or
 * currency still sees (and keeps) its own value. */
export function withCurrent<T extends { value: string; label: string }>(
  options: readonly T[],
  current: string | undefined,
): Array<{ value: string; label: string }> {
  if (!current || options.some((option) => option.value === current))
    return [...options];
  return [{ value: current, label: current }, ...options];
}
