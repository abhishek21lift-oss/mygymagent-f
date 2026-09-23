import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

const KEY = "devices";

/** A kiosk or biometric turnstile registered against a branch. The key
 * itself is never part of this shape: the API returns it once, at
 * registration, and stores only its digest. */
export interface Device {
  id: string;
  name: string;
  kind: "KIOSK" | "BIOMETRIC";
  branchId: string;
  active: boolean;
  revokedAt?: string | null;
  createdAt: string;
}

export interface RegisteredDevice extends Device {
  /** Shown once and never again — copy-once UI, never persisted. */
  key: string;
  warning: string;
}

export function useDevices(branchId?: string) {
  return useQuery({
    queryKey: [KEY, branchId ?? "all"],
    queryFn: () =>
      api.get<{ items: Device[] }>("/devices", {
        query: branchId ? { branchId } : {},
      }),
  });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { branchId: string; name: string; kind: Device["kind"] }) =>
      api.post<RegisteredDevice>("/devices", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** Revokes one device's key. Deactivation, not deletion: the check-ins it
 * recorded stay attributable to it. */
export function useRevokeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Device>(`/devices/${id}/revoke`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
