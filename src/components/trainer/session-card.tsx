"use client";

import { cn } from "@/lib/utils";

/**
 * The two session cards in the dashboard.
 *
 * They are one component rather than two because the reference is clearly
 * one design used twice -- same radius, same wash, same CTA geometry --
 * and the only real differences are the wash colour, the leading slot (a
 * soft relative time vs a clock time) and the badge. A `variant` prop keeps
 * that relationship explicit and stops the two drifting apart the way a
 * pair of near-duplicate components would.
 *
 * ## Why the layout is a container query
 *
 * The reference puts four things on one row: a time, an avatar, a
 * badge/name/subtitle stack, and a CTA. That composition is ~27% of the
 * card's width given over to the name alone. Measured on a 390px phone
 * the row budgets out to roughly 28px for the name -- the badge wraps to
 * two lines and collides with the CTA, which is exactly what a fixed row
 * produced here before this change.
 *
 * So the row is kept wherever it fits and stacked below it, via a
 * container query rather than a viewport one: the card lives inside a
 * `max-w-lg` page, so its width is not the viewport's, and a media query
 * would measure the wrong thing. The reference composition is preserved
 * from 24.5rem of card width up; a 390-430px phone gets the same design
 * with the CTA on its own line, which is the honest reading -- the
 * reference row does not fit there at all.
 */

export type SessionCardVariant = "current" | "upcoming";
export type SessionBadge = "on-the-floor" | "next";

export function SessionCard({
  variant,
  badge,
  time,
  initials,
  name,
  subtitle,
  warning,
  action,
  photoUrl,
  className,
}: {
  variant: SessionCardVariant;
  badge: SessionBadge;
  time: { primary: string; secondary: string };
  initials: string;
  name: string;
  subtitle: string;
  warning?: string;
  action: { label: string; onClick?: () => void; href?: string; disabled?: boolean };
  photoUrl?: string | null;
  className?: string;
}) {
  const current = variant === "current";

  return (
    <section
      className={cn(
        "@container rounded-[var(--t-radius-tile)] border-[1.5px] p-4",
        current
          ? "border-[var(--t-cyan-line)] bg-[var(--t-cyan-card)]"
          : "border-[var(--t-lav-line)] bg-[var(--t-lav-card)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 @min-[24.5rem]:flex-nowrap">
        {/* Leading slot. The reference puts a soft two-line time here for
            the in-progress card and a large clock for the next one, so
            the typography differs even though the slot does not. */}
        <div className="w-12 shrink-0 @min-[24.5rem]:w-14">
          <p
            className={cn(
              "font-extrabold leading-none tracking-tight text-[var(--t-ink)]",
              current ? "text-[0.8125rem]" : "text-[1.75rem]",
            )}
          >
            {time.primary}
          </p>
          <p
            className={cn(
              "font-bold uppercase tracking-wide text-[var(--t-ink-muted)]",
              current ? "text-[0.6875rem]" : "text-[0.8125rem]",
            )}
          >
            {time.secondary}
          </p>
        </div>

        <SessionAvatar initials={initials} photoUrl={photoUrl} current={current} />

        {/* min-w-0 so the stack can shrink; flex-basis full-width below
            30rem so the CTA drops to its own line instead of squeezing
            the name out of existence. */}
        <div className="min-w-0 basis-full @min-[24.5rem]:basis-auto @min-[24.5rem]:flex-1">
          <SessionBadgePill badge={badge} />
          <p className="mt-1 text-[1.25rem] leading-tight font-extrabold tracking-tight text-[var(--t-ink)]">
            {name}
          </p>
          <p className="truncate text-[0.875rem] font-medium text-[var(--t-ink-muted)]">
            {subtitle}
          </p>
        </div>

        <SessionAction
          label={action.label}
          onClick={action.onClick}
          href={action.href}
          disabled={action.disabled}
          current={current}
          className="ml-auto @min-[24.5rem]:ml-0"
        />
      </div>

      {warning ? (
        <p className="mt-3 flex items-center gap-2 rounded-[1rem] bg-[var(--t-warn-bg)] px-3.5 py-2.5 text-[0.9375rem] font-bold text-[var(--t-warn-ink)]">
          <WarningIcon />
          {warning}
        </p>
      ) : null}
    </section>
  );
}

function SessionAvatar({
  initials,
  photoUrl,
  current,
}: {
  initials: string;
  photoUrl?: string | null;
  current: boolean;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "grid place-items-center overflow-hidden rounded-full",
          current
            ? "size-12 bg-white ring-[2.5px] ring-white @min-[24.5rem]:size-14"
            : "size-14 bg-white",
        )}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <span
            className={cn(
              "font-extrabold tracking-tight",
              current
                ? "text-[0.9375rem] text-[var(--t-ink)]"
                : "text-[1.125rem] text-[var(--t-violet)]",
            )}
          >
            {initials}
          </span>
        )}
      </div>
      {current ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -bottom-0.5 size-[0.875rem] rounded-full bg-[var(--t-teal-dot)] ring-[2.5px] ring-white"
        />
      ) : null}
    </div>
  );
}

function SessionBadgePill({ badge }: { badge: SessionBadge }) {
  const onTheFloor = badge === "on-the-floor";
  return (
    <span
      data-gradient
      // whitespace-nowrap: "ON THE FLOOR" wrapping to two lines is what
      // pushed the name out of the card entirely.
      className={cn(
        "inline-flex items-center rounded-[var(--t-radius-pill)] px-3 py-1 text-[0.6875rem] font-extrabold tracking-[0.06em] whitespace-nowrap text-white uppercase",
        onTheFloor
          ? "bg-[linear-gradient(135deg,var(--t-teal-grad-a),var(--t-teal-grad-b))]"
          : "bg-[linear-gradient(135deg,var(--t-violet),var(--t-violet-ink))]",
      )}
      style={{
        boxShadow: onTheFloor ? "var(--t-shadow-cta)" : "var(--t-shadow-cta-violet)",
      }}
    >
      {onTheFloor ? "On the floor" : "Next"}
    </span>
  );
}

function SessionAction({
  label,
  onClick,
  href,
  disabled,
  current,
  className,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  current: boolean;
  className?: string;
}) {
  const classNames = cn(
    "inline-flex min-h-12 shrink-0 items-center gap-0.5 rounded-[var(--t-radius-pill)] px-5 text-[1.0625rem] font-extrabold text-white transition-transform active:scale-[0.97] disabled:opacity-50",
    current
      ? "bg-[linear-gradient(135deg,var(--t-teal-grad-a),var(--t-teal-grad-b))]"
      : "bg-[linear-gradient(135deg,var(--t-violet),var(--t-violet-ink))]",
    className,
  );
  const style = {
    boxShadow: current ? "var(--t-shadow-cta)" : "var(--t-shadow-cta-violet)",
  };

  const inner = (
    <>
      {label}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 5 7 7-7 7" />
      </svg>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={classNames}
        style={style}
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.();
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classNames}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {inner}
    </button>
  );
}

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
