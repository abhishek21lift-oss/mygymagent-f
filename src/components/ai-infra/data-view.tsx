"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Renders a FreeLLMAPI payload as interface, not as a JSON dump.
 *
 * Those payloads are passed through by the API untyped (they belong to an
 * external service whose shapes change between versions), so this works on
 * any shape: objects become labelled tiles, arrays of records become a
 * table (stacked cards on a phone), status-like words become pills. The raw
 * response stays one click away in a collapsed disclosure for whoever is
 * debugging, which is the only reader who ever wanted it.
 */

type Tone = "success" | "warning" | "danger" | "neutral";

const SUCCESS = /^(ok|healthy|up|active|enabled|ready|live|connected|success|true|yes|available|online)$/i;
const WARNING = /^(warning|warn|degraded|rate_?limited|cooldown|cooling|pending|partial|throttled|slow)$/i;
const DANGER = /^(error|failed|failure|down|unavailable|offline|critical|disabled|false|no|invalid|expired|blocked)$/i;

export function toneOf(value: unknown): Tone | null {
  if (typeof value === "boolean") return value ? "success" : "danger";
  if (typeof value !== "string") return null;
  if (SUCCESS.test(value)) return "success";
  if (WARNING.test(value)) return "warning";
  if (DANGER.test(value)) return "danger";
  return null;
}

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success/12 text-success ring-success/25",
  warning: "bg-warning/14 text-warning ring-warning/30",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export function StatusPill({ value, tone }: { value: React.ReactNode; tone?: Tone | null }) {
  const resolved = tone ?? toneOf(value) ?? "neutral";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", TONE_CLASS[resolved])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
    </span>
  );
}

/** `rateLimitedUntil` / `rate_limited_until` -> "Rate limited until". */
export function humanize(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPrimitive(value: unknown) {
  return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value);
}

/** One scalar, formatted for reading. */
export function Scalar({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not reported</span>
      </span>
    );
  }
  const tone = toneOf(value);
  if (tone) return <StatusPill value={value as React.ReactNode} tone={tone} />;
  if (typeof value === "number") return <span className="tabular-nums">{value.toLocaleString("en-IN")}</span>;
  if (typeof value === "string" && ISO_DATE.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return <time dateTime={value}>{date.toLocaleString()}</time>;
  }
  return <span className="[overflow-wrap:anywhere]">{String(value)}</span>;
}

/** Columns worth leading with, when a record has them. */
const PREFERRED = ["name", "displayName", "label", "platform", "provider", "modelId", "model", "id", "status", "state", "enabled", "priority"];

function columnsFor(rows: Record<string, unknown>[], max = 6): string[] {
  const keys = new Set<string>();
  for (const row of rows.slice(0, 50)) {
    for (const [k, v] of Object.entries(row)) if (isPrimitive(v)) keys.add(k);
  }
  const ordered = [
    ...PREFERRED.filter((k) => keys.has(k)),
    ...[...keys].filter((k) => !PREFERRED.includes(k)),
  ];
  return ordered.slice(0, max);
}

function RecordTable({ rows, limit = 25 }: { rows: Record<string, unknown>[]; limit?: number }) {
  const columns = columnsFor(rows);
  const shown = rows.slice(0, limit);
  if (columns.length === 0) {
    return (
      <div className="space-y-3">
        {shown.map((row, i) => (
          <KeyValues key={i} value={row} depth={1} />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {/* Phones: one card per row. */}
      <ul className="space-y-2 md:hidden">
        {shown.map((row, i) => (
          <li key={i} className="rounded-2xl border border-border/70 bg-card/70 p-3">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              {columns.map((col) => (
                <React.Fragment key={col}>
                  <dt className="text-xs font-medium text-muted-foreground">{humanize(col)}</dt>
                  <dd className="min-w-0 text-right"><Scalar value={row[col]} /></dd>
                </React.Fragment>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      {/* Wider screens: a real table. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border/70 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-sunken)] text-left">
              {columns.map((col) => (
                <th key={col} scope="col" className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  {humanize(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="border-t border-border/60 transition-colors hover:bg-[var(--surface-hover)]">
                {columns.map((col) => (
                  <td key={col} className="max-w-64 px-4 py-2.5 align-top">
                    <Scalar value={row[col]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > limit ? (
        <p className="text-xs text-muted-foreground">Showing {limit} of {rows.length.toLocaleString("en-IN")}.</p>
      ) : null}
    </div>
  );
}

function KeyValues({ value, depth }: { value: Record<string, unknown>; depth: number }) {
  const entries = Object.entries(value);
  const flat = entries.filter(([, v]) => isPrimitive(v));
  const nested = entries.filter(([, v]) => !isPrimitive(v));
  return (
    <div className="space-y-4">
      {flat.length > 0 ? (
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {flat.map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-2xl border border-border/60 bg-card/70 px-3.5 py-3">
              <dt className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground" title={humanize(k)}>
                {humanize(k)}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-foreground"><Scalar value={v} /></dd>
            </div>
          ))}
        </dl>
      ) : null}
      {nested.map(([k, v]) => (
        <section key={k} aria-label={humanize(k)} className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{humanize(k)}</h4>
          <DataNode value={v} depth={depth + 1} />
        </section>
      ))}
    </div>
  );
}

function DataNode({ value, depth }: { value: unknown; depth: number }) {
  if (isPrimitive(value)) return <Scalar value={value} />;
  if (depth > 3) return <RawJson value={value} />;
  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-sm text-muted-foreground">None.</p>;
    if (value.every(isPrimitive)) {
      return (
        <ul className="flex flex-wrap gap-1.5">
          {value.slice(0, 50).map((item, i) => (
            <li key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"><Scalar value={item} /></li>
          ))}
        </ul>
      );
    }
    if (value.every(isPlainObject)) return <RecordTable rows={value as Record<string, unknown>[]} />;
    return <RawJson value={value} />;
  }
  if (isPlainObject(value)) {
    if (Object.keys(value).length === 0) return <p className="text-sm text-muted-foreground">Nothing reported.</p>;
    return <KeyValues value={value} depth={depth} />;
  }
  return <RawJson value={value} />;
}

function RawJson({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-2xl bg-[var(--surface-sunken)] p-3 font-mono text-xs leading-relaxed text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** The payload as interface, with the raw response folded away below. */
export function DataView({ value, rawLabel = "Raw response" }: { value: unknown; rawLabel?: string }) {
  return (
    <div className="space-y-4">
      <DataNode value={value} depth={0} />
      <RawDisclosure value={value} label={rawLabel} />
    </div>
  );
}

export function RawDisclosure({ value, label = "Raw response" }: { value: unknown; label?: string }) {
  return (
    <details className="group rounded-2xl border border-dashed border-border/80 px-3 py-2 text-xs">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 font-semibold text-muted-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
        {label}
      </summary>
      <div className="mt-2">
        <RawJson value={value} />
      </div>
    </details>
  );
}
