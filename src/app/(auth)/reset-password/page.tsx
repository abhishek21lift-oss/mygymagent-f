"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api, ApiError } from "@/lib/api/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";

export default function ResetPasswordPage() {
  return (
    <React.Suspense>
      <ResetPasswordForm />
    </React.Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    if (!token) {
      toast.error("This reset link is missing its token.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.newPassword });
      toast.success("Password updated. Sign in with your new password.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border-white/40 bg-white/85 py-0 shadow-[0_35px_90px_-40px_rgba(79,70,229,.55)] backdrop-blur-2xl">
      <CardHeader className="relative overflow-hidden bg-[linear-gradient(135deg,#0f0c29_0%,#065f46_50%,#06b6d4_100%)] p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-emerald-300/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.18em]">
              <Sparkles className="size-3" aria-hidden="true" /> Secure reset
            </p>
            <CardTitle className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-white">Choose a new password</CardTitle>
          </div>
        </div>
        <CardDescription className="relative mt-3 text-xs font-medium text-white/75">Signs you out everywhere once it&apos;s changed.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-stone-900">New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} className="min-h-11 rounded-2xl focus-visible:ring-emerald-600" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-stone-900">Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} className="min-h-11 rounded-2xl focus-visible:ring-emerald-600" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="min-h-11 w-full rounded-2xl bg-[linear-gradient(105deg,#059669,#06b6d4)] shadow-lg shadow-emerald-500/25" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </Form>
        <p className="mt-5 text-center text-xs font-medium text-stone-600">
          <Link href="/login" className="inline-flex min-h-11 items-center gap-1.5 font-extrabold text-violet-700 hover:text-violet-900 hover:underline">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
