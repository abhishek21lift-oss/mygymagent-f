"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Dumbbell, Lock, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Please check your credentials and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="login-title" className="overflow-hidden rounded-[28px] border border-white/40 bg-white/85 shadow-[0_35px_90px_-40px_rgba(79,70,229,.55)] backdrop-blur-2xl">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f0c29_0%,#302b63_38%,#6d28d9_68%,#be185d_100%)] p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-fuchsia-400/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full bg-cyan-400/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Dumbbell className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.18em]">
              <Sparkles className="size-3" aria-hidden="true" /> Athletic Luxe
            </p>
            <h1 id="login-title" className="mt-1.5 font-serif text-2xl font-semibold tracking-tight">Welcome back</h1>
          </div>
        </div>
        <p className="relative mt-3 text-xs font-medium leading-5 text-white/75">Sign in to command your gym — members, money and momentum in one vivid cockpit.</p>
      </div>
      <div className="p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-sm font-bold text-stone-900">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
              <input id="login-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@yourgym.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-2xl border border-stone-200 bg-white/80 pl-10 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-600/30" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="login-password" className="text-sm font-bold text-stone-900">Password</label>
              <Link href="/forgot-password" className="min-h-11 inline-flex items-center rounded-lg px-1 text-xs font-bold text-violet-700 hover:text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
              <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full rounded-2xl border border-stone-200 bg-white/80 pl-10 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-600/30" />
            </div>
          </div>
          {error ? <p role="alert" className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 px-3 py-2.5 text-xs font-bold text-rose-700">{error}</p> : null}
          <button type="submit" disabled={isSubmitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-4 text-sm font-extrabold text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
            {isSubmitting ? "Signing in..." : "Sign in"}
            {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
          </button>
        </form>
        <p className="mt-5 text-center text-xs font-medium text-stone-600">
          Setting up a new gym?{" "}
          <Link href="/register" className="font-extrabold text-violet-700 hover:text-violet-900 hover:underline">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
