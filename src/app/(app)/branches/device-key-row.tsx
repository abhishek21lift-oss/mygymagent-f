"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, KeyRound, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useRotateDeviceKey } from "@/lib/hooks/use-branches";
import { ApiError } from "@/lib/api/client";

/** Reads a masked device key from the branch payload when present. */
function maskedKeyOf(branch: unknown): string | null {
  if (typeof branch !== "object" || branch === null) return null;
  const b = branch as Record<string, unknown>;
  if (typeof b.deviceKeyMasked === "string" && b.deviceKeyMasked.length > 0) {
    return b.deviceKeyMasked;
  }
  if (typeof b.deviceKeyLast4 === "string" && b.deviceKeyLast4.length >= 4) {
    return `••••${b.deviceKeyLast4.slice(-4)}`;
  }
  return null;
}

export function DeviceKeyRow({ branchId, branch }: { branchId: string; branch: unknown }) {
  const { hasPermission } = useAuth();
  const rotate = useRotateDeviceKey();
  const [plaintext, setPlaintext] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const masked = maskedKeyOf(branch);
  const canRotate = hasPermission("branches.manage");

  async function handleRotate() {
    try {
      const res = await rotate.mutateAsync(branchId);
      const key = (res as { deviceKey?: unknown }).deviceKey;
      if (typeof key !== "string" || key.length === 0) {
        throw new Error("Unexpected rotate response");
      }
      // Plaintext is shown once — never persisted.
      setPlaintext(key);
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not rotate device key");
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Copy-once: discard the plaintext as soon as the dialog closes.
    if (!next) setPlaintext(null);
  }

  async function handleCopy() {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      toast.success("Device key copied");
    } catch {
      toast.error("Could not copy device key");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-t border-stone-100/80 px-5 py-4 sm:px-6 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2.5">
          <KeyRound className="size-4 shrink-0 text-cyan-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[.14em] text-stone-500 dark:text-stone-400">
              Device key
            </p>
            <p className="truncate font-mono text-sm font-bold tabular-nums text-stone-700 dark:text-stone-300">
              {masked ?? "No key issued yet"}
            </p>
          </div>
        </div>
        {canRotate && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            disabled={rotate.isPending}
            className="min-h-11 shrink-0 rounded-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {rotate.isPending ? "Rotating…" : "Rotate"}
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New device key — copy it now</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
            This key is shown once and won&apos;t be displayed again.
          </p>
          {plaintext && (
            <p className="break-all rounded-2xl border border-stone-200/70 bg-stone-50/70 px-4 py-3 font-mono text-sm font-bold text-stone-900 dark:border-white/10 dark:bg-white/5 dark:text-stone-100">
              {plaintext}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!plaintext}
              className="min-h-11 rounded-2xl font-bold"
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy key
            </Button>
            <Button onClick={() => handleOpenChange(false)} className="min-h-11 rounded-2xl font-bold">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
