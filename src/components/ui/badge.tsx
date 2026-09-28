import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badges.
 *
 * Tinted rather than filled, for the state variants. A filled red pill
 * on a page that also carries filled CTAs reads as a second action
 * rather than as a status; a tinted one with solved-ink type keeps the
 * two apart, which is the same reason the figure tiles only paint a
 * state rule when there is a state to report.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive-tint text-destructive [a&]:hover:bg-destructive/15",
        success: "border-transparent bg-success-tint text-success [a&]:hover:bg-success/15",
        warning: "border-transparent bg-warning-tint text-warning [a&]:hover:bg-warning/15",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
