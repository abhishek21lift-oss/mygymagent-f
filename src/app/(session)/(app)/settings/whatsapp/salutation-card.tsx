"use client"

import * as React from "react"
import { MessageSquareQuote, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/error-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import {
  useUpdateWhatsappProfile,
  useWhatsappProfile,
  type Salutation,
} from "@/lib/hooks/use-whatsapp-automation"

const SALUTATIONS: readonly Salutation[] = ["Dear", "Hello", "Respected", "Hi", "Hey", "Greetings"]

export function SalutationCard({ canManage }: { canManage: boolean }) {
  const profileQuery = useWhatsappProfile()
  const update = useUpdateWhatsappProfile()
  const current = profileQuery.data?.salutation
  const [pending, setPending] = React.useState<Salutation | null>(null)

  function choose(value: Salutation) {
    if (value === current || update.isPending) return
    setPending(value)
    update.mutate(
      { salutation: value },
      {
        onSuccess: () => toast.success(`Salutation set to ${value}`),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "Could not save salutation."),
        onSettled: () => setPending(null),
      },
    )
  }

  return (
    <Card className="overflow-hidden border-border bg-card dark:bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
            <MessageSquareQuote className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-950 dark:text-stone-50">
              Customer salutation
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              How messages greet your members. Replaces an existing greeting rather than repeating it.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {profileQuery.isLoading ? (
          <div className="flex flex-wrap gap-3" role="status" aria-label="Loading salutation">
            {SALUTATIONS.map((option) => (
              <Skeleton key={option} className="h-11 w-28 rounded-lg" />
            ))}
          </div>
        ) : profileQuery.isError ? (
          <ErrorState onRetry={() => void profileQuery.refetch()} />
        ) : (
          <fieldset disabled={!canManage || update.isPending}>
            <legend className="sr-only">Customer salutation</legend>
            <div className="flex flex-wrap gap-3">
              {SALUTATIONS.map((option) => {
                const checked = current === option
                const saving = pending === option && update.isPending
                return (
                  <label
                    key={option}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${
                      checked
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-stone-200 bg-card text-stone-700 hover:border-stone-300 dark:text-stone-300"
                    } ${canManage ? "" : "cursor-not-allowed opacity-60"}`}
                  >
                    <input
                      type="radio"
                      name="salutation"
                      value={option}
                      checked={checked}
                      onChange={() => choose(option)}
                      disabled={!canManage || update.isPending}
                      className="size-4 accent-emerald-500"
                    />
                    {option}
                    {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                  </label>
                )
              })}
            </div>
            <Label className="sr-only">Selected salutation</Label>
          </fieldset>
        )}
      </CardContent>
    </Card>
  )
}