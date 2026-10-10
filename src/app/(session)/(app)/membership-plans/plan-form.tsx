"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronDown, X } from "lucide-react";

import { BranchSelect } from "@/components/shared/branch-select";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { MembershipPlan } from "@/lib/types/gym";
import { displayCurrencyAmount } from "@/lib/utils";
import { createMembershipPlanSchema } from "@/lib/validation/gym";

const planFormSchema = createMembershipPlanSchema.extend({
  isActive: z.boolean(),
});
export type PlanFormInput = z.infer<typeof planFormSchema>;

const DURATION_UNITS = [
  { value: "days", label: "Days", days: 1 },
  { value: "weeks", label: "Weeks", days: 7 },
  { value: "months", label: "Months", days: 30 },
  { value: "years", label: "Years", days: 365 },
] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number]["value"];

/** Unit selectors are display-only: the API only knows total days. */
export function toDurationDays(value: number, unit: DurationUnit): number {
  const mult = DURATION_UNITS.find((u) => u.value === unit)?.days ?? 1;
  return Math.max(1, Math.round(value * mult));
}

/** Largest exact unit, so "365 days" reopens as "1 year". */
export function fromDurationDays(days: number): {
  value: number;
  unit: DurationUnit;
} {
  for (const unit of [...DURATION_UNITS].reverse()) {
    if (days % unit.days === 0) return { value: days / unit.days, unit: unit.value };
  }
  return { value: days, unit: "days" };
}

function Section({
  title,
  hint,
  open,
  children,
}: {
  title: string;
  hint?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open}
      className="group overflow-hidden rounded-2xl border border-border bg-card"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          {title}
          {hint && (
            <span className="block text-xs font-medium text-muted-foreground">
              {hint}
            </span>
          )}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="flex flex-col gap-4 border-t border-border p-4">
        {children}
      </div>
    </details>
  );
}

function BenefitsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const text = draft.trim();
    if (!text || value.length >= 20) return;
    if (value.some((b) => b.toLowerCase() === text.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, text]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Steam bath access"
          maxLength={80}
          aria-label="Add a benefit"
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={!draft.trim()}
          className="min-h-11 shrink-0"
        >
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Plan benefits">
          {value.map((benefit) => (
            <li
              key={benefit}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-muted py-1 pl-3 pr-1.5 text-xs font-semibold"
            >
              {benefit}
              <button
                type="button"
                onClick={() => onChange(value.filter((b) => b !== benefit))}
                aria-label={`Remove ${benefit}`}
                className="flex size-6 items-center justify-center rounded-full hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <FormItem className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
      <div className="min-w-0">
        <FormLabel>{label}</FormLabel>
        {hint && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      <FormControl>
        <Switch checked={checked} onCheckedChange={onChange} />
      </FormControl>
    </FormItem>
  );
}

/**
 * The membership-plan form, shared by the edit dialog and the dedicated
 * create page. Sections map 1:1 onto the stored model (plus display-only
 * duration units); nothing here invents a concept the API cannot persist.
 */
export function PlanForm({
  plan,
  pending,
  submitLabel,
  cancelHref,
  onCancel,
  onSubmit,
}: {
  /** Omit to create; pass to edit. */
  plan?: MembershipPlan;
  pending: boolean;
  /** Defaults to "Create plan" / "Save changes". */
  submitLabel?: string;
  /** Renders a Cancel link when set. */
  cancelHref?: string;
  /** Renders a Cancel button when set (e.g. closing a dialog). */
  onCancel?: () => void;
  onSubmit: (values: PlanFormInput) => Promise<void>;
}) {
  const initialUnit = React.useMemo(
    () => fromDurationDays(Number(plan?.durationDays ?? 30)),
    [plan?.durationDays],
  );
  const [durationUnit, setDurationUnit] = React.useState<DurationUnit>(
    initialUnit.unit,
  );
  const [allowFreeze, setAllowFreeze] = React.useState(
    (plan?.maxFreezeDays ?? 0) > 0,
  );
  const [branchScoped, setBranchScoped] = React.useState(Boolean(plan?.branchId));

  const form = useForm<PlanFormInput>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: plan?.name ?? "",
      code: plan?.code ?? "",
      category: plan?.category ?? "",
      description: plan?.description ?? "",
      branchId: plan?.branchId ?? "",
      durationDays: Number(plan?.durationDays ?? 30),
      price: plan ? Number(plan.price) : 0,
      currency: plan?.currency ?? "INR",
      benefits: plan?.benefits ?? [],
      maxFreezeDays: plan?.maxFreezeDays ?? 0,
      isFeatured: plan?.isFeatured ?? false,
      isPublic: plan?.isPublic ?? true,
      isActive: plan?.isActive ?? true,
    },
  });
  const watched = form.watch();
  const previewDays = toDurationDays(Number(watched.durationDays) || 0, durationUnit);
  const previewFreeze = allowFreeze ? Number(watched.maxFreezeDays) || 0 : 0;

  async function handleSubmit(values: PlanFormInput) {
    const cleaned: PlanFormInput = {
      ...values,
      code: values.code?.trim() ? values.code.trim() : undefined,
      category: values.category?.trim() ? values.category.trim() : undefined,
      branchId: branchScoped && values.branchId ? values.branchId : undefined,
      durationDays: toDurationDays(Number(values.durationDays) || 0, durationUnit),
      maxFreezeDays: allowFreeze ? Number(values.maxFreezeDays) || 0 : 0,
    };
    await onSubmit(cleaned);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-3"
      >
        <Section title="Basic information" hint="Name, code and how it is shown" open>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan name *</FormLabel>
                <FormControl>
                  <Input placeholder="12-Month Unlimited" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan code / SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="YR-UNLTD"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Premium"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {plan && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <ToggleRow
                  label="Active"
                  hint="Inactive plans cannot be sold to new members"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <ToggleRow
                  label="Display on app"
                  hint="Member-facing surfaces"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <ToggleRow
                  label="Featured plan"
                  hint="Badged on the plan card"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </Section>

        <Section title="Duration & validity" hint="How long a sold membership lasts">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="durationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <Select
                value={durationUnit}
                onValueChange={(v) => setDurationUnit(v as DurationUnit)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          </div>
          <p className="text-xs text-muted-foreground" role="status">
            Stored as {previewDays} {previewDays === 1 ? "day" : "days"}.
          </p>
        </Section>

        <Section title="Pricing & billing" hint="Base price, currency and tax notes">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base price *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Discounts are set at sale time and snapshotted on the
            membership — editing the plan never rewrites history.
          </p>
        </Section>

        <Section title="Access & entitlements" hint="Scope and included perks">
          <FormItem>
            <FormLabel>Branch scope</FormLabel>
            <div className="flex flex-col gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
                <Switch
                  checked={branchScoped}
                  onCheckedChange={(next) => {
                    setBranchScoped(next);
                    if (!next) form.setValue("branchId", "");
                  }}
                />
                Limit to a specific branch
              </label>
              {branchScoped && (
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        <BranchSelect
                          value={field.value || undefined}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </>
                  )}
                />
              )}
              {!branchScoped && (
                <p className="text-xs text-muted-foreground">
                  Available across every branch of the organization.
                </p>
              )}
            </div>
          </FormItem>
          <FormField
            control={form.control}
            name="benefits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Included perks</FormLabel>
                <FormControl>
                  <BenefitsEditor
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section title="Freeze" hint="Pause rules for sold memberships">
          <FormItem>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <FormLabel>Allow freeze</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Off means sold memberships cannot be paused
                </p>
              </div>
              <Switch checked={allowFreeze} onCheckedChange={setAllowFreeze} />
            </div>
          </FormItem>
          <FormField
            control={form.control}
            name="maxFreezeDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum freeze days</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    disabled={!allowFreeze}
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        {/* Live preview — the summary before saving. */}
        <section
          aria-label="Plan preview"
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="border-b border-border px-4 py-2.5">
            <h2 className="section-title">Preview</h2>
          </div>
          <div className="flex flex-col gap-1.5 p-4 text-sm">
            <p className="text-base font-extrabold tracking-tight">
              {watched.name?.trim() || "Untitled plan"}
              {watched.code?.trim() && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle font-mono text-[11px] font-bold text-muted-foreground">
                  {watched.code.trim()}
                </span>
              )}
            </p>
            <p className="font-bold tabular-nums">
              {displayCurrencyAmount(
                Number(watched.price) || 0,
                watched.currency || "INR",
              )}{" "}
              <span className="font-medium text-muted-foreground">
                / {previewDays}d
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {watched.category?.trim()
                ? `${watched.category.trim()} · `
                : ""}
              {previewFreeze > 0
                ? `Up to ${previewFreeze} freeze days`
                : "No freeze"}
              {" · "}
              {branchScoped ? "One branch" : "All branches"}
              {watched.isFeatured ? " · Featured" : ""}
              {!watched.isPublic ? " · Hidden from app" : ""}
            </p>
            {(watched.benefits?.length ?? 0) > 0 && (
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {(watched.benefits ?? []).map((b) => (
                  <li
                    key={b}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {cancelHref ? (
            <Button type="button" variant="outline" className="min-h-11" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          ) : onCancel ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="submit"
            className="min-h-11 sm:w-auto"
            disabled={pending}
          >
            {pending
              ? (submitLabel ?? (plan ? "Saving..." : "Creating..."))
              : (submitLabel ?? (plan ? "Save changes" : "Create plan"))}
          </Button>
        </div>
      </form>
    </Form>
  );
}
