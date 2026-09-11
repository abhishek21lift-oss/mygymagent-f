"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, Building2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { organizationName: "", firstName: "", lastName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setIsSubmitting(true);
    try {
      await register(values);
      router.push("/onboarding");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border-white/40 bg-white/85 py-0 shadow-[0_35px_90px_-40px_rgba(79,70,229,.55)] backdrop-blur-2xl">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#064e3b_0%,#059669_35%,#06b6d4_70%,#7c3aed_100%)] p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full bg-amber-300/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Building2 className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.18em]">
              <Sparkles className="size-3" aria-hidden="true" /> New gym launch
            </p>
            <CardTitle className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-white">Set up your gym</CardTitle>
          </div>
        </div>
        <CardDescription className="relative mt-3 text-xs font-medium leading-5 text-white/80">Creates your organization and first branch, then takes you to the setup wizard.</CardDescription>
      </div>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-stone-900">Gym / organization name</FormLabel>
                  <FormControl>
                    <Input placeholder="Iron Paradise Gym" {...field} className="min-h-11 rounded-2xl focus-visible:ring-violet-600" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-stone-900">First name</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} className="min-h-11 rounded-2xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-stone-900">Last name</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} className="min-h-11 rounded-2xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-stone-900">Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} className="min-h-11 rounded-2xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-stone-900">Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} className="min-h-11 rounded-2xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="min-h-11 w-full rounded-2xl bg-[linear-gradient(105deg,#059669,#06b6d4_55%,#7c3aed)] shadow-lg shadow-emerald-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <ArrowRight className="ml-2 size-4" aria-hidden="true" />}
            </Button>
          </form>
        </Form>
        <p className="mt-5 text-center text-xs font-medium text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-extrabold text-violet-700 hover:text-violet-900 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
