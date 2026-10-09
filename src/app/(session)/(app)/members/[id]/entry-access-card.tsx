"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Download, Loader2, Plus, Trash2 } from "lucide-react";

import { ConfirmAction } from "@/components/shared/confirm-action";
import { downloadQrPng, QrCodeImage, qrValidUntil } from "@/components/shared/qr-code-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useCreateDeviceEnrolment,
  useDeleteDeviceEnrolment,
  useDeviceEnrolments,
  useEntryQrToken,
  useRotateEntryQrToken,
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
  memberName,
  branchId,
}: {
  memberId: string;
  memberName: string;
  branchId: string | null | undefined;
}) {
  const { hasPermission } = useAuth();
  const canRead = hasPermission(["attendance.read", "attendance.read_assigned"]);
  const canIssue = hasPermission(["attendance.create", "attendance.create_assigned"]);

  // The server hands the code only to roles that can check people in;
  // anyone else would just get a 403 for asking.
  const qr = useEntryQrToken(canIssue ? memberId : undefined);
  const rotate = useRotateEntryQrToken(memberId);
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

  async function handleDownload() {
    if (!qr.data) return;
    try {
      const slug = memberName.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
      await downloadQrPng(qr.data.token, `entry-qr-${slug || memberId}.png`);
    } catch {
      toast.error("Could not save the QR code");
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
      className="panel-premium overflow-hidden rounded-3xl border border-border/60 bg-card"
    >
      <div data-slot="panel-header" className="border-b border-border/60 px-5 py-3.5">
        <h2
          id="member-entry-access"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground"
        >
          <span aria-hidden="true" data-slot="panel-dot" className="size-2 shrink-0 rounded-full" />
          Entry access
        </h2>
      </div>

      <div className="divide-y divide-border">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">QR code</p>
          {!canIssue ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Only roles that check members in can see this code.
            </p>
          ) : qr.isLoading ? (
            <Skeleton className="mt-3 size-40 rounded-2xl" aria-label="Loading entry token" />
          ) : qr.isError || !qr.data ? (
            <p className="mt-2 text-sm text-muted-foreground">Entry QR unavailable right now.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                <QrCodeImage
                  token={qr.data.token}
                  label={`Entry QR code for ${memberName}`}
                  failedText="The QR code could not be drawn here. Copy the code instead."
                  className="size-40 shrink-0 p-2 shadow-sm"
                />
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    The same code {memberName} sees in their app. Scan it at the kiosk, or download it
                    to print or send on WhatsApp.
                  </p>
                  {qrValidUntil(qr.data.rotatesAt) && (
                    <p className="text-xs text-muted-foreground">
                      Valid till {qrValidUntil(qr.data.rotatesAt)}, then renews by itself.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void handleDownload()} className="min-h-11 rounded-lg">
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => void handleCopy()} className="min-h-11 rounded-lg">
                  <Copy className="size-4" aria-hidden="true" />
                  Copy code
                </Button>
                <ConfirmAction
                  label="Rotate"
                  title={`Give ${memberName} a new entry code?`}
                  description="The current code stops working straight away: on their phone, in screenshots and on any printed card. Do this if the code has been lost or shared."
                  confirmLabel="Rotate code"
                  pendingLabel="Rotating..."
                  successMessage="New entry code issued"
                  errorMessage="Could not rotate the entry code."
                  onConfirm={() => rotate.mutateAsync()}
                  className="min-h-11 rounded-lg"
                />
              </div>
            </div>
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
                  <span className="min-w-0 [overflow-wrap:anywhere] font-mono text-sm">{enrolment.externalUserId}</span>
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
