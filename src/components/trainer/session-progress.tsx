"use client";

import { cn } from "@/lib/utils";

/**
 * The "1/3" progress ring in the session dashboard header.
 *
 * Drawn rather than imported: a ring this specific is two arcs and a
 * centre label, and pulling in a charting dependency for it would be the
 * "unnecessary dependencies" the brief rules out. `conic-gradient` does
 * the arc; the track is the same gradient with the unfilled stop moved
 * to the end, which keeps the two perfectly concentric at any size
 * without a second element to keep in sync.
 *
 * The stroke is a fixed proportion of the box, not a pixel value, so it
 * scales with the ring instead of thinning out when the ring grows.
 */
export function SessionProgress({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const safeTotal = Math.max(total, 0);
  const safeCurrent = Math.min(Math.max(current, 0), safeTotal || 0);
  // A total of zero would divide by zero and render NaN in the gradient.
  const fraction = safeTotal > 0 ? safeCurrent / safeTotal : 0;
  const percent = Math.round(fraction * 100);

  return (
    <div
      className={cn(
        // Fluid rather than a fixed 6.5rem. The reference's ring is ~14%
        // of the viewport width; pinned at 104px it ate a third of a 390px
        // screen and forced the title to wrap and the pills onto a second
        // row. The stroke is a percentage so the proportion holds at any
        // size, and the label is clamped with it.
        "relative grid aspect-square shrink-0 place-items-center",
        "size-[clamp(3.25rem,13vw,5rem)]",
        className,
      )}
      role="img"
      aria-label={`${safeCurrent} of ${safeTotal} sessions done`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from -90deg, var(--t-coral-soft) 0%, var(--t-amber) ${percent}%, var(--t-progress-track) ${percent}% 100%)`,
          mask: "radial-gradient(farthest-side, transparent calc(100% - 13%), #000 calc(100% - 13%))",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 13%), #000 calc(100% - 13%))",
        }}
      />
      <span className="relative font-extrabold tracking-tight text-[var(--t-ink)] tabular-nums text-[clamp(1rem,4.2vw,1.75rem)]">
        {safeCurrent}/{safeTotal}
      </span>
    </div>
  );
}

/**
 * The three counts under the title: "1 on the floor", "1 to go",
 * "1 done". Each is a tinted pill, and the two teal ones are the same
 * colour in the reference -- the dot and the check are what distinguish
 * them, not a second palette entry.
 */
export type SessionSummaryTone = "teal" | "violet";

export function SessionSummary({
  onTheFloor,
  toGo,
  done,
}: {
  onTheFloor: number;
  toGo: number;
  done: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SummaryPill tone="teal">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-[var(--t-teal-dot)]"
        />
        <span className="font-extrabold tabular-nums">{onTheFloor}</span> on the
        floor
      </SummaryPill>
      <SummaryPill tone="violet">
        <span className="font-extrabold tabular-nums">{toGo}</span> to go
      </SummaryPill>
      <SummaryPill tone="teal">
        <DoneIcon />
        <span className="font-extrabold tabular-nums">{done}</span> done
      </SummaryPill>
    </div>
  );
}

function SummaryPill({
  tone,
  children,
}: {
  tone: SessionSummaryTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        // 0.9375rem / px-3.5 rather than 1.0625rem / px-4: at the
        // reference's proportion the three pills sit on one row, and the
        // wider padding pushed them onto a second. whitespace-nowrap so a
        // narrow pill never breaks mid-phrase; the row still wraps as a
        // whole if there is genuinely no space.
        "inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-[var(--t-radius-pill)] px-3 text-[0.875rem] font-semibold",
        tone === "teal"
          ? "bg-[var(--t-teal-tint)] text-[var(--t-teal)]"
          : "bg-[var(--t-violet-tint)] text-[var(--t-violet)]",
      )}
    >
      {children}
    </span>
  );
}

function DoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}
