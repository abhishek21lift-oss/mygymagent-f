"use client";

import * as React from "react";
import { Activity, Brain, CheckCircle2, Database, KeyRound, Network, PlugZap, ShieldAlert, Sparkles, Workflow, XCircle, type LucideIcon } from "lucide-react";
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
import { DataView, RawDisclosure, StatusPill } from "@/components/ai-infra/data-view";
import { cn } from "@/lib/utils";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Request failed");

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0 rounded-[1.75rem]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

type GatewayPayload = {
  state?: string;
  live?: { status?: string; reason?: string } | null;
  ready?: { status?: string; reason?: string } | null;
  ping?: unknown;
  providers?: unknown;
  diagnosis?: { credentialsConfigured?: boolean; loopbackBaseUrl?: boolean; providersError?: string | null };
};

const STATE_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Healthy: "success",
  Warning: "warning",
  Critical: "danger",
  Offline: "danger",
};

/** One probe: what it checks, and whether it passed. */
function Probe({ icon: Icon, label, ok, detail }: { icon: LucideIcon; label: string; ok: boolean | null; detail: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-3.5">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl text-white",
          ok === null ? "bg-muted-foreground/60" : ok ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-rose-500 to-orange-500",
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{detail}</p>
      </div>
    </div>
  );
}

