"use client";

import { ShieldCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Panel } from "@/components/shared/panel";
import { QrCodeImage, qrValidUntil } from "@/components/shared/qr-code-image";
import { useNewPortalCheckInCode, usePortalCheckInCode } from "@/lib/hooks/use-portal";

/**
 * The member's digital gym pass and check-in QR code. It is the same code
 * the front desk sees on the member's profile, and it stays the same
 * until it reaches its date or the member asks for a new one.
 */
export function CheckInCode() {
  const code = usePortalCheckInCode();
  const replace = useNewPortalCheckInCode();
  const validUntil = code.data ? qrValidUntil(code.data.rotatesAt) : null;

  return (
    <Panel
      title="Digital Pass & Check-In"
      titleId="portal-check-in-code"
      description="Scan at turnstile or front desk scanner for entry"
    >
      {code.data ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative flex flex-col items-center rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-muted/30 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-4" />
              <span>Verified Membership Access</span>
            </div>

            <QrCodeImage
              token={code.data.token}
              label="Your check-in QR code"
              failedText="The code could not be rendered on this screen. Ask the front desk to check you in by name."
            />

            {validUntil && (
              <p className="mt-4 text-center text-xs font-semibold text-foreground">
                Valid till {validUntil}
              </p>
            )}
            <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
              Same code every visit. A screenshot works too.
            </p>
          </div>

          <ConfirmAction
            label="Get a new code"
            title="Replace your check-in code?"
            description="Your current code, including any screenshot or printed card, stops working straight away. Use this if someone else has your code."
            confirmLabel="Replace code"
            pendingLabel="Replacing..."
            successMessage="New check-in code ready"
            errorMessage="Your code could not be replaced. Try again."
            onConfirm={() => replace.mutateAsync()}
          />
        </div>
      ) : code.isError ? (
        <div className="flex flex-col gap-3 py-2">
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>
              Your pass could not be loaded right now. Check connection and retry.
            </AlertDescription>
          </Alert>
          <Button className="min-h-12 rounded-2xl text-sm font-bold" onClick={() => void code.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex justify-center py-2">
          <Skeleton className="size-56 rounded-2xl" aria-label="Loading your pass" />
        </div>
      )}
    </Panel>
  );
}
