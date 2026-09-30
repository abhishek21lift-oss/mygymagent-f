"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DAY_NAMES, slotProblem, type OpeningSlot } from "@/lib/opening-hours";

const DEFAULT_SLOT = { open: "06:00", close: "22:00" };

/**
 * A week of opening hours, a row per day. A day is open or closed; an open
 * day has one or more time ranges, so a gym that shuts in the afternoon is
 * two ranges, not a lie. Problems (closes before it opens, overlaps) show
 * under the day as they are typed.
 */
export function OpeningHoursEditor({
  value,
  onChange,
  disabled,
}: {
  value: OpeningSlot[];
  onChange: (slots: OpeningSlot[]) => void;
  disabled?: boolean;
}) {
  const slotsFor = (day: number) => value.filter((slot) => slot.day === day);
  const replaceDay = (
    day: number,
    slots: Array<Pick<OpeningSlot, "open" | "close">>,
  ) =>
    onChange([
      ...value.filter((slot) => slot.day !== day),
      ...slots.map((slot) => ({ day, ...slot })),
    ]);

  /** Copies Monday's hours to Tuesday–Saturday: most gyms keep one weekday schedule. */
  function copyMonday() {
    const monday = slotsFor(0);
    onChange([
      ...value.filter((slot) => slot.day === 0 || slot.day === 6),
      ...[1, 2, 3, 4, 5].flatMap((day) =>
        monday.map(({ open, close }) => ({ day, open, close })),
      ),
    ]);
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {DAY_NAMES.map((name, day) => {
          const slots = slotsFor(day);
          const open = slots.length > 0;
          const problem = open ? slotProblem(slots) : null;
          return (
            <li key={name} className="px-3 py-2.5 sm:px-4">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <label className="flex min-h-9 w-24 shrink-0 items-center gap-2 text-sm font-medium">
                  <Switch
                    checked={open}
                    disabled={disabled}
                    onCheckedChange={(on) =>
                      replaceDay(day, on ? [DEFAULT_SLOT] : [])
                    }
                    aria-label={`${name} open`}
                  />
                  {name}
                </label>
                {open ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.open}
                          disabled={disabled}
                          aria-label={`${name} opens`}
                          className="h-9 w-[7.5rem] rounded-lg"
                          onChange={(e) =>
                            replaceDay(
                              day,
                              slots.map((s, i) =>
                                i === index
                                  ? { ...s, open: e.target.value }
                                  : s,
                              ),
                            )
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          to
                        </span>
                        <Input
                          type="time"
                          value={slot.close === "24:00" ? "23:59" : slot.close}
                          disabled={disabled}
                          aria-label={`${name} closes`}
                          className="h-9 w-[7.5rem] rounded-lg"
                          onChange={(e) =>
                            replaceDay(
                              day,
                              slots.map((s, i) =>
                                i === index
                                  ? { ...s, close: e.target.value }
                                  : s,
                              ),
                            )
                          }
                        />
                        {slots.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0"
                            disabled={disabled}
                            aria-label={`Remove ${name} ${slot.open}–${slot.close}`}
                            onClick={() =>
                              replaceDay(
                                day,
                                slots.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <X className="size-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {problem && (
                      <p
                        role="alert"
                        className="text-xs font-medium text-destructive"
                      >
                        {problem}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="flex min-h-9 items-center text-sm text-muted-foreground">
                    Closed
                  </span>
                )}
                {open && slots.length < 4 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 shrink-0 text-xs"
                    disabled={disabled}
                    onClick={() =>
                      replaceDay(day, [
                        ...slots,
                        { open: "16:00", close: "22:00" },
                      ])
                    }
                    aria-label={`Add another ${name} time`}
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> Split
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {slotsFor(0).length > 0 && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
          disabled={disabled}
          onClick={copyMonday}
        >
          Use Monday’s hours for Tue–Sat
        </Button>
      )}
    </div>
  );
}

/** Whether every open day's hours are valid. */
export function openingHoursValid(slots: OpeningSlot[]): boolean {
  return DAY_NAMES.every((_, day) => {
    const daySlots = slots.filter((slot) => slot.day === day);
    return daySlots.length === 0 || slotProblem(daySlots) === null;
  });
}
