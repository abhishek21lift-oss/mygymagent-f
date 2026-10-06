"use client";

import * as React from "react";
import QRCode from "qrcode";
import { QrCode, RefreshCw, ShieldCheck } from "lucide-react";

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
      width: 220,
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
      <p className="flex size-56 items-center justify-center rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        The code could not be rendered on this screen. Ask the front desk to check you in by name.
      </p>
    );
  }
  if (svg?.token !== token) return <Skeleton className="size-56 rounded-2xl" />;
  return (
    <div
      role="img"
      aria-label="Your check-in QR code"
      className="size-56 rounded-2xl bg-white p-3 shadow-md ring-1 ring-black/5 [&>svg]:size-full"
      dangerouslySetInnerHTML={{ __html: svg.markup }}
    />
  );
}

/**
 * The member's digital gym pass and check-in QR code.
 */
export function CheckInCode() {
  const mint = useMintPortalCheckInCode();
  const code = mint.data;

  return (
    <Panel
      title="Digital Pass & Check-In"
      titleId="portal-check-in-code"
      description="Scan at turnstile or front desk scanner for entry"
    >
      {code ? (
        <div className="flex flex-col items-center gap-4 py-2">
          {/* Apple Wallet Style Pass Card */}
          <div className="relative flex flex-col items-center rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-muted/30 p-6 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-4" />
              <span>Verified Membership Access</span>
            </div>

            <CodeImage token={code.token} />

            <div className="mt-4 text-center">
              <p className="font-mono text-xs font-semibold text-foreground">
                Expires: {new Date(code.rotatesAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (24h)
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Rotating dynamic token for contactless verification
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="min-h-10 rounded-xl px-4 text-xs font-semibold shadow-2xs"
            disabled={mint.isPending}
            onClick={() => mint.mutate()}
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${mint.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh Pass Token
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-2">
          {mint.isError && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertDescription>
                Your pass could not be created right now. Check connection and retry.
              </AlertDescription>
            </Alert>
          )}
          <Button
            className="min-h-12 rounded-2xl bg-primary text-sm font-bold shadow-md transition duration-300 hover:-translate-y-0.5"
            disabled={mint.isPending}
            onClick={() => mint.mutate()}
          >
            <QrCode className="mr-2 size-5" aria-hidden="true" />
            {mint.isPending ? "Generating Digital Pass…" : "Show Digital Gym Pass"}
          </Button>
        </div>
      )}
    </Panel>
  );
}
