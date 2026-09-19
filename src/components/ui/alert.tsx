"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "skeuo-plate relative w-full rounded-[12px] border border-[#6b5d42] p-4 shadow-[inset_0_1px_0_#fff,0_6px_16px_rgba(0,0,0,0.35)] [&>svg]:absolute [&>svg]:size-4 [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11",
  {
    variants: {
      variant: {
        default: "text-[#2b2114]",
        warning:
          "border-[#6b5226] bg-gradient-to-b from-[#ffe9a8] to-[#d9a53a] text-[#3a2a0c] [&>svg]:text-[#6b4c10]",
        destructive:
          "border-[#4a0f0a] bg-gradient-to-b from-[#ffb3a6] to-[#c04534] text-[#2b0a06] [&>svg]:text-[#5a130c]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}

export { Alert, alertVariants, AlertDescription }
