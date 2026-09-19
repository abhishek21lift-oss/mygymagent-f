"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.5rem] w-11 shrink-0 cursor-pointer items-center rounded-full border border-[#2b2415] bg-gradient-to-b from-[#6b5d42] to-[#4a3f2a] px-0.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6),0_1px_0_rgba(255,245,220,0.5)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#8a6420] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gradient-to-b data-[state=checked]:from-[#e8c25e] data-[state=checked]:to-[#8a6420]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full border border-[#4a3f2a] bg-[radial-gradient(circle_at_35%_30%,#fffdf2,#c9b98f_60%,#8f8163)] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_#fff] ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-1px)] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
