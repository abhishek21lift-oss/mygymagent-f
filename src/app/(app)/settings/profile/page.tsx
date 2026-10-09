"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Clock,
  ImagePlus,
  MapPin,
  Phone,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { BranchEditDialog } from "@/components/branches/branch-edit-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageHero } from "@/components/shared/page-hero";
import { Panel } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranches } from "@/lib/hooks/use-branches";
import {
  LOGO_TYPES,
  MAX_LOGO_BYTES,
  useOrganization,
  useRemoveLogo,
  useUpdateOrganization,
  useUploadLogo,
} from "@/lib/hooks/use-organization";
import { readableWeek } from "@/lib/opening-hours";
import { CURRENCIES, TIMEZONES, withCurrent } from "@/lib/regions";
import {
  profileChanges,
  profileFormFrom,
  profileProblems,
  type ProfileForm,
} from "@/lib/gym-profile";
import type { Organization } from "@/lib/types/auth";

function LogoCard({ org, canEdit }: { org: Organization; canEdit: boolean }) {
  const upload = useUploadLogo();
  const remove = useRemoveLogo();
  const input = React.useRef<HTMLInputElement>(null);
  const busy = upload.isPending || remove.isPending;

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type))
      return void toast.error("Choose a PNG, JPEG or WebP image.");
    if (file.size > MAX_LOGO_BYTES)
      return void toast.error("The logo must be 2 MB or smaller.");
    try {
      await upload.mutateAsync(file);
      toast.success("Logo updated");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Couldn't upload the logo",
      );
    }
  }

  async function clear() {
    try {
      await remove.mutateAsync();
      toast.success("Logo removed");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Couldn't remove the logo",
      );
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
        {org.logoUrl ? (
          // A signed, short-lived storage URL: next/image would cache and
          // re-serve it after it expires.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.logoUrl}
            alt={`${org.name} logo`}
            className="size-full object-contain"
          />
        ) : (
          <Store className="size-8 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-xs text-muted-foreground">
          Square PNG, JPEG or WebP, up to 2 MB.
        </p>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept={LOGO_TYPES.join(",")}
              className="sr-only"
              onChange={choose}
              aria-label="Logo file"
              tabIndex={-1}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden="true" />{" "}
              {upload.isPending
                ? "Uploading…"
                : org.logoUrl
                  ? "Replace logo"
                  : "Upload logo"}
            </Button>
            {org.logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={clear}
              >
                <Trash2 className="size-4" aria-hidden="true" /> Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BranchesPanel({ canEdit }: { canEdit: boolean }) {
  const branches = useBranches({ pageSize: 50 });
  return (
    <Panel
      title="Branches"
      titleId="profile-branches"
      description="Address, directions and opening hours for each location"
      flush
    >
      {branches.isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : branches.isError ? (
        <div className="p-5">
          <ErrorState onRetry={() => branches.refetch()} />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {(branches.data?.items ?? []).map((branch) => {
            const address = [
              branch.addressLine1,
              branch.addressLine2,
              branch.city,
              branch.state,
              branch.postalCode,
            ]
              .filter(Boolean)
              .join(", ");
            const week = readableWeek(branch.openingHours);
            return (
              <li
                key={branch.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6"
              >
                <div className="min-w-0 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 font-semibold">
                    <Building2
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />{" "}
                    {branch.name}
                  </p>
                  <p
                    className={`flex items-start gap-2 ${address ? "" : "text-amber-700 dark:text-amber-400"}`}
                  >
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span>
                      {address || "No address yet"}
                      {branch.mapsUrl && (
                        <>
                          {" · "}
                          <a
                            href={branch.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline-offset-2 hover:underline"
                          >
                            Directions
                          </a>
                        </>
                      )}
                    </span>
                  </p>
                  {branch.phone && (
                    <p className="flex items-center gap-2 tabular-nums">
                      <Phone
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />{" "}
                      {branch.phone}
                    </p>
                  )}
                  <div
                    className={`flex items-start gap-2 ${week.length ? "" : "text-amber-700 dark:text-amber-400"}`}
                  >
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {week.length ? (
                      <ul className="space-y-0.5">
                        {week.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>No opening hours yet</span>
                    )}
                  </div>
                </div>
                {canEdit && <BranchEditDialog branch={branch} />}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/** The editable part, mounted once the organization has loaded so its
 * form starts from the saved values. */
function ProfileEditor({
  org,
  canEdit,
}: {
  org: Organization;
  canEdit: boolean;
}) {
  const update = useUpdateOrganization();
  const [form, setForm] = React.useState<ProfileForm>(() =>
    profileFormFrom(org),
  );
  const [touched, setTouched] = React.useState(false);

  const errors = profileProblems(form);
  const pending = profileChanges(form, org);
  const dirty = Object.keys(pending).length > 0;

  const set = (field: keyof ProfileForm) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0 || !dirty) return;
    try {
      const saved = await update.mutateAsync(pending);
      setForm(profileFormFrom(saved));
      setTouched(false);
      toast.success("Gym profile saved");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Couldn't save the gym profile",
      );
    }
  }

  const text = (
    field: keyof ProfileForm,
    label: string,
    props: React.ComponentProps<typeof Input> & { hint?: string } = {},
  ) => {
    const { hint, ...inputProps } = props;
    const error = touched ? errors[field] : undefined;
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`profile-${field}`}>{label}</Label>
        <Input
          id={`profile-${field}`}
          value={form[field]}
          onChange={(e) => set(field)(e.target.value)}
          disabled={!canEdit || update.isPending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `profile-${field}-note` : undefined}
          className="min-h-11 rounded-xl"
          {...inputProps}
        />
        {(error || hint) && (
          <p
            id={`profile-${field}-note`}
            className={`text-xs ${error ? "font-medium text-destructive" : "text-muted-foreground"}`}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={save} noValidate className="grid gap-5 xl:grid-cols-2">
      <Panel title="Gym" titleId="profile-gym">
        <div className="space-y-5">
          <LogoCard org={org} canEdit={canEdit} />
          {text("name", "Gym name", { autoComplete: "organization" })}
        </div>
      </Panel>

      <Panel
        title="Contact"
        titleId="profile-contact"
        description="Shown to members, and used when a branch has none of its own"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {text("contactPhone", "Phone", {
            type: "tel",
            inputMode: "tel",
            autoComplete: "tel",
            placeholder: "+91 98765 43210",
          })}
          {text("contactEmail", "Email", {
            type: "email",
            autoComplete: "email",
            placeholder: "hello@yourgym.in",
          })}
          {text("website", "Website", {
            inputMode: "url",
            placeholder: "yourgym.in",
          })}
          {text("instagram", "Instagram", {
            placeholder: "@yourgym",
            autoCapitalize: "none",
          })}
        </div>
      </Panel>

      <Panel
        title="Region"
        titleId="profile-region"
        description="Every date and price the gym sends uses these"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-timezone">Timezone</Label>
            <Select
              value={form.timezone}
              onValueChange={set("timezone")}
              disabled={!canEdit || update.isPending}
            >
              <SelectTrigger
                id="profile-timezone"
                className="min-h-11 rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {withCurrent(TIMEZONES, org.timezone).map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-currency">Currency</Label>
            <Select
              value={form.currency}
              onValueChange={set("currency")}
              disabled={!canEdit || update.isPending}
            >
              <SelectTrigger
                id="profile-currency"
                className="min-h-11 rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {withCurrent(CURRENCIES, org.currency).map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel
        title="Emails to members"
        titleId="profile-email"
        description="The sender members see, and where their replies go"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {text("emailFromName", "Sender name", {
            placeholder: org.name,
            hint: "Defaults to the platform name when blank.",
          })}
          {text("emailReplyTo", "Reply-to email", {
            type: "email",
            placeholder: "desk@yourgym.in",
          })}
        </div>
      </Panel>

      {canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 sm:static sm:border-0 sm:bg-transparent sm:p-0 xl:col-span-2">
          <div className="flex items-center justify-end gap-3">
            {dirty && (
              <span className="text-xs text-muted-foreground">
                Unsaved changes
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              disabled={!dirty || update.isPending}
              onClick={() => setForm(profileFormFrom(org))}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="min-h-11 rounded-lg"
              disabled={!dirty || update.isPending}
            >
              {update.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

export default function GymProfilePage() {
  const { hasPermission } = useAuth();
  const org = useOrganization();

  return (
    <div className="flex flex-col gap-5 pb-24 sm:pb-4">
      <PageHero
        id="profile-title"
        icon={Store}
        title="Gym profile"
        description="How your gym appears to members, in messages and on WhatsApp"
        actions={
          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <Link href="/settings">
              <ArrowLeft className="size-4" aria-hidden="true" /> Settings
            </Link>
          </Button>
        }
      />

      {org.data ? (
        <ProfileEditor
          org={org.data}
          canEdit={hasPermission("organizations.update")}
        />
      ) : org.isError ? (
        <ErrorState onRetry={() => org.refetch()} />
      ) : (
        <div className="space-y-3" aria-label="Loading gym profile">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      )}

      <BranchesPanel canEdit={hasPermission("branches.update")} />
    </div>
  );
}
