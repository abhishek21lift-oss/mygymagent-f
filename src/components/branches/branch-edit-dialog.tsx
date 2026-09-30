"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  OpeningHoursEditor,
  openingHoursValid,
} from "@/components/branches/opening-hours-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useEditBranch, type BranchUpdate } from "@/lib/hooks/use-branches";
import type { OpeningSlot } from "@/lib/opening-hours";
import type { Branch } from "@/lib/types/gym";

type TextField =
  | "name"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "postalCode"
  | "country"
  | "phone"
  | "email"
  | "mapsUrl";

function initial(branch: Branch): Record<TextField, string> {
  return {
    name: branch.name,
    addressLine1: branch.addressLine1 ?? "",
    addressLine2: branch.addressLine2 ?? "",
    city: branch.city ?? "",
    state: branch.state ?? "",
    postalCode: branch.postalCode ?? "",
    country: branch.country ?? "",
    phone: branch.phone ?? "",
    email: branch.email ?? "",
    mapsUrl: branch.mapsUrl ?? "",
  };
}

/** What is wrong with the form, field by field. */
function problems(
  values: Record<TextField, string>,
): Partial<Record<TextField, string>> {
  const found: Partial<Record<TextField, string>> = {};
  if (!values.name.trim()) found.name = "Give the branch a name.";
  if (
    values.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
  )
    found.email = "Enter a valid email.";
  if (
    values.mapsUrl.trim() &&
    !/^https:\/\/\S+\.\S+/.test(values.mapsUrl.trim())
  )
    found.mapsUrl = "Paste the full link, starting with https://";
  return found;
}

/**
 * Edits one branch: its address, how to reach it, directions and opening
 * hours -- what members see and what the WhatsApp auto-reply answers with.
 * Blank fields are cleared, not kept.
 */
export function BranchEditDialog({
  branch,
  trigger,
}: {
  branch: Branch;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState(() => initial(branch));
  const [hours, setHours] = React.useState<OpeningSlot[]>(
    branch.openingHours ?? [],
  );
  const [touched, setTouched] = React.useState(false);
  const edit = useEditBranch();

  // Each opening starts from the branch as saved now.
  function onOpenChange(next: boolean) {
    if (next) {
      setValues(initial(branch));
      setHours(branch.openingHours ?? []);
      setTouched(false);
    }
    setOpen(next);
  }

  const errors = problems(values);
  const hoursOk = openingHoursValid(hours);
  const set = (field: TextField) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: e.target.value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0 || !hoursOk) return;
    const blankToNull = (text: string) =>
      text.trim() === "" ? null : text.trim();
    const input: BranchUpdate = {
      name: values.name.trim(),
      addressLine1: blankToNull(values.addressLine1),
      addressLine2: blankToNull(values.addressLine2),
      city: blankToNull(values.city),
      state: blankToNull(values.state),
      postalCode: blankToNull(values.postalCode),
      country: blankToNull(values.country),
      phone: blankToNull(values.phone),
      email: blankToNull(values.email),
      mapsUrl: blankToNull(values.mapsUrl),
      openingHours: hours.length > 0 ? hours : null,
    };
    try {
      await edit.mutateAsync({ id: branch.id, input });
      toast.success(`${input.name} saved`);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Couldn't save the branch",
      );
    }
  }

  const field = (
    id: TextField,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`branch-${branch.id}-${id}`}>{label}</Label>
      <Input
        id={`branch-${branch.id}-${id}`}
        value={values[id]}
        onChange={set(id)}
        aria-invalid={touched && errors[id] ? true : undefined}
        className="min-h-11 rounded-xl"
        {...props}
      />
      {touched && errors[id] && (
        <p className="text-xs font-medium text-destructive">{errors[id]}</p>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <Pencil className="size-3.5" aria-hidden="true" /> Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {branch.name}</DialogTitle>
          <DialogDescription>
            Members see these details, and the WhatsApp auto-reply answers with
            them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="flex flex-col gap-5" noValidate>
          {field("name", "Branch name", { autoComplete: "organization" })}

          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold">Address</legend>
            {field("addressLine1", "Street address", {
              autoComplete: "address-line1",
              placeholder: "12 MG Road",
            })}
            {field("addressLine2", "Area / landmark", {
              autoComplete: "address-line2",
            })}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {field("city", "City", { autoComplete: "address-level2" })}
              {field("state", "State", { autoComplete: "address-level1" })}
              {field("postalCode", "PIN code", {
                autoComplete: "postal-code",
                inputMode: "numeric",
              })}
              {field("country", "Country", { autoComplete: "country-name" })}
            </div>
            {field("mapsUrl", "Google Maps link", {
              type: "url",
              inputMode: "url",
              placeholder: "https://maps.app.goo.gl/…",
            })}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold">Contact</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {field("phone", "Phone", {
                type: "tel",
                autoComplete: "tel",
                inputMode: "tel",
              })}
              {field("email", "Email", {
                type: "email",
                autoComplete: "email",
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">
              Opening hours
            </legend>
            <OpeningHoursEditor
              value={hours}
              onChange={setHours}
              disabled={edit.isPending}
            />
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                edit.isPending ||
                (touched && (!hoursOk || Object.keys(errors).length > 0))
              }
            >
              {edit.isPending ? "Saving…" : "Save branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
