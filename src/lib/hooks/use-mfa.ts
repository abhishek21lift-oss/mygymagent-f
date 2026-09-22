import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MfaEnableResponse, MfaSetupResponse, MfaStatus } from "@/lib/types/auth";

const KEY = "mfa-status";

export function useMfaStatus() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get<MfaStatus>("/auth/mfa"),
  });
}

/**
 * Starts (or restarts) enrolment. The response carries the secret and the
 * `otpauth://` URI exactly once -- it is stored only encrypted server-side,
 * so it is never retrievable again. Calling this a second time replaces any
 * unconfirmed secret from an abandoned attempt.
 */
export function useStartMfaEnrolment() {
  return useMutation({
    mutationFn: () => api.post<MfaSetupResponse>("/auth/mfa/setup", {}),
  });
}

/** Confirms a code from the new secret and switches MFA on, returning the
 * recovery codes once. */
export function useEnableMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<MfaEnableResponse>("/auth/mfa/enable", { code }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** Needs the password *and* a current code (or a recovery code): neither a
 * stolen token nor a stolen password alone can turn the factor off. */
export function useDisableMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { password: string; code: string }) =>
      api.post<{ enabled: false }>("/auth/mfa/disable", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
