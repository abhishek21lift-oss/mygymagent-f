import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "skeuo-sheen inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm tracking-[-0.01em] transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#8a6420] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8ddbd] active:translate-y-[2px] cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "font-bold",
        destructive: "font-bold",
        outline: "font-bold",
        secondary: "font-bold",
        ghost: "border border-[#6b5d42]/60 bg-gradient-to-b from-[#efe6cc]/60 to-[#c9b98f]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
        link: "border-none shadow-none bg-none underline-offset-4 hover:underline text-[#5a4416] dark:text-[#e8c25e]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[0.68rem] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[0.82rem] px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
