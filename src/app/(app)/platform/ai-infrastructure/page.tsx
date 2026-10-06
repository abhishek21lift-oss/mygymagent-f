"use client";

import * as React from "react";
import { Activity, Brain, Database, KeyRound, Network, ShieldAlert, Sparkles, Workflow } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useAiAnalyticsByModel,
  useAiAnalyticsByPlatform,
  useAiAnalyticsRequests,
  useAiAnalyticsSummary,
  useAiAnalyticsTimeline,
  useAiBackups,
  useAiClientProfiles,
  useAiEmbeddings,
  useAiFallback,
  useAiGateway,
  useAiHealth,
  useAiKeys,
  useAiLogs,
  useAiMedia,
  useAiModels,
  useAiProviders,
  useAiQuota,
  useAiRouting,
  useAiSettings,
  useCheckAllKeys,
  useCheckKey,
  useClearCooldowns,
  useCreateBackup,
  useCreateClientProfile,
  useCreateKey,
  useDeleteClientProfile,
  useDeleteKey,
  usePatchKey,
  usePatchModel,
  useRotateClientProfile,
  useUpdateFallback,
  useUpdateRouting,
  useUpdateSettings,
} from "@/lib/hooks/use-ai-infrastructure";
import { DataState } from "@/components/shared/data-state";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Request failed");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="glass rounded-3xl">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Json({ value }: { value: unknown }) {
  return <pre className="max-h-72 overflow-auto rounded-2xl bg-black/5 p-3 text-xs dark:bg-white/5">{JSON.stringify(value, null, 2)}</pre>;
}

