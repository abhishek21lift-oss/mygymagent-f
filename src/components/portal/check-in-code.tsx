"use client";

import * as React from "react";
import QRCode from "qrcode";
import { QrCode, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/shared/panel";
import { useMintPortalCheckInCode } from "@/lib/hooks/use-portal";

function CodeImage({ token }: { token: string }) {
  const [svg, setSvg] = React.useState<{ token: string; markup: string } | null>(
    null,
  );
  const [failedFor, setFailedFor] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    QRCode.toString(token, {
      type: "svg",
      margin: 1,
      width: 240,
      // Scanned off a phone held up to a desk camera, often through a
      // cracked screen at full brightness: the extra redundancy is worth
      // the denser pattern.
      errorCorrectionLevel: "M",
    })
      .then((markup) => {
        if (!cancelled) setSvg({ token, markup });
      })
      .catch(() => {
        if (!cancelled) setFailedFor(token);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (failedFor === token) {
    return (
      <p className="flex size-60 items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        The code could not be drawn on this device. Ask the front desk to
        check you in by name.
      </p>
    );
  }
  if (svg?.token !== token) return <Skeleton className="size-60 rounded-xl" />;
  return (
    <div
      role="img"
      aria-label="Your check-in QR code"
      // Always black on white, whatever the theme: a scanner reads
      // contrast, and an inverted code fails on many of them.
      className="size-60 rounded-xl bg-white p-2 [&>svg]:size-full"
      dangerouslySetInnerHTML={{ __html: svg.markup }}
    />
  );
}

/**
 * The member's check-in code, shown on request.
 *
 * Minted when the member taps, not when the page loads: the server
 * keeps only a hash, so producing a code always retires the previous
 * one. Minting on every visit to Home would silently kill a code the
 * member had open on another device -- so it happens once, on purpose,
 * and the copy says what a second tap does.
 */
export function CheckInCode() {
  const mint = useMintPortalCheckInCode();
  const code = mint.data;

  return (
    <Panel
      title="Check-in code"
      titleId="portal-check-in-code"
      description="Show this at the front desk to check in."
    >
      {code ? (
        <div className="flex flex-col items-center gap-3">
          <CodeImage token={code.token} />
          <p className="text-center text-xs text-muted-foreground">
            Valid until {new Date(code.rotatesAt).toLocaleDateString()}.
            Getting a new code retires this one.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 rounded-lg"
            disabled={mint.isPending}
            onClick={() => mint.mutate()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            New code
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {mint.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Your code could not be created. Check your connection and try
                again.
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="min-h-11 rounded-lg"
            disabled={mint.isPending}
            onClick={() => mint.mutate()}
          >
            <QrCode className="size-4" aria-hidden="true" />
            {mint.isPending ? "Creating your code…" : "Show my check-in code"}
          </Button>
        </div>
      )}
    </Panel>
  );
}
