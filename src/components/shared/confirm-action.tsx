"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConfirmActionProps = {
  /** The button that opens the confirmation. Rendered inline. */
  label: string
  title: string
  /** What the action will actually do, in the user's terms. */
  description: React.ReactNode
  confirmLabel?: string
  pendingLabel?: string
  successMessage: string
  /** Fallback when the API error carries no message of its own. */
  errorMessage: string
  onConfirm: () => Promise<unknown>
  variant?: "destructive" | "outline" | "default"
  size?: "sm" | "default"
  disabled?: boolean
}

/**
 * A one-step confirmation around an irreversible action.
 *
 * Cancelling a sale puts stock back, cancelling a transfer moves units
 * between branches, removing a role revokes access -- none of those should
 * sit one stray click away, and none of them can be undone from the UI.
 */
export function ConfirmAction({
  label,
  title,
  description,
  confirmLabel = "Confirm",
  pendingLabel = "Working...",
  successMessage,
  errorMessage,
  onConfirm,
  variant = "outline",
  size = "sm",
  disabled,
}: ConfirmActionProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  async function run() {
    setPending(true)
    try {
      await onConfirm()
      toast.success(successMessage)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Keep as is
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              aria-busy={pending}
              onClick={() => void run()}
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
