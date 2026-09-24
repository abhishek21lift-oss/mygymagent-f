"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  usePortalMe,
  usePortalNotificationPreferences,
  useUpdatePortalNotificationPreference,
  useUpdatePortalProfile,
  type PortalProfileUpdate,
} from "@/lib/hooks/use-portal";

/** Only what the member may change. The server refuses anything else
 * outright, so this form is the same set rather than a subset of a
 * bigger one somebody could widen by accident. */
const FIELDS: Array<{ name: keyof PortalProfileUpdate; label: string }> = [
  { name: "phone", label: "Phone" },
  { name: "emergencyContactName", label: "Emergency contact" },
  { name: "emergencyContactPhone", label: "Emergency contact phone" },
  { name: "addressLine1", label: "Address" },
  { name: "addressLine2", label: "Address line 2" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "postalCode", label: "Postcode" },
];

export default function PortalAccountPage() {
  const me = usePortalMe();
  const update = useUpdatePortalProfile();
  const preferences = usePortalNotificationPreferences();
  const updatePreference = useUpdatePortalNotificationPreference();

  const [form, setForm] = React.useState<PortalProfileUpdate>({});
  const [loadedFor, setLoadedFor] = React.useState<string | null>(null);

  // Seed the form from the server the first time this member's data
  // arrives, and never again -- refetching mid-edit must not overwrite
  // what they are typing.
  const member = me.data?.member;
  if (member && loadedFor !== member.id) {
    setLoadedFor(member.id);
    // Every editable field, not just phone: rendering blanks over
    // stored values leaves a member unable to tell an empty field from
    // one this screen simply did not fetch.
    setForm({
      phone: member.phone ?? "",
      emergencyContactName: member.emergencyContactName ?? "",
      emergencyContactPhone: member.emergencyContactPhone ?? "",
      addressLine1: member.addressLine1 ?? "",
      addressLine2: member.addressLine2 ?? "",
      city: member.city ?? "",
      state: member.state ?? "",
      postalCode: member.postalCode ?? "",
    });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Send only what has something in it: the server rejects an empty
    // update rather than reporting a success that changed nothing.
    const changes = Object.fromEntries(
      Object.entries(form).filter(([, value]) => (value ?? "").trim() !== ""),
    );
    if (Object.keys(changes).length === 0) {
      toast.error("Nothing to save yet");
      return;
    }
    try {
      await update.mutateAsync(changes);
      toast.success("Details saved");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not save your details",
      );
    }
  }

  async function togglePreference(
    category: string,
    channel: "email" | "whatsapp" | "inApp",
    value: boolean,
  ) {
    try {
      await updatePreference.mutateAsync({ category, [channel]: value });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not change that setting",
      );
    }
  }

  const rows = preferences.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Your details" titleId="portal-account-details">
        <form onSubmit={handleSave} className="flex flex-col gap-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <Label htmlFor={`portal-${field.name}`}>{field.label}</Label>
                <Input
                  id={`portal-${field.name}`}
                  value={form[field.name] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  className="min-h-11"
                />
              </div>
            ))}
          </div>
          {/* Said once, plainly, rather than disabling fields that were
              never on the form in the first place. */}
          <p className="text-xs text-muted-foreground">
            Your name, email and membership are managed by the gym. Ask at the
            front desk to change those.
          </p>
          <Button
            type="submit"
            disabled={update.isPending}
            className="ml-auto min-h-11 rounded-lg"
          >
            {update.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Save
          </Button>
        </form>
      </Panel>

      <Panel
        title="What we message you about"
        titleId="portal-account-notifications"
        flush
      >
        <div className="p-4 sm:p-5">
          <DataState
            isLoading={preferences.isPending}
            isError={preferences.isError}
            onRetry={() => void preferences.refetch()}
            errorMessage="Your notification settings could not be loaded."
            isEmpty={rows.length === 0}
            emptyTitle="Nothing to set"
            emptyDescription="There are no notification categories yet."
            skeletonRows={4}
          >
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.key} className="flex flex-col gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.description}
                    </p>
                  </div>
                  {/* In-app only. The email and WhatsApp switches that
                      used to sit beside this one wrote columns no sender
                      reads -- see the note in the staff settings page --
                      so a member could mute a channel that was never
                      going to message them, or unmute one that still
                      will not. */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${row.key}-inApp`}
                      checked={row.inApp}
                      onCheckedChange={(next) =>
                        void togglePreference(row.key, "inApp", next)
                      }
                    />
                    <Label
                      htmlFor={`${row.key}-inApp`}
                      className="text-xs font-normal text-muted-foreground"
                    >
                      Notify me in the app
                    </Label>
                  </div>
                </li>
              ))}
            </ul>
          </DataState>
        </div>
      </Panel>
    </div>
  );
}
