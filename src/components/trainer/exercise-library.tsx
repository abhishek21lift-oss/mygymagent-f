"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The dark card that opens the exercise library.
 *
 * The reference catches this one mid-scroll, so only its top is visible:
 * a near-black field with a faint grid, a white "+ New exercise" pill and
 * a refresh button. Reproduced to that much -- inventing the rest of the
 * card's contents from a 200px glimpse would be guessing at a screen
 * nobody has seen whole.
 *
 * The grid is a repeating linear-gradient rather than an SVG or an image:
 * it is two lines of CSS, costs no request, and scales with the card.
 */
export function ExerciseHeaderCard({
  action,
  onRefresh,
  refreshing,
}: {
  /** Slot for the "new exercise" affordance. The form behind it is the
   *  staff app's, shared via `NewExerciseDialog` -- this surface only
   *  decides how the trigger looks. */
  action: React.ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[var(--t-radius-tile)] bg-[#0b1023] px-5 py-6"
      aria-label="Exercise library actions"
    >
      {/* Two thin rules 22px apart, masked out towards the bottom so the
          grid fades rather than stopping at a hard line. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "linear-gradient(to bottom, #000 30%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 30%, transparent 85%)",
        }}
      />

      <div className="relative flex items-center gap-3">
        {action}

        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh exercises"
          className="inline-flex size-12 items-center justify-center rounded-[var(--t-radius-pill)] bg-white/10 text-white transition-transform active:scale-95 disabled:opacity-60"
          disabled={refreshing}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>

        {/* Screen-reader-only: the reference shows no caption on this card,
            and a visible one would be my invention rather than its design.
            Announced instead, so the refresh state is still conveyed. */}
        <span className="sr-only" role="status">
          {refreshing ? "Refreshing exercises" : "Exercises loaded"}
        </span>
      </div>
    </section>
  );
}

/** The dark card's "new exercise" trigger: a white pill on near-black. */
export function TrainerNewExerciseTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-[var(--t-radius-pill)] bg-white px-5 text-[1rem] font-extrabold text-[#0b1023] transition-transform active:scale-[0.97]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      New exercise
    </button>
  );
}

/**
 * "Browse by muscle" -- the horizontal scroller of tinted category cards.
 *
 * The cards are intentionally larger than the viewport's comfortable
 * reading width so the next one is always peeking: the reference shows a
 * sliver of the fourth card at the left edge, which is the only signal
 * that the row scrolls at all. Scroll-snap makes the peek land on a card
 * boundary rather than wherever a flick happens to stop.
 */

export type MuscleCategory = {
  key: string;
  label: string;
  count: number;
  gradient: [string, string];
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

export function MuscleCategoryScroller({
  categories,
  active,
  onSelect,
}: {
  categories: MuscleCategory[];
  active: string | null;
  onSelect: (key: string | null) => void;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scroller}
      className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Browse by muscle"
    >
      {categories.map((category) => {
        const selected = active === category.key;
        return (
          <button
            key={category.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? null : category.key)}
            data-gradient
            className={cn(
              "relative flex h-[9.375rem] w-[9.375rem] shrink-0 snap-start flex-col items-start justify-end overflow-hidden rounded-[var(--t-radius-muscle)] p-3.5 text-left text-white transition-transform",
              selected ? "scale-[0.96] ring-4 ring-white/70" : "active:scale-[0.98]",
            )}
            style={{
              backgroundImage: `linear-gradient(140deg, ${category.gradient[0]}, ${category.gradient[1]})`,
              boxShadow: "var(--t-shadow-tile)",
            }}
          >
            {/* The mark, inset in a translucent white tile. */}
            <span className="absolute left-3.5 top-3.5 grid size-11 place-items-center rounded-xl bg-white/25">
              <category.Icon className="size-[1.375rem]" strokeWidth={2.25} />
            </span>
            {/* A large faint duplicate as a watermark, bottom-right. */}
            <category.Icon
              className="pointer-events-none absolute -right-1 -bottom-1 size-20 text-white/15"
              strokeWidth={1.5}
            />
            <span className="relative text-[1.25rem] font-extrabold tracking-tight">
              {category.label}
            </span>
            <span className="relative text-[0.8125rem] font-semibold text-white/85">
              {category.count} exercises
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The search field and the chip row beneath it. */
export function ExerciseSearchBar({
  query,
  onQueryChange,
  chips,
  activeChip,
  onChipSelect,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  chips: Array<{ key: string; label: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }>;
  activeChip: string | null;
  onChipSelect: (key: string | null) => void;
}) {
  return (
    <>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-5 top-1/2 size-[1.375rem] -translate-y-1/2 text-[var(--t-ink-faint)]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name, muscle, equipment"
          aria-label="Search exercises"
          className="h-[3.75rem] w-full rounded-[var(--t-radius-pill)] border border-[var(--t-line-strong)] bg-white pl-14 pr-5 text-[length:var(--t-text-body)] font-medium text-[var(--t-ink)] outline-none placeholder:text-[var(--t-ink-faint)] focus:border-[var(--t-teal)] focus:ring-2 focus:ring-[var(--t-teal)]/30"
        />
      </div>

      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => {
          const selected = activeChip === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onChipSelect(selected ? null : chip.key)}
              className={cn(
                "inline-flex min-h-[3.375rem] shrink-0 items-center gap-2 rounded-[var(--t-radius-pill)] border px-5 text-[1.125rem] font-bold transition-colors",
                selected
                  ? "border-[var(--t-teal)] bg-[var(--t-teal-tint)] text-[var(--t-teal)]"
                  : "border-[var(--t-line-strong)] bg-white text-[#1f2937]",
              )}
            >
              <chip.Icon className="size-[1.375rem]" strokeWidth={2.25} />
              {chip.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export type ChipTone = "neutral" | "green" | "orange" | "blue";

/** One metadata pill on an exercise row. */
export function ExerciseTag({
  tone,
  children,
}: {
  tone: ChipTone;
  children: React.ReactNode;
}) {
  const tones: Record<ChipTone, string> = {
    neutral:
      "border-[var(--t-chip-neutral-line)] text-[var(--t-chip-neutral-ink)]",
    green: "border-[var(--t-chip-green-line)] bg-[var(--t-chip-green-bg)] text-[var(--t-chip-green-ink)]",
    orange:
      "border-[var(--t-chip-orange-line)] bg-[var(--t-chip-orange-bg)] text-[var(--t-chip-orange-ink)]",
    blue: "border-[var(--t-chip-blue-line)] bg-[var(--t-chip-blue-bg)] text-[var(--t-chip-blue-ink)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--t-radius-pill)] border px-3.5 py-1.5 text-[length:var(--t-text-chip)] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
