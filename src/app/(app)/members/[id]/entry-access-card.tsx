"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useCreateDeviceEnrolment,
  useDeleteDeviceEnrolment,
  useDeviceEnrolments,
  useEntryQrToken,
  type DeviceEnrolment,
} from "@/lib/hooks/use-attendance";
import { ApiError } from "@/lib/api/client";

/**
 * Every way this member can get through the door, in one place.
 *
 * Two credentials, not two cards: a rotating QR token they show at the
 * desk, and a turnstile enrolment mapping the scanner's own id for them
 * to their record. They answer the same question — can this person get in
 * — so splitting them across the page made the reader assemble the answer
 * themselves.
 *
 * The enrolment half is new (B-P1-8): `DeviceMap` had no write path, so
 * every biometric check-in returned "unenrolled device user" and there
 * was nothing for a UI to show.
 */
export function EntryAccessCard({
  memberId,
  branchId,
}: {
  memberId: string;
  branchId: string | null | undefined;
}) {
  const { hasPermission } = useAuth();
  const canRead = hasPermission(["attendance.read", "attendance.read_assigned"]);
  const canIssue = hasPermission(["attendance.create", "attendance.create_assigned"]);

  const qr = useEntryQrToken(memberId);
  const enrolments = useDeviceEnrolments({ memberId });
  const createEnrolment = useCreateDeviceEnrolment();
  const deleteEnrolment = useDeleteDeviceEnrolment();

  const [externalUserId, setExternalUserId] = React.useState("");

  if (!canRead && !canIssue) return null;

  async function handleCopy() {
    if (!qr.data) return;
    try {
      await navigator.clipboard.writeText(qr.data.token);
      toast.success("Entry token copied");
    } catch {
      toast.error("Could not copy token");
    }
  }

  async function handleRotate() {
    try {
      await qr.refetch();
      toast.success("Entry QR rotated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not rotate QR");
    }
  }

  async function handleEnrol() {
    if (!branchId || !externalUserId.trim()) return;
    try {
      await createEnrolment.mutateAsync({
        branchId,
        memberId,
        externalUserId: externalUserId.trim(),
      });
      setExternalUserId("");
      toast.success("Enrolled on this branch’s turnstiles");
    } catch (error) {
      // 409 is the deliberate one: that scanner id already belongs to
      // someone else at this branch, and transferring door access is not
      // something an enrolment should do silently.
      toast.error(
        error instanceof ApiError ? error.message : "Could not enrol on the turnstile",
      );
    }
  }

  async function handleRemove(enrolment: DeviceEnrolment) {
    try {
      await deleteEnrolment.mutateAsync(enrolment.id);
      toast.success("Enrolment removed");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not remove enrolment");
    }
  }

  const rows = enrolments.data ?? [];

  return (
    <section
      aria-labelledby="member-entry-access"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-3">
        <h2
          id="member-entry-access"
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
        >
          Entry access
        </h2>
      </div>

      <div className="divide-y divide-border">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">Front-desk QR</p>
          {qr.isLoading ? (
            <Skeleton className="mt-2 h-10 w-full rounded-lg" aria-label="Loading entry token" />
          ) : qr.isError || !qr.data ? (
            <p className="mt-2 text-sm text-muted-foreground">Entry QR unavailable right now.</p>
          ) : (
            <>
              <p className="mt-2 break-all rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
                {qr.data.token}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="min-h-11 rounded-lg">
                  <Copy className="size-4" aria-hidden="true" />
                  Copy
                </Button>
                {canIssue && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                    disabled={qr.isFetching}
                    className="min-h-11 rounded-lg"
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {qr.isFetching ? "Rotating…" : "Rotate"}
                  </Button>
                )}
                {qr.data.rotatesAt && (
                  <span className="text-xs text-muted-foreground">
                    Rotates {new Date(qr.data.rotatesAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">Turnstile</p>
          {enrolments.isPending ? (
            <Skeleton className="mt-2 h-10 w-full rounded-lg" aria-label="Loading turnstile enrolments" />
          ) : rows.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Not enrolled on any scanner.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {rows.map((enrolment) => (
                <li key={enrolment.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate font-mono text-sm">{enrolment.externalUserId}</span>
                  {canIssue && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteEnrolment.isPending}
                      onClick={() => void handleRemove(enrolment)}
                      className="min-h-11 shrink-0 rounded-lg text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canIssue && branchId && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={externalUserId}
                onChange={(event) => setExternalUserId(event.target.value)}
                placeholder="Scanner user id"
                maxLength={190}
                className="sm:flex-1"
              />
              <Button
                onClick={() => void handleEnrol()}
                disabled={createEnrolment.isPending || !externalUserId.trim()}
                className="min-h-11 rounded-lg"
              >
                {createEnrolment.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                Enrol
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
