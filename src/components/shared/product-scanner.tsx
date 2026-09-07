"use client";

import * as React from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { ScanLine, Camera, CameraOff, RefreshCw, PackageSearch, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/lib/types/gym";
import { lookupProductByScanCode } from "@/lib/hooks/use-inventory";
import { ScanDeduper } from "@/lib/scan-dedupe";
import { ApiError } from "@/lib/api/client";

export type ScannerCameraState =
  | "idle"
  | "requesting"
  | "scanning"
  | "denied"
  | "unavailable";

interface ProductScannerProps {
  /** Called when a scan resolves to a product (backend is the source of truth for the match). */
  onProductDetected: (product: Product, scanCode: string) => void;
  /** Called when a scan did NOT match any product. Never auto-creates anything. */
  onUnknownCode?: (code: string) => void;
  /** Cooldown ms before the same code can be detected again (anti frame-duplicate). */
  duplicateCooldownMs?: number;
}

/**
 * Camera-based QR/barcode scanner for inventory.
 *
 * - Uses @zxing/browser (thin wrapper over the zxing engine, actively
 *   maintained, no heavyweight dependency).
 * - Stops scanning after a successful detection so camera frames can't
 *   double-trigger; caller decides when to resume.
 * - Gracefully surfaces camera-denied / no-camera / unsupported-browser
 *   states, and lets the user type a code manually when the camera
 *   can't be used.
 */
export function ProductScanner({
  onProductDetected,
  onUnknownCode,
  duplicateCooldownMs = 2_000,
}: ProductScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const controlsRef = React.useRef<IScannerControls | null>(null);
  const readerRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const deduperRef = React.useRef<ScanDeduper | null>(null);
  const resolvingRef = React.useRef(false);
  const [cameraState, setCameraState] = React.useState<ScannerCameraState>("idle");
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [manualCode, setManualCode] = React.useState("");
  const [resolving, setResolving] = React.useState(false);

  const stopScanning = React.useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraState("idle");
  }, []);

  React.useEffect(() => {
    return () => {
      // Release the camera when the scanner unmounts (dialog closed etc).
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  const resolveCode = React.useCallback(
    async (code: string) => {
      if (resolvingRef.current) return;
      resolvingRef.current = true;
      setResolving(true);
      try {
        const product = await lookupProductByScanCode(code);
        onProductDetected(product, code);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          onUnknownCode?.(code);
          toast.error(`No product found for code "${code}"`);
        } else {
          toast.error(error instanceof ApiError ? error.message : "Lookup failed");
        }
      } finally {
        resolvingRef.current = false;
        setResolving(false);
      }
    },
    [onProductDetected, onUnknownCode],
  );

  const handleDetection = React.useCallback(
    (code: string | null) => {
      if (!code) return;
      deduperRef.current ??= new ScanDeduper(duplicateCooldownMs);
      if (!deduperRef.current.accept(code, Date.now())) {
        // Same code inside the cooldown window: a duplicate camera frame.
        return;
      }
      // Pause the scan loop while resolving so frames can't double-fire.
      controlsRef.current?.stop();
      controlsRef.current = null;
      setCameraState("idle");
      void resolveCode(code);
    },
    [duplicateCooldownMs, resolveCode],
  );

  const startScanning = React.useCallback(async () => {
    if (!videoRef.current) return;
    setCameraError(null);
    setCameraState("requesting");
    try {
      readerRef.current ??= new BrowserMultiFormatReader();
      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          // zxing invokes the callback with (result, error); a null result
          // with a NotFoundException error is the normal "nothing in this
          // frame" signal and must be ignored.
          handleDetection(result?.getText() ?? null);
        },
      );
      controlsRef.current = controls;
      setCameraState("scanning");
    } catch (error) {
      setCameraState("idle");
      const name = error instanceof Error ? error.name : "";
      if (name === "NotAllowedError") {
        setCameraState("denied");
        setCameraError(
          "Camera permission was denied. Allow camera access in your browser settings, or type the code manually below.",
        );
      } else if (
        name === "NotFoundError" ||
        name === "OverconstrainedError" ||
        name === "NotReadableError"
      ) {
        setCameraState("unavailable");
        setCameraError("No usable camera was found on this device.");
      } else {
        setCameraError(
          error instanceof Error ? error.message : "Could not start the camera.",
        );
      }
    }
  }, [handleDetection]);

  const supportsCamera =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg border bg-black">
        {/* The video element must stay mounted (zxing attaches the stream
            to it); opacity keeps the placeholder visible while idle. */}
        <video
          ref={videoRef}
          className="aspect-[4/3] w-full object-cover"
          muted
          playsInline
          style={{ opacity: cameraState === "scanning" ? 1 : 0 }}
        />
        {cameraState !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {cameraState === "denied" ? (
              <CameraOff className="size-10 text-muted-foreground" aria-hidden />
            ) : cameraState === "unavailable" ? (
              <Camera className="size-10 text-muted-foreground" aria-hidden />
            ) : (
              <ScanLine className="size-10 text-muted-foreground" aria-hidden />
            )}
            <p className="text-sm text-muted-foreground">
              {cameraError ??
                (cameraState === "requesting"
                  ? "Starting camera…"
                  : "Point the camera at a product's QR code or barcode.")}
            </p>
          </div>
        )}
        {cameraState === "scanning" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded bg-primary/80"
          />
        )}
      </div>

      {!supportsCamera && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>This browser does not support camera scanning. Type the code manually instead.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {cameraState === "scanning" ? (
          <Button type="button" variant="outline" onClick={stopScanning}>
            <CameraOff className="size-4" aria-hidden />
            Stop camera
          </Button>
        ) : (
          <Button
            type="button"
            onClick={startScanning}
            disabled={!supportsCamera || cameraState === "requesting" || resolving}
          >
            {cameraState === "requesting" ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="size-4" aria-hidden />
            )}
            {cameraState === "denied" ? "Retry camera" : "Start scanning"}
          </Button>
        )}
        {resolving && (
          <Badge variant="outline" className="gap-1">
            <PackageSearch className="size-3" aria-hidden />
            Looking up product…
          </Badge>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const code = manualCode.trim();
          if (!code) return;
          setManualCode("");
          void resolveCode(code);
        }}
      >
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="…or type a code and press Enter"
          aria-label="Product code"
          disabled={resolving}
        />
        <Button type="submit" variant="secondary" disabled={resolving || !manualCode.trim()}>
          Look up
        </Button>
      </form>
    </div>
  );
}
