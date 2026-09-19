import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[7px] border px-2 py-0.5 text-[10px] font-extrabold w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3 [&>svg]:pointer-events-none uppercase tracking-[0.06em] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.3)] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-[#4a360f] bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#8a6420] text-[#241a08] [a&]:hover:brightness-110",
        secondary:
          "border-[#4a3f2a] bg-gradient-to-b from-[#f2ede0] to-[#a89a76] text-[#2e2313] [a&]:hover:brightness-105",
        destructive:
          "border-[#4a0f0a] bg-gradient-to-b from-[#ffb3a6] via-[#a92a20] to-[#7a1a14] text-[#fff3e8] [a&]:hover:brightness-110",
        success:
          "border-[#1d3a24] bg-gradient-to-b from-[#bfe6c4] via-[#4d9a5f] to-[#2a5a35] text-[#f2fff2]",
        warning:
          "border-[#4a360f] bg-gradient-to-b from-[#ffe9a8] via-[#d9a53a] to-[#8a6420] text-[#241a08]",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
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
