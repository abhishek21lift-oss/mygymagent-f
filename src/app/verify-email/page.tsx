"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react"

import { api, ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type State =
 | { kind: "idle" }
 | { kind: "working" }
 | { kind: "done" }
 | { kind: "failed"; message: string }

/**
 * Spends the token from a verification email.
 *
 * POST /auth/verify-email existed with nowhere to send anyone: the email
 * carried a link to a route that was never built, so every address stayed
 * unverified no matter what the recipient clicked.
 *
 * The exchange is on a button rather than on mount. Link scanners in mail
 * clients and corporate gateways follow URLs before a person ever does,
 * and a single-use token spent by a scanner is a token the member finds
 * already used.
 */
function VerifyEmailInner() {
 const params = useSearchParams()
 const token = params.get("token") ?? ""
 const [state, setState] = React.useState<State>({ kind: "idle" })

 async function verify() {
  setState({ kind: "working" })
  try {
   await api.post("/auth/verify-email", { token })
   setState({ kind: "done" })
  } catch (error) {
   setState({
    kind: "failed",
    message:
     error instanceof ApiError
      ? error.message
      : "This link could not be used. It may have expired or already been spent.",
   })
  }
 }

 return (
  <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
   <Card>
    <CardContent className="flex flex-col gap-4 p-6">
     <h1 className="text-xl font-black">Confirm your email</h1>

     {!token && (
      <p role="alert" className="text-sm text-muted-foreground">
       This link is missing its token. Open the link from your email again, or ask
       for a new one.
      </p>
     )}

     {token && state.kind === "idle" && (
      <>
       <p className="text-sm text-muted-foreground">
        Confirming proves the address is yours, so password resets and receipts
        reach you.
       </p>
       <Button type="button" onClick={() => void verify()}>Confirm my email</Button>
      </>
     )}

     {state.kind === "working" && (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
       <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Confirming...
      </p>
     )}

     {state.kind === "done" && (
      <div className="flex flex-col gap-3">
       <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
        <CheckCircle2 className="size-4" aria-hidden="true" /> Your email is confirmed.
       </p>
       <Button asChild><Link href="/login">Sign in</Link></Button>
      </div>
     )}

     {state.kind === "failed" && (
      <div className="flex flex-col gap-3">
       <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-destructive">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {state.message}
       </p>
       <Button type="button" variant="outline" onClick={() => void verify()}>Try again</Button>
      </div>
     )}
    </CardContent>
   </Card>
  </main>
 )
}

export default function VerifyEmailPage() {
 // useSearchParams needs a Suspense boundary to keep this route static.
 return (
  <React.Suspense fallback={<main className="p-6" />}>
   <VerifyEmailInner />
  </React.Suspense>
 )
}
