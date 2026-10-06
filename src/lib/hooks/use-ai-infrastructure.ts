"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api/client";

const BASE = "/admin/ai";
const K = (s: string, extra?: unknown) => ["ai-infra", s, extra ?? null];

export function useAiGateway(enabled = true) {
  return useQuery({ queryKey: K("gateway"), queryFn: () => api.get<Record<string, unknown>>(`${BASE}/gateway`), enabled, refetchInterval: 30_000, retry: 2 });
}
export function useAiProviders(enabled = true) {
  return useQuery({ queryKey: K("providers"), queryFn: () => api.get<unknown>(`${BASE}/providers`), enabled, retry: 2 });
}
export function useAiKeys(enabled = true) {
  return useQuery({ queryKey: K("keys"), queryFn: () => api.get<unknown[]>(`${BASE}/keys`), enabled, retry: 2 });
}
export function useAiModels(enabled = true) {
  return useQuery({ queryKey: K("models"), queryFn: () => api.get<unknown[]>(`${BASE}/models`), enabled, retry: 2 });
}
export function useAiFallback(enabled = true) {
  return useQuery({ queryKey: K("fallback"), queryFn: () => api.get<unknown[]>(`${BASE}/fallback`), enabled, retry: 2 });
}
export function useAiRouting(enabled = true) {
  return useQuery({ queryKey: K("routing"), queryFn: () => api.get<unknown>(`${BASE}/routing`), enabled, retry: 2 });
}
export function useAiQuota(enabled = true) {
  return useQuery({ queryKey: K("quota"), queryFn: () => api.get<unknown>(`${BASE}/quota`), enabled, refetchInterval: 60_000, retry: 2 });
}
export function useAiHealth(enabled = true) {
  return useQuery({ queryKey: K("health"), queryFn: () => api.get<unknown>(`${BASE}/health`), enabled, refetchInterval: 30_000, retry: 2 });
}
export function useAiAnalyticsSummary(range = "7d", enabled = true) {
  return useQuery({ queryKey: K("analytics-summary", range), queryFn: () => api.get<Record<string, unknown>>(`${BASE}/analytics/summary`, { query: { range } }), enabled, retry: 2 });
}
export function useAiAnalyticsByModel(range = "7d", enabled = true) {
  return useQuery({ queryKey: K("analytics-by-model", range), queryFn: () => api.get<unknown[]>(`${BASE}/analytics/by-model`, { query: { range } }), enabled, retry: 1 });
}
export function useAiAnalyticsByPlatform(range = "7d", enabled = true) {
  return useQuery({ queryKey: K("analytics-by-platform", range), queryFn: () => api.get<unknown[]>(`${BASE}/analytics/by-platform`, { query: { range } }), enabled, retry: 1 });
}
export function useAiAnalyticsTimeline(range = "7d", enabled = true) {
  return useQuery({ queryKey: K("analytics-timeline", range), queryFn: () => api.get<unknown[]>(`${BASE}/analytics/timeline`, { query: { range } }), enabled, retry: 1 });
}
export function useAiAnalyticsRequests(params: { range?: string; limit?: number; status?: string } = {}, enabled = true) {
  return useQuery({
    queryKey: K("analytics-requests", params),
    queryFn: () => api.get<{ total: number; rows: Record<string, unknown>[] }>(`${BASE}/analytics/requests`, { query: { range: params.range ?? "24h", limit: params.limit ?? 50, status: params.status } }),
    enabled, retry: 1,
  });
}
export function useAiLogs(enabled = true) {
  return useQuery({ queryKey: K("logs"), queryFn: () => api.get<unknown>(`${BASE}/logs`, { query: { limit: 100 } }), enabled, retry: 1 });
}
export function useAiSettings(enabled = true) {
  return useQuery({ queryKey: K("settings"), queryFn: () => api.get<Record<string, unknown>>(`${BASE}/settings`), enabled, retry: 2 });
}
export function useAiBackups(enabled = true) {
  return useQuery({ queryKey: K("backups"), queryFn: () => api.get<unknown>(`${BASE}/backups`), enabled, retry: 2 });
}
export function useAiClientProfiles(enabled = true) {
  return useQuery({ queryKey: K("client-profiles"), queryFn: () => api.get<unknown[]>(`${BASE}/client-profiles`), enabled, retry: 2 });
}
export function useAiEmbeddings(enabled = true) {
  return useQuery({ queryKey: K("embeddings"), queryFn: () => api.get<unknown>(`${BASE}/embeddings`), enabled, retry: 1 });
}
export function useAiMedia(modality?: string, enabled = true) {
  return useQuery({ queryKey: K("media", modality ?? "all"), queryFn: () => api.get<unknown>(`${BASE}/media`, { query: modality ? { modality } : {} }), enabled, retry: 1 });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["ai-infra"] });
}

export function useCreateKey() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (body: { platform: string; key?: string; label?: string }) => api.post(`${BASE}/keys`, body), onSuccess: inv });
}
export function usePatchKey() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`${BASE}/keys/${id}`, body), onSuccess: inv });
}
export function useDeleteKey() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => api.delete(`${BASE}/keys/${id}`, { query: { confirm: "true" } }), onSuccess: inv });
}
export function useCheckKey() {
  return useMutation({ mutationFn: (id: string) => api.post(`${BASE}/keys/${id}/check`, {}) });
}
export function useCheckAllKeys() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: () => api.post(`${BASE}/keys/check-all`, {}), onSuccess: inv });
}
export function useClearCooldowns() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => api.delete(`${BASE}/keys/${id}/cooldowns`), onSuccess: inv });
}
export function usePatchModel() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`${BASE}/models/${id}`, body), onSuccess: inv });
}
export function useUpdateFallback() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (rows: unknown[]) => apiFetch(`${BASE}/fallback`, { method: "PUT", body: { rows } }), onSuccess: inv });
}
export function useUpdateRouting() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => apiFetch(`${BASE}/routing`, { method: "PUT", body }), onSuccess: inv });
}
export function useUpdateSettings() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ section, value }: { section: string; value: Record<string, unknown> }) => apiFetch(`${BASE}/settings/${section}`, { method: "PUT", body: { value } }), onSuccess: inv });
}
export function useCreateBackup() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => api.post(`${BASE}/backups`, body), onSuccess: inv });
}
export function useCreateClientProfile() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (body: { name: string; systemPrompt?: string | null }) => api.post<Record<string, unknown>>(`${BASE}/client-profiles`, body), onSuccess: inv });
}
export function useRotateClientProfile() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => api.post<Record<string, unknown>>(`${BASE}/client-profiles/${id}/rotate`, {}, { query: { confirm: "true" } }), onSuccess: inv });
}
export function useDeleteClientProfile() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => api.delete(`${BASE}/client-profiles/${id}`, { query: { confirm: "true" } }), onSuccess: inv });
}
