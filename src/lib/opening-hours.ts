/**
 * A branch's weekly opening hours, as the API stores them: any number of
 * slots a day (a gym open 5–11 am and 4–10 pm has two), Monday = 0. A day
 * with no slot is closed. Mirrors mygymagent-b src/branches/opening-hours.ts.
 */
export interface OpeningSlot {
  day: number;
  open: string;
  close: string;
}

export const DAY_NAMES = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** "06:00" → "6:00 am", "24:00" → "midnight". */
export function readableTime(time: string): string {
  if (time === "24:00" || time === "00:00") return "midnight";
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** ["Mon–Sat: 5:00 am – 11:00 am, 4:00 pm – 10:00 pm", "Sun: Closed"]. */
export function readableWeek(
  slots: OpeningSlot[] | null | undefined,
): string[] {
  if (!slots || slots.length === 0) return [];
  const perDay = DAY_NAMES.map(
    (_, day) =>
      slots
        .filter((slot) => slot.day === day)
        .sort((a, b) => minutes(a.open) - minutes(b.open))
        .map(
          (slot) => `${readableTime(slot.open)} – ${readableTime(slot.close)}`,
        )
        .join(", ") || "Closed",
  );
  const lines: string[] = [];
  let start = 0;
  for (let day = 1; day <= DAY_NAMES.length; day++) {
    if (day < DAY_NAMES.length && perDay[day] === perDay[start]) continue;
    const label =
      day - 1 === start
        ? DAY_NAMES[start]
        : `${DAY_NAMES[start]}–${DAY_NAMES[day - 1]}`;
    lines.push(`${label}: ${perDay[start]}`);
    start = day;
  }
  return lines;
}

/** What is wrong with a day's slots, in words, or null when they are fine. */
export function slotProblem(
  slots: Array<Pick<OpeningSlot, "open" | "close">>,
): string | null {
  const sorted = [...slots].sort((a, b) => minutes(a.open) - minutes(b.open));
  for (const [i, slot] of sorted.entries()) {
    if (!slot.open || !slot.close) return "Enter both times.";
    if (minutes(slot.close) <= minutes(slot.open))
      return `Closes (${slot.close}) before it opens (${slot.open}).`;
    const previous = sorted[i - 1];
    if (previous && minutes(slot.open) < minutes(previous.close))
      return "Two times overlap.";
  }
  return null;
}
