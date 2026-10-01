"use client";

import Link from "next/link";
import { ArrowRight, Building2, MessageCircle, Settings2, ShieldCheck, Store } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useOrganization } from "@/lib/hooks/use-organization";

export default function SettingsPage() {
 const { hasPermission } = useAuth();
 const orgQuery = useOrganization();
 const canEdit = hasPermission("organizations.update");
 const canManageSettings = hasPermission("settings.manage");

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="settings-title"
 icon={Settings2}
 title="Settings"
 actions={
 // The Security link is outside the `settings.manage` gate on purpose:
 // two-step verification is the signed-in user's own account setting,
 // so every role has to be able to reach it.
 <div className="flex flex-wrap gap-2">
 <Link href="/settings/security" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-card px-5 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5"> <ShieldCheck className="size-4" aria-hidden="true" /> Security </Link>
 {canManageSettings ? (
 <><Link href="/settings/notifications" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-card px-5 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5"> Notification preferences </Link><Link href="/settings/messages" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-card px-5 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5"> Message templates </Link><Link href="/settings/billing" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-card px-5 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5"> Platform Billing <ArrowRight className="size-4" aria-hidden="true" /></Link><Link href="/settings/whatsapp" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp setup <ArrowRight className="size-4" aria-hidden="true" />
 </Link></>
 ) : null}
 </div>
 }
 />

 <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
 <section aria-labelledby="settings-org">
 <Card className="overflow-hidden border-border bg-card">
 <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 sm:px-5">
 <span className="flex size-11 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg">
 <Building2 className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 id="settings-org" className="section-title">Gym profile</h2>
 </div>
 </div>
 <CardContent className="p-5 sm:p-6">
 {orgQuery.isLoading ? (
 <div className="flex flex-col gap-3" aria-label="Loading organization">
 <Skeleton className="h-11 w-full rounded-xl" />
 <Skeleton className="h-11 w-full rounded-xl" />
 </div>
 ) : orgQuery.isError ? (
 <ErrorState onRetry={() => orgQuery.refetch()} />
 ) : orgQuery.data ? (
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex min-w-0 items-center gap-4">
 <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
 {orgQuery.data.logoUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={orgQuery.data.logoUrl} alt="" className="size-full object-contain" />
 ) : (
 <Store className="size-7 text-muted-foreground" aria-hidden="true" />
 )}
 </div>
 <div className="min-w-0">
 <p className="min-w-0 [overflow-wrap:anywhere] text-lg font-semibold tracking-tight">{orgQuery.data.name}</p>
 <p className="min-w-0 [overflow-wrap:anywhere] text-sm text-muted-foreground">
 {[orgQuery.data.contactPhone, orgQuery.data.contactEmail].filter(Boolean).join(" · ") || "Logo, contact details, branches and opening hours"}
 </p>
 <p className="text-xs text-muted-foreground">{orgQuery.data.timezone} · {orgQuery.data.currency}</p>
 </div>
 </div>
 <Button asChild className="min-h-11 shrink-0 rounded-lg">
 <Link href="/settings/profile">{canEdit ? "Edit gym profile" : "View gym profile"} <ArrowRight className="size-4" aria-hidden="true" /></Link>
 </Button>
 </div>
 ) : null}
 </CardContent>
 </Card>
 </section>

 <section aria-label="Integrations" className="flex flex-col gap-4">
 {canManageSettings && (
 <Card className="relative overflow-hidden border-0 bg-[linear-gradient(145deg,#064e3b,#059669_55%,#06b6d4)] text-white shadow-[0_28px_75px_-38px_rgba(16,185,129,.7)]">
 <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-card blur-3xl" aria-hidden="true" />
 <CardContent className="relative flex items-center justify-between gap-4 p-5 sm:p-6">
 <div className="flex min-w-0 items-center gap-3">
 <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border"><MessageCircle className="size-6" aria-hidden="true" /></span>
 <div className="min-w-0">
 <div className="font-semibold text-lg font-semibold tracking-tight">WhatsApp Business</div>
 </div>
 </div>
 <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-lg"><Link href="/settings/whatsapp">Manage</Link></Button>
 </CardContent>
 </Card>
 )}
 </section>
 </div>
 </div>
 </div>
 );
}
