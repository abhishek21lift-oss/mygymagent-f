"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Fingerprint, Loader2, MonitorSmartphone, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { useDevices, useRegisterDevice, useRevokeDevice, type Device } from "@/lib/hooks/use-devices";
import { ApiError } from "@/lib/api/client";

/**
 * The branch's registered check-in devices.
 *
 * This replaces a "device key" row that rotated a single per-branch
 * secret. That secret was shared by every scanner on the branch, and the
 * endpoint the button called (`POST /branches/:id/rotate-device-key`) had
 * never existed server-side — so the row always read "No key issued yet"
 * and the button always failed. B-P0-13 moved check-in onto a per-device
 * registry; this is that registry, one device at a time.
 */
const KIND_LABEL: Record<Device["kind"], string> = {
  KIOSK: "Kiosk",
  BIOMETRIC: "Turnstile",
};

export function BranchDevicesRow({ branchId }: { branchId: string }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("kiosk.manage");
  const devices = useDevices(branchId);
  const register = useRegisterDevice();
  const revoke = useRevokeDevice();

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<Device["kind"]>("KIOSK");
  const [issuedKey, setIssuedKey] = React.useState<string | null>(null);

  const items = devices.data?.items ?? [];
  const active = items.filter((device) => device.active);

  async function handleRegister() {
    if (!name.trim()) return;
    try {
      const created = await register.mutateAsync({ branchId, name: name.trim(), kind });
      // Plaintext is shown once — never persisted.
      setIssuedKey(created.key);
      setName("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not register device");
    }
  }

  async function handleRevoke(device: Device) {
    try {
      await revoke.mutateAsync(device.id);
      toast.success(`${device.name} revoked`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not revoke device");
    }
  }

  async function handleCopy() {
    if (!issuedKey) return;
    try {
      await navigator.clipboard.writeText(issuedKey);
      toast.success("Device key copied");
    } catch {
      toast.error("Could not copy device key");
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Copy-once: discard the plaintext as soon as the dialog closes.
    if (!next) setIssuedKey(null);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-t border-stone-100/80 px-5 py-4 sm:px-6 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2.5">
          <MonitorSmartphone className="size-4 shrink-0 text-cyan-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[.14em] text-stone-500 dark:text-stone-400">
              Check-in devices
            </p>
            <p className="truncate text-sm font-bold text-stone-700 dark:text-stone-300">
              {devices.isPending
                ? "Loading…"
                : active.length === 0
                  ? "None registered"
                  : `${active.length} active`}
            </p>
          </div>
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="min-h-11 shrink-0 rounded-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            Manage
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in devices</DialogTitle>
          </DialogHeader>

          {issuedKey ? (
            <>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                This key is shown once and won&apos;t be displayed again. Configure the device with
                it now.
              </p>
              <p className="break-all rounded-lg border border-stone-200/70 bg-stone-50/70 px-4 py-3 font-mono text-sm font-bold text-stone-900 dark:border-white/10 dark:bg-card dark:text-stone-100">
                {issuedKey}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={handleCopy} className="min-h-11 rounded-lg font-bold">
                  <Copy className="size-4" aria-hidden="true" />
                  Copy key
                </Button>
                <Button onClick={() => setIssuedKey(null)} className="min-h-11 rounded-lg font-bold">
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <ul className="divide-y divide-stone-100 dark:divide-white/10">
                {items.length === 0 ? (
                  <li className="py-3 text-sm text-muted-foreground">
                    No devices registered for this branch yet.
                  </li>
                ) : (
                  items.map((device) => (
                    <li key={device.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {device.kind === "BIOMETRIC" ? (
                          <Fingerprint className="size-4 shrink-0 text-cyan-600" aria-hidden="true" />
                        ) : (
                          <MonitorSmartphone className="size-4 shrink-0 text-cyan-600" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{device.name}</p>
                          <p className="text-xs text-muted-foreground">{KIND_LABEL[device.kind]}</p>
                        </div>
                      </div>
                      {device.active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={revoke.isPending}
                          onClick={() => void handleRevoke(device)}
                          className="min-h-11 shrink-0 rounded-lg font-bold text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Revoke
                        </Button>
                      ) : (
                        // Revoked devices stay listed: the check-ins they
                        // recorded are still attributed to them.
                        <Badge variant="secondary" className="shrink-0 rounded-full">
                          Revoked
                        </Badge>
                      )}
                    </li>
                  ))
                )}
              </ul>

              <div className="flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row dark:border-white/10">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Device name"
                  maxLength={120}
                  className="sm:flex-1"
                />
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as Device["kind"])}
                  aria-label="Device type"
                  className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm font-medium"
                >
                  <option value="KIOSK">Kiosk</option>
                  <option value="BIOMETRIC">Turnstile</option>
                </select>
                <Button
                  onClick={() => void handleRegister()}
                  disabled={register.isPending || !name.trim()}
                  className="min-h-11 rounded-lg font-bold"
                >
                  {register.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Add
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
