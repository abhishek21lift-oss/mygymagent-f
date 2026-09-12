import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Attendance } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CheckInInput } from "@/lib/validation/gym";

const KEY = "attendance";
const LIVE_KEY = "attendance-live";
const ENTRY_QR_KEY = "entry-qr";

export function useAttendance(params: PaginationParams & { branchId?: string; memberId?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Attendance>>("/attendance", { query: params }),
  });
}

/** Gate result for POST /attendance/check-in.
 * Backend returns `{ allowed, reason?, attendance? }` (WS-3); older
 * responses return the created `Attendance` row directly. */
export interface GateCheckInResult {
  allowed: boolean;
  reason?: string | null;
  attendance?: Attendance | null;
}

export type GateCheckInResponse = GateCheckInResult | Attendance;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Normalizes either the WS-3 gate envelope or a legacy Attendance row. */
export function normalizeGateResult(raw: unknown): GateCheckInResult {
  if (isRecord(raw) && typeof raw.allowed === "boolean") {
    const attendance = isRecord(raw.attendance) ? (raw.attendance as unknown as Attendance) : null;
    return {
      allowed: raw.allowed,
      reason: typeof raw.reason === "string" ? raw.reason : null,
      attendance,
    };
  }
  if (isRecord(raw) && typeof raw.id === "string") {
    return { allowed: true, attendance: raw as unknown as Attendance };
  }
  return { allowed: false, reason: "Unexpected response from gate" };
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckInInput) => api.post<GateCheckInResponse>("/attendance/check-in", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [LIVE_KEY] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Attendance>(`/attendance/${id}/check-out`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [LIVE_KEY] });
    },
  });
}

export interface LiveInsideEntry {
  id: string;
  member?: { firstName: string; lastName: string } | null;
  checkInAt: string;
}

export interface LiveDeniedEntry {
  id: string;
  member?: { firstName: string; lastName: string } | null;
  deniedReason?: string | null;
  reason?: string | null;
  checkInAt: string;
}

export interface AttendanceLive {
  inside: LiveInsideEntry[];
  deniedToday: LiveDeniedEntry[];
}

function asLiveList(value: unknown): LiveInsideEntry[] {
  return Array.isArray(value) ? (value as LiveInsideEntry[]) : [];
}

/** Defensive parser: accepts `{ inside, deniedToday }`, `{ inside, denied }`,
 * or a `{ data: ... }` envelope (client already unwraps `data`, but be safe). */
export function normalizeLivePayload(raw: unknown): AttendanceLive {
  const envelope = isRecord(raw) && "data" in raw ? (raw as { data: unknown }).data : raw;
  if (!isRecord(envelope)) return { inside: [], deniedToday: [] };
  const denied = "deniedToday" in envelope ? envelope.deniedToday : envelope.denied;
  return {
    inside: asLiveList(envelope.inside),
    deniedToday: asLiveList(denied),
  };
}

/** Who's inside right now + today's denials. Auto-refetches every 30s. */
export function useAttendanceLive() {
  return useQuery({
    queryKey: [LIVE_KEY],
    queryFn: async () => normalizeLivePayload(await api.get<unknown>("/attendance/live")),
    refetchInterval: 30_000,
    retry: false,
  });
}

export interface EntryQrToken {
  token: string;
  rotatesAt: string;
}

/** Plaintext entry token. Only returned on generation — never persist it. */
export function useEntryQrToken(memberId: string | undefined) {
  return useQuery({
    queryKey: [ENTRY_QR_KEY, memberId],
    queryFn: async () => {
      const raw = await api.get<unknown>(`/attendance/qr-token/${memberId}`);
      const envelope = isRecord(raw) && "data" in raw ? (raw as { data: unknown }).data : raw;
      if (!isRecord(envelope) || typeof envelope.token !== "string") {
        throw new Error("Unexpected QR token response");
      }
      return {
        token: envelope.token,
        rotatesAt: typeof envelope.rotatesAt === "string" ? envelope.rotatesAt : "",
      } satisfies EntryQrToken;
    },
    enabled: !!memberId,
    retry: false,
    staleTime: 0,
  });
}
