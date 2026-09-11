"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, KeyRound, Send, Sparkles } from "lucide-react";

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
import { api } from "@/lib/api/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", values);
    } finally {
      // Always show the same confirmation, whether or not the account
      // exists -- matches the backend's anti-enumeration behavior.
      setIsSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border-white/40 bg-white/85 py-0 shadow-[0_35px_90px_-40px_rgba(79,70,229,.55)] backdrop-blur-2xl">
      <CardHeader className="relative overflow-hidden bg-[linear-gradient(135deg,#172554_0%,#3730a3_45%,#a21caf_100%)] p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-cyan-400/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.18em]">
              <Sparkles className="size-3" aria-hidden="true" /> Recovery
            </p>
            <CardTitle className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-white">Reset your password</CardTitle>
          </div>
        </div>
        <CardDescription className="relative mt-3 text-xs font-medium text-white/75">We&apos;ll email you a link if the account exists.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {submitted ? (
          <div className="rounded-[20px] border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-5 text-center" role="status">
            <p className="text-sm font-extrabold text-stone-900">Check your inbox</p>
            <p className="mt-1 text-xs font-medium leading-5 text-stone-600">
              If an account exists for that email, a reset link is on its way.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-stone-900">Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="you@yourgym.com" {...field} className="min-h-11 rounded-2xl focus-visible:ring-violet-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="min-h-11 w-full rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] shadow-lg shadow-violet-500/25" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send reset link"}
                {!isSubmitting && <Send className="ml-2 size-4" aria-hidden="true" />}
              </Button>
            </form>
          </Form>
        )}
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
