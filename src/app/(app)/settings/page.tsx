"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowRight, Building2, MessageCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <PageHero
          id="settings-title"
          icon={Settings2}
          title="Settings"
          variant="light"
          accent="indigo"
          actions={
            canManageSettings ? (
              <Link href="/settings/whatsapp" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp setup <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : undefined
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <section aria-labelledby="settings-org">
            <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-indigo-50/80 via-white to-stone-100/60 px-5 py-5">
                <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="settings-org" className="font-serif text-xl font-semibold tracking-tight text-stone-950">Organization profile</h2>
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
                    </div>
                  </div>
                  <Button asChild variant="outline" className="min-h-11 shrink-0 rounded-2xl border-white/30 bg-white font-extrabold text-emerald-900 hover:bg-white/90"><Link href="/settings/whatsapp">Manage</Link></Button>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