export default function AiInfrastructurePage() {
  const { user } = useAuth();
  const isPlatformStaff = Boolean(user?.platformRole);
  const enabled = isPlatformStaff;

  const gateway = useAiGateway(enabled);
  const providers = useAiProviders(enabled);
  const keys = useAiKeys(enabled);
  const models = useAiModels(enabled);
  const fallback = useAiFallback(enabled);
  const routing = useAiRouting(enabled);
  const quota = useAiQuota(enabled);
  const health = useAiHealth(enabled);
  const summary = useAiAnalyticsSummary("7d", enabled);
  const byModel = useAiAnalyticsByModel("7d", enabled);
  const byPlatform = useAiAnalyticsByPlatform("7d", enabled);
  const timeline = useAiAnalyticsTimeline("7d", enabled);
  const requests = useAiAnalyticsRequests({ range: "24h", limit: 50 }, enabled);
  const logs = useAiLogs(enabled);
  const settings = useAiSettings(enabled);
  const backups = useAiBackups(enabled);
  const profiles = useAiClientProfiles(enabled);
  const embeddings = useAiEmbeddings(enabled);
  const media = useAiMedia("image", enabled);

  const createKey = useCreateKey();
  const patchKey = usePatchKey();
  const deleteKey = useDeleteKey();
  const checkKey = useCheckKey();
  const checkAll = useCheckAllKeys();
  const clearCd = useClearCooldowns();
  const patchModel = usePatchModel();
  const updateFallback = useUpdateFallback();
  const updateRouting = useUpdateRouting();
  const updateSettings = useUpdateSettings();
  const createBackup = useCreateBackup();
  const createProfile = useCreateClientProfile();
  const rotateProfile = useRotateClientProfile();
  const deleteProfile = useDeleteClientProfile();

  const [newPlatform, setNewPlatform] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");
  const [profileName, setProfileName] = React.useState("");
  const [onceKey, setOnceKey] = React.useState<string | null>(null);

  if (!isPlatformStaff) {
    return (
      <div className="p-8">
        <Card><CardContent className="flex items-start gap-3 p-8">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div><p className="font-bold">Platform staff only</p>
          <p className="text-sm text-muted-foreground">The AI Infrastructure console is a platform operations surface. The server refuses these APIs without a platform role.</p></div>
        </CardContent></Card>
      </div>
    );
  }

  const state = (gateway.data as { state?: string } | undefined)?.state ?? "Unknown";
  const stateColor = state === "Healthy" ? "default" : state === "Warning" ? "secondary" : "destructive";

  const mutate = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <PageHero icon={Sparkles} title="AI Infrastructure" description="Secure operational control plane for FreeLLMAPI. Browser talks only to MyGymAgent — never to FreeLLMAPI directly." eyebrow="Platform" actions={<Badge variant={stateColor as never}>{state}</Badge>} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keys">Providers & Keys</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="routing">Routing & Fallback</TabsTrigger>
          <TabsTrigger value="health">Health & Quota</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="clients">Clients & Media</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Section title="Gateway status">
            <DataState isLoading={gateway.isLoading} isError={gateway.isError} onRetry={() => gateway.refetch()} isEmpty={!gateway.data} emptyTitle="No gateway data" emptyDescription="FreeLLMAPI may be unconfigured.">
              <Json value={gateway.data} />
            </DataState>
          </Section>
          <Section title="Incident panel">
            <DataState isLoading={health.isLoading} isError={health.isError} onRetry={() => health.refetch()} isEmpty={!health.data} emptyTitle="No health data" emptyDescription="Providers report through /api/health.">
              <Json value={health.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <Section title="Providers">
            <DataState isLoading={providers.isLoading} isError={providers.isError} onRetry={() => providers.refetch()} isEmpty={Array.isArray(providers.data) && providers.data.length === 0} emptyTitle="No providers" emptyDescription="Add a provider key below.">
              <Json value={providers.data} />
            </DataState>
          </Section>
          <Section title="API keys (masked only — reveal/export unsupported in V1)">
            <DataState isLoading={keys.isLoading} isError={keys.isError} onRetry={() => keys.refetch()} isEmpty={Array.isArray(keys.data) && keys.data.length === 0} emptyTitle="No keys" emptyDescription="No provider keys configured.">
              <Json value={keys.data} />
            </DataState>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="platform (e.g. openai)" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="max-w-52" />
              <Input placeholder="label (optional)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="max-w-52" />
              <Button disabled={!newPlatform.trim() || createKey.isPending} onClick={() => mutate(() => createKey.mutateAsync({ platform: newPlatform.trim(), label: newLabel.trim() || undefined }), "Key created")}>Add key</Button>
              <Button variant="outline" disabled={checkAll.isPending} onClick={() => mutate(() => checkAll.mutateAsync(), "Health re-check queued")}><Activity className="size-4" />Check all</Button>
            </div>
            {Array.isArray(keys.data) && keys.data.slice(0, 10).map((k) => {
              const row = k as Record<string, unknown>;
              return (
                <div key={String(row.id)} className="flex flex-wrap items-center gap-2 rounded-2xl border p-2 text-sm">
                  <Badge variant="outline">{String(row.platform ?? "?")} #{String(row.id ?? "?")}</Badge>
                  <span className="text-muted-foreground">{String((row as { maskedKey?: string }).maskedKey ?? (row as { label?: string }).label ?? "")}</span>
                  <Button size="sm" variant="outline" onClick={() => mutate(() => checkKey.mutateAsync(String(row.id)), "Probe sent")}>Check</Button>
                  <Button size="sm" variant="outline" onClick={() => mutate(() => patchKey.mutateAsync({ id: String(row.id), body: { enabled: !(row as { enabled?: boolean }).enabled } }), "Key toggled")}>{(row as { enabled?: boolean }).enabled ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="outline" onClick={() => mutate(() => clearCd.mutateAsync(String(row.id)), "Cooldowns cleared")}>Clear cooldowns</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (window.confirm(`Delete key ${String(row.id)}? This is destructive.`)) mutate(() => deleteKey.mutateAsync(String(row.id)), "Key deleted"); }}>Delete</Button>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">Raw key reveal, export, and preview are intentionally unavailable in V1 (PLATFORM_OWNER future capability).</p>
          </Section>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Section title="Models">
            <DataState isLoading={models.isLoading} isError={models.isError} onRetry={() => models.refetch()} isEmpty={Array.isArray(models.data) && models.data.length === 0} emptyTitle="No models" emptyDescription="No models registered in FreeLLMAPI.">
              <div className="space-y-2">
                {Array.isArray(models.data) && (models.data as Record<string, unknown>[]).slice(0, 25).map((m) => (
                  <div key={String(m.id)} className="flex flex-wrap items-center gap-2 rounded-2xl border p-2 text-sm">
                    <Badge><Brain className="size-3" />{String(m.modelId ?? m.id)}</Badge>
                    <span className="text-muted-foreground">{String(m.displayName ?? m.platform ?? "")}</span>
                    <Button size="sm" variant="outline" onClick={() => mutate(() => patchModel.mutateAsync({ id: String(m.id), body: { enabled: !(m as { enabled?: boolean }).enabled } }), "Model updated")}>{(m as { enabled?: boolean }).enabled ? "Disable" : "Enable"}</Button>
                  </div>
                ))}
              </div>
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <Section title="Routing (only strategies FreeLLMAPI supports)">
            <DataState isLoading={routing.isLoading} isError={routing.isError} onRetry={() => routing.refetch()} isEmpty={!routing.data} emptyTitle="No routing config" emptyDescription="FreeLLMAPI did not return routing.">
              <Json value={routing.data} />
            </DataState>
            <div className="flex flex-wrap gap-2">
              {(["priority", "balanced", "smartest", "fastest", "reliable"] as const).map((s) => (
                <Button key={s} size="sm" variant="outline" disabled={updateRouting.isPending} onClick={() => { if (window.confirm(`Switch routing strategy to ${s}?`)) mutate(() => updateRouting.mutateAsync({ strategy: s }), `Routing → ${s}`); }}>{s}</Button>
              ))}
            </div>
          </Section>
          <Section title="Fallback chain">
            <DataState isLoading={fallback.isLoading} isError={fallback.isError} onRetry={() => fallback.refetch()} isEmpty={Array.isArray(fallback.data) && fallback.data.length === 0} emptyTitle="Empty chain" emptyDescription="No fallback rows.">
              <Json value={Array.isArray(fallback.data) ? (fallback.data as unknown[]).slice(0, 25) : fallback.data} />
            </DataState>
            <p className="text-xs text-muted-foreground">Chain edits are validated server-side (duplicate modelDbId rejected, max 500 rows). Full reorder UI is a future enhancement — current rows shown read-only with enable/disable via Models.</p>
            <Button size="sm" variant="outline" disabled={updateFallback.isPending} onClick={() => toast.message("Reorder editor not in V1 — chain shown read-only to prevent invalid chains.")}><Workflow className="size-4" />Edit chain (future)</Button>
          </Section>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Section title="Health probes">
            <DataState isLoading={health.isLoading} isError={health.isError} onRetry={() => health.refetch()} isEmpty={!health.data} emptyTitle="No health data" emptyDescription="Nothing to report.">
              <Json value={health.data} />
            </DataState>
          </Section>
          <Section title="Quota / rate limits (as reported — never fabricated)">
            <DataState isLoading={quota.isLoading} isError={quota.isError} onRetry={() => quota.refetch()} isEmpty={!quota.data} emptyTitle="No quota data" emptyDescription="FreeLLMAPI exposes only counters it tracks.">
              <Json value={quota.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Section title="Summary (7d)">
            <DataState isLoading={summary.isLoading} isError={summary.isError} onRetry={() => summary.refetch()} isEmpty={!summary.data} emptyTitle="No analytics" emptyDescription="No traffic in range.">
              <Json value={summary.data} />
            </DataState>
          </Section>
          <Section title="By model / platform / timeline">
            <DataState isLoading={byModel.isLoading || byPlatform.isLoading || timeline.isLoading} isError={byModel.isError || byPlatform.isError || timeline.isError} onRetry={() => { byModel.refetch(); byPlatform.refetch(); timeline.refetch(); }} isEmpty={false} emptyTitle="—" emptyDescription="">
              <Json value={{ byModel: byModel.data, byPlatform: byPlatform.data, timeline: timeline.data }} />
            </DataState>
          </Section>
          <Section title="Request rows (sanitized: no clientIp/UA, truncated errors)">
            <DataState isLoading={requests.isLoading} isError={requests.isError} onRetry={() => requests.refetch()} isEmpty={(requests.data?.rows?.length ?? 0) === 0} emptyTitle="No requests" emptyDescription="No requests in the last 24h.">
              <Json value={requests.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Section title="Server logs (cursor view — clear unsupported in V1)">
            <DataState isLoading={logs.isLoading} isError={logs.isError} onRetry={() => logs.refetch()} isEmpty={!logs.data} emptyTitle="No logs" emptyDescription="No server log entries.">
              <Json value={logs.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Section title="Settings (allowlisted sections only)">
            <DataState isLoading={settings.isLoading} isError={settings.isError} onRetry={() => settings.refetch()} isEmpty={!settings.data} emptyTitle="No settings" emptyDescription="FreeLLMAPI returned nothing.">
              <Json value={settings.data} />
            </DataState>
            <p className="text-xs text-muted-foreground">Writable in V1: compression, fusion, anthropic-map, gemini-map, agent-compatibility, guardrails, headroom, output-limit, unify, update-check. Secrets (api-key, proxy token, url-tokens) are never writable here.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={updateSettings.isPending} onClick={() => { if (window.confirm("Toggle update-check off?")) mutate(() => updateSettings.mutateAsync({ section: "update-check", value: { enabled: false } }), "Settings updated"); }}><KeyRound className="size-4" />Disable update-check</Button>
              <Button size="sm" variant="outline" disabled={updateSettings.isPending} onClick={() => mutate(() => updateSettings.mutateAsync({ section: "update-check", value: { enabled: true } }), "Settings updated")}>Enable update-check</Button>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Section title="Client profiles (show-once secrets)">
            <DataState isLoading={profiles.isLoading} isError={profiles.isError} onRetry={() => profiles.refetch()} isEmpty={Array.isArray(profiles.data) && profiles.data.length === 0} emptyTitle="No client profiles" emptyDescription="Create one for a scoped integration key.">
              <Json value={Array.isArray(profiles.data) ? (profiles.data as Record<string, unknown>[]).map((row) => { const { key: _omit, ...r } = row; void _omit; return r; }) : profiles.data} />
            </DataState>
            {onceKey && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950">
                <p className="font-bold">Copy once — it will never be shown again:</p>
                <code className="break-all">{onceKey}</code>
                <div><Button size="sm" className="mt-2" onClick={() => { void navigator.clipboard.writeText(onceKey); toast.success("Copied — clear this from view when done"); }}>Copy</Button>
                <Button size="sm" variant="outline" className="ml-2 mt-2" onClick={() => setOnceKey(null)}>Dismiss</Button></div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Input placeholder="profile name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="max-w-52" />
              <Button disabled={!profileName.trim() || createProfile.isPending} onClick={async () => {
                try { const out = await createProfile.mutateAsync({ name: profileName.trim() }); if ((out as { key?: string }).key) setOnceKey((out as { key: string }).key); setProfileName(""); toast.success("Profile created"); }
                catch (e) { toast.error(errMsg(e)); }
              }}>Create</Button>
            </div>
            {Array.isArray(profiles.data) && profiles.data.slice(0, 10).map((p) => {
              const row = p as Record<string, unknown>;
              return (
                <div key={String(row.id)} className="flex flex-wrap items-center gap-2 rounded-2xl border p-2 text-sm">
                  <Badge variant="outline">{String(row.name ?? row.id)}</Badge>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!window.confirm(`Rotate key for ${String(row.name ?? row.id)}? Old key stops working.`)) return;
                    try { const out = await rotateProfile.mutateAsync(String(row.id)); if ((out as { key?: string }).key) setOnceKey((out as { key: string }).key); toast.success("Rotated — new key shown once"); }
                    catch (e) { toast.error(errMsg(e)); }
                  }}>Rotate (?confirm)</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (window.confirm("Delete this client profile?")) mutate(() => deleteProfile.mutateAsync(String(row.id)), "Profile deleted"); }}>Delete</Button>
                </div>
              );
            })}
          </Section>
          <Section title="Embeddings / media usage">
            <DataState isLoading={embeddings.isLoading || media.isLoading} isError={embeddings.isError || media.isError} onRetry={() => { embeddings.refetch(); media.refetch(); }} isEmpty={false} emptyTitle="—" emptyDescription="">
              <Json value={{ embeddings: embeddings.data, media: media.data }} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Section title="Backups (V1: list + create only — download/restore unsupported)">
            <DataState isLoading={backups.isLoading} isError={backups.isError} onRetry={() => backups.refetch()} isEmpty={!backups.data} emptyTitle="No backups" emptyDescription="No backups yet.">
              <Json value={backups.data} />
            </DataState>
            <Button disabled={createBackup.isPending} onClick={() => { if (window.confirm("Create a FreeLLMAPI backup now?")) mutate(() => createBackup.mutateAsync({}), "Backup created"); }}><Database className="size-4" />Create backup</Button>
            <p className="text-xs text-muted-foreground">Download and restore are intentionally unavailable in V1 (PLATFORM_OWNER future capability with audit).</p>
          </Section>
        </TabsContent>
      </Tabs>

      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Network className="size-3" />Unsupported in V1 (shown, not faked): key reveal/export, unified-key regeneration, URL-token minting, backup download/restore, premium/license, logs clear, conversation transcripts.</p>
    </div>
  );
}
