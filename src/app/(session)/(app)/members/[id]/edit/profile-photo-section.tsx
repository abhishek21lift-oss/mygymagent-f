"use client";

import * as React from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useMemberDocuments,
  useUploadMemberDocument,
} from "@/lib/hooks/use-member-documents";
import { ApiError } from "@/lib/api/client";
import { validateProfilePhoto } from "./photo-validation";

/** The newest progress photo with a viewable URL, if the member has one. */
export function useProfilePhotoUrl(memberId: string | undefined): string | null {
  const documents = useMemberDocuments(memberId);
  const photos = (documents.data ?? [])
    .filter((d) => d.category === "PROGRESS_PHOTO" && d.url)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return photos[0]?.url ?? null;
}

/**
 * Change-profile-photo card for the member edit page. Uploads through the
 * existing member-documents endpoint (members.update, same as every other
 * edit on this page), shows a preview before anything leaves the browser,
 * and surfaces the saved photo once the server answers.
 */
export function ProfilePhotoSection({
  memberId,
  initials,
}: {
  memberId: string;
  initials: string;
}) {
  const currentUrl = useProfilePhotoUrl(memberId);
  const upload = useUploadMemberDocument(memberId);
  const [selected, setSelected] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const preview = React.useMemo(
    () => (selected ? URL.createObjectURL(selected) : null),
    [selected],
  );
  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function clear() {
    setSelected(null);
    setError(null);
  }

  async function pick(file: File) {
    setError(null);
    const problem = await validateProfilePhoto(file);
    if (problem) {
      setSelected(null);
      setError(problem);
      return;
    }
    setSelected(file);
  }

  async function save() {
    if (!selected) return;
    setError(null);
    try {
      await upload.mutateAsync({
        file: selected,
        category: "PROGRESS_PHOTO",
        description: "Profile photo",
      });
      toast.success("Profile photo updated");
      clear();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload that photo — try again.");
    }
  }

  const shown = preview ?? currentUrl;

  return (
    <section
      aria-labelledby="profile-photo-title"
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <h2 id="profile-photo-title" className="text-base font-bold tracking-tight">
        Profile photo
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        JPEG, PNG or WebP, up to 10 MB. The newest photo shows on the profile.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed-URL and blob previews
            <img
              src={shown}
              alt="Member photo"
              className="size-20 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-border"
            >
              {initials || <Camera className="size-7" />}
            </span>
          )}
          {selected ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Remove selected photo"
              className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus aria-hidden="true" />
            {currentUrl || selected ? "Change photo" : "Add photo"}
          </Button>
          {selected ? (
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              onClick={() => void save()}
              disabled={upload.isPending}
            >
              {upload.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Uploading…
                </>
              ) : (
                "Upload photo"
              )}
            </Button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Choose a profile photo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void pick(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
