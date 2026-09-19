"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <section aria-labelledby="login-title" className="overflow-hidden rounded-xl">
      <div className="border-b px-6 py-5">
        <h1 id="login-title" className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage members, billing and operations.</p>
      </div>
      <div className="p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="login-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@yourgym.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="login-password" className="text-sm font-medium">Password</label>
              <Link href="/forgot-password" className="inline-flex min-h-8 items-center rounded-md px-1 text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10" required />
            </div>
          </div>
          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="h-11 w-full">
            {isSubmitting ? "Signing in..." : "Sign in"}
            {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Setting up a new gym?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
