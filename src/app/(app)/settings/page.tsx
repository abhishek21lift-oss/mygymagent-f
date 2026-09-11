"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowRight, Building2, MessageCircle, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth/auth-context";
import { useOrganization, useUpdateOrganization } from "@/lib/hooks/use-organization";
import { ApiError } from "@/lib/api/client";

interface OrgSettingsForm {
  name: string;
  timezone: string;
  currency: string;
}

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const orgQuery = useOrganization();
  const updateOrg = useUpdateOrganization();
  const canEdit = hasPermission("organizations.update");
  const canManageSettings = hasPermission("settings.manage");

  const form = useForm<OrgSettingsForm>({ defaultValues: { name: "", timezone: "UTC", currency: "USD" } });

  React.useEffect(() => {
    if (orgQuery.data) {
      form.reset({
        name: orgQuery.data.name,
        timezone: orgQuery.data.timezone,
        currency: orgQuery.data.currency,
      });
    }
  }, [orgQuery.data, form]);

  async function onSubmit(values: OrgSettingsForm) {
    try {
      await updateOrg.mutateAsync(values);
      toast.success("Organization updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update organization");
    }
  }

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="settings-title" className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-indigo-300/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-stone-300/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-cyan-200/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                <Settings2 className="size-6" aria-hidden="true" />
              </span>
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/75 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-indigo-700">
                  <Sparkles className="size-3.5" aria-hidden="true" /> Control room
                </div>
                <h1 id="settings-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl">Settings</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-600">Organization profile and preferences — the calm indigo surface for operational truth.</p>
              </div>
            </div>
            {canManageSettings && (
              <Link href="/settings/whatsapp" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp setup <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <section aria-labelledby="settings-org">
            <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-indigo-50/80 via-white to-stone-100/60 px-5 py-5">
                <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="settings-org" className="font-serif text-xl font-semibold tracking-tight text-stone-950">Organization profile</h2>
                  <p className="mt-0.5 text-xs font-medium text-stone-600">Name, timezone and billing currency.</p>
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
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization name</FormLabel>
                            <FormControl><Input disabled={!canEdit} {...field} className="min-h-11 rounded-xl" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Timezone</FormLabel>
                              <FormControl><Input disabled={!canEdit} {...field} className="min-h-11 rounded-xl" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <FormControl><Input disabled={!canEdit} {...field} className="min-h-11 rounded-xl" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {canEdit && (
                        <div className="flex justify-end">
                          <Button type="submit" disabled={updateOrg.isPending} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#6d28d9)] shadow-lg shadow-indigo-500/20">{updateOrg.isPending ? "Saving..." : "Save changes"}</Button>
                        </div>
                      )}
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-label="Integrations" className="flex flex-col gap-4">
            {canManageSettings && (
              <Card className="relative overflow-hidden border-0 bg-[linear-gradient(145deg,#064e3b,#059669_55%,#06b6d4)] text-white shadow-[0_28px_75px_-38px_rgba(16,185,129,.7)]">
                <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
                <CardContent className="relative flex items-center justify-between gap-4 p-5 sm:p-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-white/15 ring-1 ring-white/25 backdrop-blur"><MessageCircle className="size-6" aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <div className="font-serif text-lg font-semibold tracking-tight">WhatsApp Business</div>
                      <div className="mt-0.5 text-xs font-medium text-white/70">Connect this gym&apos;s own WhatsApp number through Meta.</div>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-2xl border-white/30 bg-white font-extrabold text-emerald-900 hover:bg-white/90"><Link href="/settings/whatsapp">Manage</Link></Button>
                </CardContent>
              </Card>
            )}
            <Card className="border-white/90 bg-white/85 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="font-serif text-lg tracking-tight text-stone-950">Good defaults, quiet power</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-xs font-medium leading-5 text-stone-600">
                <p>Timezone drives scheduling and reporting. Currency drives every price, invoice and payout.</p>
                <p>Changes apply instantly across billing, attendance and automations.</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
