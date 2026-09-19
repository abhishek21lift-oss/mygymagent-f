"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 cursor-pointer rounded-[6px] border border-[#5c4f38] bg-gradient-to-b from-[#a99b78] to-[#e6dabc] shadow-[inset_0_2px_4px_rgba(40,25,10,0.5),0_1px_0_rgba(255,245,220,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6420] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gradient-to-b data-[state=checked]:from-[#e8c25e] data-[state=checked]:to-[#8a6420] data-[state=checked]:text-[#241a08]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="size-3.5" strokeWidth={3.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
