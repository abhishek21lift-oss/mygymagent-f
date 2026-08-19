"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
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
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Organization profile and preferences" />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Organization profile</CardTitle>
        </CardHeader>
        <CardContent>
          {orgQuery.isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
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
                      <FormControl>
                        <Input disabled={!canEdit} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input disabled={!canEdit} {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input disabled={!canEdit} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {canEdit && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateOrg.isPending}>
                      {updateOrg.isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