/** A diagnosis line: a check the operator can act on. */
function Check({ ok, title, fix }: { ok: boolean; title: string; fix: string }) {
  return (
    <li className="flex items-start gap-3">
      {ok ? (
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
      ) : (
        <XCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {!ok ? <p className="text-xs text-muted-foreground">{fix}</p> : null}
      </div>
    </li>
  );
}

function GatewayPanel({ data }: { data: GatewayPayload }) {
  const state = data.state ?? "Unknown";
  const liveOk = data.live?.status === "ok";
  const readyOk = data.ready?.status === "ok";
  const providerCount = Array.isArray(data.providers) ? data.providers.length : null;
  const d = data.diagnosis;
  const headline =
    state === "Healthy"
      ? "Gateway is healthy"
      : state === "Warning"
        ? "Gateway is up, but a provider is rate limited"
        : state === "Critical"
          ? "Gateway is running but not ready to serve"
          : state === "Offline"
            ? "Gateway is offline"
            : "Gateway state unknown";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-card)]",
            STATE_TONE[state] === "success"
              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
              : STATE_TONE[state] === "warning"
                ? "bg-gradient-to-br from-amber-500 to-orange-500"
                : STATE_TONE[state] === "danger"
                  ? "bg-gradient-to-br from-rose-500 to-orange-500"
                  : "bg-muted-foreground/60",
          )}
        >
          <PlugZap className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-foreground">{headline}</p>
          <p className="text-xs text-muted-foreground">MyGymAgent probes FreeLLMAPI server-side; this browser never contacts it.</p>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Probe icon={Activity} label="Liveness" ok={liveOk} detail={liveOk ? "Process is running" : data.live?.reason ?? "No answer"} />
        <Probe icon={CheckCircle2} label="Readiness" ok={readyOk} detail={readyOk ? "Ready to serve" : data.ready?.reason ?? "Not ready"} />
        <Probe icon={Network} label="Ping" ok={data.ping ? true : liveOk ? null : false} detail={data.ping ? "Responding" : "No reply"} />
        <Probe
          icon={KeyRound}
          label="Providers"
          ok={providerCount === null ? false : providerCount > 0}
          detail={providerCount === null ? d?.providersError ?? "Could not list providers" : `${providerCount} configured`}
        />
      </div>

      {state !== "Healthy" && d ? (
        <div className="rounded-2xl border border-warning/40 bg-warning/8 p-4">
          <p className="mb-3 text-sm font-bold text-foreground">What to check</p>
          <ul className="space-y-3">
            <Check
              ok={Boolean(d.credentialsConfigured)}
              title="Admin credentials are set"
              fix="Set FREELLM_EMAIL and FREELLM_PASSWORD on the API service (Render → Environment), then redeploy."
            />
            <Check
              ok={!d.loopbackBaseUrl}
              title="Base URL points at the FreeLLMAPI service"
              fix="FREELLM_BASE_URL is still the localhost default. Set it to the URL where FreeLLMAPI is deployed."
            />
            <Check
              ok={liveOk}
              title="FreeLLMAPI answers health probes"
              fix={`The API could not reach it (${data.live?.reason ?? "no answer"}). Confirm the service is running and reachable from the API's network.`}
            />
            <Check
              ok={!d.providersError}
              title="Signed-in requests succeed"
              fix={d.providersError ?? "Signed-in requests are failing."}
            />
          </ul>
        </div>
      ) : null}

      <RawDisclosure value={data} />
    </div>
  );
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

  const mutate = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <PageHero icon={Sparkles} title="AI Infrastructure" actions={<StatusPill value={state} tone={STATE_TONE[state] ?? "neutral"} />} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex h-auto w-full justify-start overflow-x-auto [scrollbar-width:none]">
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
              {gateway.data ? <GatewayPanel data={gateway.data as GatewayPayload} /> : null}
            </DataState>
          </Section>
          <Section title="Incident panel" description="Provider health as FreeLLMAPI reports it.">
            <DataState isLoading={health.isLoading} isError={health.isError} onRetry={() => health.refetch()} isEmpty={!health.data} emptyTitle="No health data" emptyDescription="Providers report through /api/health.">
              <DataView value={health.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <Section title="Providers">
            <DataState isLoading={providers.isLoading} isError={providers.isError} onRetry={() => providers.refetch()} isEmpty={Array.isArray(providers.data) && providers.data.length === 0} emptyTitle="No providers" emptyDescription="Add a provider key below.">
              <DataView value={providers.data} />
            </DataState>
          </Section>
          <Section title="API keys (masked only — reveal/export unsupported in V1)">
            <DataState isLoading={keys.isLoading} isError={keys.isError} onRetry={() => keys.refetch()} isEmpty={Array.isArray(keys.data) && keys.data.length === 0} emptyTitle="No keys" emptyDescription="No provider keys configured.">
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
                {Array.isArray(keys.data) && keys.data.slice(0, 25).map((k) => {
                  const row = k as Record<string, unknown>;
                  const enabled = Boolean((row as { enabled?: boolean }).enabled);
                  return (
                    <li key={String(row.id)} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{String(row.platform ?? "?")} <span className="font-normal text-muted-foreground">#{String(row.id ?? "?")}</span></p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{String((row as { maskedKey?: string }).maskedKey ?? (row as { label?: string }).label ?? "")}</p>
                      </div>
                      <StatusPill value={enabled ? "Enabled" : "Disabled"} tone={enabled ? "success" : "neutral"} />
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => mutate(() => checkKey.mutateAsync(String(row.id)), "Probe sent")}>Check</Button>
                        <Button size="sm" variant="outline" onClick={() => mutate(() => patchKey.mutateAsync({ id: String(row.id), body: { enabled: !enabled } }), "Key toggled")}>{enabled ? "Disable" : "Enable"}</Button>
                        <Button size="sm" variant="outline" onClick={() => mutate(() => clearCd.mutateAsync(String(row.id)), "Cooldowns cleared")}>Clear cooldowns</Button>
                        <Button size="sm" variant="destructive" onClick={() => { if (window.confirm(`Delete key ${String(row.id)}? This is destructive.`)) mutate(() => deleteKey.mutateAsync(String(row.id)), "Key deleted"); }}>Delete</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </DataState>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="platform (e.g. openai)" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="max-w-52" />
              <Input placeholder="label (optional)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="max-w-52" />
              <Button disabled={!newPlatform.trim() || createKey.isPending} onClick={() => mutate(() => createKey.mutateAsync({ platform: newPlatform.trim(), label: newLabel.trim() || undefined }), "Key created")}>Add key</Button>
              <Button variant="outline" disabled={checkAll.isPending} onClick={() => mutate(() => checkAll.mutateAsync(), "Health re-check queued")}><Activity className="size-4" />Check all</Button>
            </div>
            <p className="text-xs text-muted-foreground">Raw key reveal, export, and preview are intentionally unavailable in V1 (PLATFORM_OWNER future capability).</p>
          </Section>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Section title="Models">
            <DataState isLoading={models.isLoading} isError={models.isError} onRetry={() => models.refetch()} isEmpty={Array.isArray(models.data) && models.data.length === 0} emptyTitle="No models" emptyDescription="No models registered in FreeLLMAPI.">
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
                {Array.isArray(models.data) && (models.data as Record<string, unknown>[]).slice(0, 25).map((m) => {
                  const enabled = Boolean((m as { enabled?: boolean }).enabled);
                  return (
                    <li key={String(m.id)} className="flex flex-wrap items-center gap-3 px-3.5 py-3 text-sm">
                      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white"><Brain className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{String(m.modelId ?? m.id)}</p>
                        <p className="truncate text-xs text-muted-foreground">{String(m.displayName ?? m.platform ?? "")}</p>
                      </div>
                      <StatusPill value={enabled ? "Enabled" : "Disabled"} tone={enabled ? "success" : "neutral"} />
                      <Button size="sm" variant="outline" onClick={() => mutate(() => patchModel.mutateAsync({ id: String(m.id), body: { enabled: !enabled } }), "Model updated")}>{enabled ? "Disable" : "Enable"}</Button>
                    </li>
                  );
                })}
              </ul>
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <Section title="Routing (only strategies FreeLLMAPI supports)">
            <DataState isLoading={routing.isLoading} isError={routing.isError} onRetry={() => routing.refetch()} isEmpty={!routing.data} emptyTitle="No routing config" emptyDescription="FreeLLMAPI did not return routing.">
              <DataView value={routing.data} />
            </DataState>
            <div className="flex flex-wrap gap-2">
              {(["priority", "balanced", "smartest", "fastest", "reliable"] as const).map((s) => (
                <Button key={s} size="sm" variant="outline" disabled={updateRouting.isPending} onClick={() => { if (window.confirm(`Switch routing strategy to ${s}?`)) mutate(() => updateRouting.mutateAsync({ strategy: s }), `Routing → ${s}`); }}>{s}</Button>
              ))}
            </div>
          </Section>
          <Section title="Fallback chain">
            <DataState isLoading={fallback.isLoading} isError={fallback.isError} onRetry={() => fallback.refetch()} isEmpty={Array.isArray(fallback.data) && fallback.data.length === 0} emptyTitle="Empty chain" emptyDescription="No fallback rows.">
              <DataView value={Array.isArray(fallback.data) ? (fallback.data as unknown[]).slice(0, 25) : fallback.data} />
            </DataState>
            <p className="text-xs text-muted-foreground">Chain edits are validated server-side (duplicate modelDbId rejected, max 500 rows). Full reorder UI is a future enhancement — current rows shown read-only with enable/disable via Models.</p>
            <Button size="sm" variant="outline" disabled={updateFallback.isPending} onClick={() => toast.message("Reorder editor not in V1 — chain shown read-only to prevent invalid chains.")}><Workflow className="size-4" />Edit chain (future)</Button>
          </Section>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Section title="Health probes">
            <DataState isLoading={health.isLoading} isError={health.isError} onRetry={() => health.refetch()} isEmpty={!health.data} emptyTitle="No health data" emptyDescription="Nothing to report.">
              <DataView value={health.data} />
            </DataState>
          </Section>
          <Section title="Quota / rate limits (as reported — never fabricated)">
            <DataState isLoading={quota.isLoading} isError={quota.isError} onRetry={() => quota.refetch()} isEmpty={!quota.data} emptyTitle="No quota data" emptyDescription="FreeLLMAPI exposes only counters it tracks.">
              <DataView value={quota.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Section title="Summary (7d)">
            <DataState isLoading={summary.isLoading} isError={summary.isError} onRetry={() => summary.refetch()} isEmpty={!summary.data} emptyTitle="No analytics" emptyDescription="No traffic in range.">
              <DataView value={summary.data} />
            </DataState>
          </Section>
          <Section title="By model / platform / timeline">
            <DataState isLoading={byModel.isLoading || byPlatform.isLoading || timeline.isLoading} isError={byModel.isError || byPlatform.isError || timeline.isError} onRetry={() => { byModel.refetch(); byPlatform.refetch(); timeline.refetch(); }} isEmpty={false} emptyTitle="—" emptyDescription="">
              <DataView value={{ byModel: byModel.data, byPlatform: byPlatform.data, timeline: timeline.data }} />
            </DataState>
          </Section>
          <Section title="Request rows (sanitized: no clientIp/UA, truncated errors)">
            <DataState isLoading={requests.isLoading} isError={requests.isError} onRetry={() => requests.refetch()} isEmpty={(requests.data?.rows?.length ?? 0) === 0} emptyTitle="No requests" emptyDescription="No requests in the last 24h.">
              <DataView value={requests.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Section title="Server logs (cursor view — clear unsupported in V1)">
            <DataState isLoading={logs.isLoading} isError={logs.isError} onRetry={() => logs.refetch()} isEmpty={!logs.data} emptyTitle="No logs" emptyDescription="No server log entries.">
              <DataView value={logs.data} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Section title="Settings (allowlisted sections only)">
            <DataState isLoading={settings.isLoading} isError={settings.isError} onRetry={() => settings.refetch()} isEmpty={!settings.data} emptyTitle="No settings" emptyDescription="FreeLLMAPI returned nothing.">
              <DataView value={settings.data} />
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
              <DataView value={Array.isArray(profiles.data) ? (profiles.data as Record<string, unknown>[]).map((row) => { const { key: _omit, ...r } = row; void _omit; return r; }) : profiles.data} />
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
              <DataView value={{ embeddings: embeddings.data, media: media.data }} />
            </DataState>
          </Section>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Section title="Backups (V1: list + create only — download/restore unsupported)">
            <DataState isLoading={backups.isLoading} isError={backups.isError} onRetry={() => backups.refetch()} isEmpty={!backups.data} emptyTitle="No backups" emptyDescription="No backups yet.">
              <DataView value={backups.data} />
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
