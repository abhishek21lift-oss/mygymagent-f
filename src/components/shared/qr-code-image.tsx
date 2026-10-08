"use client";

import * as React from "react";
import QRCode from "qrcode";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A QR code for an entry token, drawn on the device. Used by the member's
 * own pass in the portal and by the desk on the member's profile, so the
 * two always render the same code the same way.
 */
export function QrCodeImage({
  token,
  label,
  failedText,
  className,
}: {
  token: string;
  label: string;
  failedText: string;
  className?: string;
}) {
  const [svg, setSvg] = React.useState<{ token: string; markup: string } | null>(null);
  const [failedFor, setFailedFor] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    QRCode.toString(token, { type: "svg", margin: 1, width: 220, errorCorrectionLevel: "M" })
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
      <p
        className={cn(
          "flex size-56 items-center justify-center rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        {failedText}
      </p>
    );
  }
  if (svg?.token !== token) return <Skeleton className={cn("size-56 rounded-2xl", className)} />;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("size-56 rounded-2xl bg-white p-3 shadow-md ring-1 ring-black/5 [&>svg]:size-full", className)}
      dangerouslySetInnerHTML={{ __html: svg.markup }}
    />
  );
}

/** Saves the code as a PNG, to print or send to the member. */
export async function downloadQrPng(token: string, fileName: string) {
  const url = await QRCode.toDataURL(token, { margin: 2, width: 600, errorCorrectionLevel: "M" });
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** "7 Nov 2026": day-first and unambiguous, unlike 7/11/2026. */
export function qrValidUntil(rotatesAt: string) {
  const date = new Date(rotatesAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
