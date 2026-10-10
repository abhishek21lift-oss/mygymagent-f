"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddStaffForm } from "./add-staff-form";
import { accentVars } from "./staff-visuals";

export { generatePassword } from "./add-staff-form";

/**
 * Add-staff floating window, kept for secondary entry points. The primary
 * creation experience is the dedicated `/staff/new` page — both render
 * the same `AddStaffForm`, so there is exactly one implementation.
 */
export function AddStaffDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="btn-sheen inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"
          style={{
            ...accentVars("violet"),
            backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))",
            color: "var(--tone-on)",
          }}
        >
          <UserPlus className="size-4" aria-hidden="true" />
          Add staff
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92dvh] gap-0 overflow-hidden rounded-3xl border-0 bg-transparent p-0 shadow-none sm:max-w-2xl"
      >
        <AddStaffForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
