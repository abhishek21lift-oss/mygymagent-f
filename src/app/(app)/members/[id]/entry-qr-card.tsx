"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useEntryQrToken } from "@/lib/hooks/use-attendance";
import { ApiError } from "@/lib/api/client";

/** Member gate token. Plaintext is only returned on generation — shown
 * here for scanning/copying, never persisted. No `qrcode.react`
 * dependency in the repo, so the token renders as copyable mono text. */
export function EntryQrCard({ memberId }: { memberId: string }) {
 const { hasPermission } = useAuth();
 const qr = useEntryQrToken(memberId);

 if (!hasPermission(["attendance.create", "members.read"])) return null;

 async function handleCopy() {
 if (!qr.data) return;
 try {
 await navigator.clipboard.writeText(qr.data.token);
 toast.success("Entry token copied");
 } catch {
 toast.error("Could not copy token");
 }
 }

 async function handleRotate() {
 try {
 await qr.refetch();
 toast.success("Entry QR rotated");
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Could not rotate QR");
 }
 }

 return (
 <section
 aria-labelledby="member-entry-qr"
 className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 dark:border-white/10 dark:bg-stone-950/80"
 >
 <div className="flex items-center gap-3 border-b border-stone-100/80 bg-muted/40 px-5 py-5 sm:px-6 dark:from-violet-950/40 dark:via-stone-950 dark:to-cyan-950/20">
 <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/25">
 <QrCode className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 id="member-entry-qr" className="font-semibold text-xl font-semibold tracking-tight text-stone-950 dark:text-white">
 Entry QR
 </h2>
 </div>
 </div>
 <div className="flex flex-col gap-3 p-5 sm:p-6">
 {qr.isLoading ? (
 <Skeleton className="h-12 w-full rounded-lg" />
 ) : qr.isError || !qr.data ? (
 <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
 Entry QR unavailable right now.
 </p>
 ) : (
 <>
 <p className="break-all rounded-lg border border-stone-200/70 bg-stone-50/70 px-4 py-3 font-mono text-sm font-bold text-stone-900 dark:border-white/10 dark:bg-card dark:text-stone-100">
 {qr.data.token}
 </p>
 {qr.data.rotatesAt && (
 <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
 Rotates {new Date(qr.data.rotatesAt).toLocaleString()}
 </p>
 )}
 <div className="flex flex-col gap-2 sm:flex-row">
 <Button
 variant="outline"
 onClick={handleCopy}
 className="min-h-11 rounded-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
 >
 <Copy className="size-4" aria-hidden="true" />
 Copy
 </Button>
 <Button
 variant="outline"
 onClick={handleRotate}
 disabled={qr.isFetching}
 className="min-h-11 rounded-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
 >
 <RefreshCw className="size-4" aria-hidden="true" />
 {qr.isFetching ? "Rotating…" : "Rotate"}
 </Button>
 </div>
 </>
 )}
 </div>
 </section>
 );
}
