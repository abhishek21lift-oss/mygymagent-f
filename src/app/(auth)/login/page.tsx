"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** The second factor is either a 6-digit TOTP code or one of the recovery
 * codes issued at enrolment; the backend accepts both in the same field. */
const MIN_SECOND_FACTOR_LENGTH = 6;

export default function LoginPage() {
 const router = useRouter();
 const { login, completeMfaLogin } = useAuth();
 const [email, setEmail] = React.useState("");
 const [password, setPassword] = React.useState("");
 const [error, setError] = React.useState("");
 const [isSubmitting, setIsSubmitting] = React.useState(false);
 // Non-null once the password was accepted but a second factor is owed.
 // Holding the challenge token here (and never in storage) keeps it to the
 // single tab that started the login, and it dies with a reload.
 const [mfaToken, setMfaToken] = React.useState<string | null>(null);
 const [code, setCode] = React.useState("");
 const codeInputRef = React.useRef<HTMLInputElement>(null);

 React.useEffect(() => {
 if (mfaToken) codeInputRef.current?.focus();
 }, [mfaToken]);

 function describe(err: unknown, fallback: string) {
 return err instanceof ApiError ? err.message : fallback;
 }

 async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault();
 setError("");
 if (!email.trim() || !password) {
 setError("Please enter your email and password.");
 return;
 }

 setIsSubmitting(true);
 try {
 const result = await login({ email: email.trim(), password });
 if (result.mfaRequired) {
 // No session yet: hold the challenge and ask for the code.
 setMfaToken(result.mfaToken);
 setPassword("");
 return;
 }
 router.replace("/dashboard");
 } catch (err) {
 setError(
 describe(err, "Unable to sign in. Please check your credentials and try again."),
 );
 } finally {
 setIsSubmitting(false);
 }
 }

 async function onSubmitCode(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault();
 setError("");
 const trimmed = code.trim();
 if (trimmed.length < MIN_SECOND_FACTOR_LENGTH) {
 setError("Enter the 6-digit code from your authenticator app, or a recovery code.");
 return;
 }
 if (!mfaToken) return;

 setIsSubmitting(true);
 try {
 await completeMfaLogin(mfaToken, trimmed);
 router.replace("/dashboard");
 } catch (err) {
 // The challenge is single-use on success only, so a wrong code can be
 // retried against the same token until it expires. An expired or
 // already-spent token sends the user back to the password step.
 const apiError = err instanceof ApiError ? err : null;
 if (apiError?.status === 401) {
 setError("That code was not accepted. Check your authenticator app and try again.");
 } else {
 setError(describe(err, "Unable to verify that code. Please try again."));
 }
 setCode("");
 codeInputRef.current?.focus();
 } finally {
 setIsSubmitting(false);
 }
 }

 function startOver() {
 setMfaToken(null);
 setCode("");
 setError("");
 setPassword("");
 }

 if (mfaToken) {
 return (
 <section aria-labelledby="mfa-title" className="overflow-hidden rounded-xl">
 <div className="border-b px-6 py-5">
 <h1 id="mfa-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
 <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
 Two-step verification
 </h1>
 <p className="mt-1 text-sm text-muted-foreground">
 Enter the 6-digit code from your authenticator app. You can use one of your
 recovery codes instead if you do not have your device.
 </p>
 </div>
 <div className="p-6">
 <form onSubmit={onSubmitCode} className="flex flex-col gap-4" noValidate>
 <div className="flex flex-col gap-1.5">
 <label htmlFor="mfa-code" className="text-sm font-medium">
 Verification code
 </label>
 <div className="relative">
 <KeyRound
 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <Input
 id="mfa-code"
 ref={codeInputRef}
 name="code"
 type="text"
 inputMode="text"
 // `one-time-code` lets password managers and iOS fill the
 // TOTP directly; a recovery code is typed into the same box.
 autoComplete="one-time-code"
 autoCapitalize="characters"
 spellCheck={false}
 placeholder="123456"
 value={code}
 onChange={(e) => setCode(e.target.value)}
 className="h-11 pl-10 font-mono tracking-widest"
 required
 />
 </div>
 </div>
 {error ? (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 ) : null}
 <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="h-11 w-full">
 {isSubmitting ? "Verifying..." : "Verify and sign in"}
 {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
 </Button>
 <Button type="button" variant="ghost" onClick={startOver} className="h-11 w-full">
 Use a different account
 </Button>
 </form>
 </div>
 </section>
 );
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
