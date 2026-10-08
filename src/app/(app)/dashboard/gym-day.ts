import * as React from "react";

/*
 * The gym's calendar day, shared by the dashboard and its Today
 * drill-down pages so both always mean the same day.
 */

/** YYYY-MM-DD in the gym's timezone — what the API bounds by day. */
export function isoDay(date: Date, timeZone: string | null | undefined) {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
  try {
    return new Intl.DateTimeFormat("en-CA", { ...options, timeZone: timeZone ?? undefined }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", options).format(date);
  }
}

/** Pure calendar arithmetic on a YYYY-MM-DD string — no clock, no
 * timezone, so a DST day can never make "tomorrow" equal "today". */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10);
}

/** "Oct 6" for a YYYY-MM-DD. Formatted as a UTC calendar date: the
 * string is already the gym's day, and re-zoning it shifted the label a
 * day whenever the browser sat east of the gym. */
export function shortDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: "UTC", month: "short", day: "numeric" }).format(
      new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)),
    );
  } catch {
    return iso;
  }
}

/** Today in the gym's timezone, re-checked every minute so a dashboard
 * left open overnight moves to the new day by itself. */
export function useGymToday(timeZone: string | null | undefined): string {
  const [stamp, setStamp] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setStamp((previous) =>
        isoDay(new Date(previous), timeZone) === isoDay(new Date(), timeZone) ? previous : Date.now(),
      );
    }, 60_000);
    return () => window.clearInterval(id);
  }, [timeZone]);
  return React.useMemo(() => isoDay(new Date(stamp), timeZone), [stamp, timeZone]);
}
