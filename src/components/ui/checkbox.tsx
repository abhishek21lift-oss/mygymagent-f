"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/** Drawn small, but the `after:` layer gives it a finger-sized
 * (~44px) tap area so it is not missed on a phone. */
function Checkbox({
 className,
 ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
 return (
 <CheckboxPrimitive.Root
 data-slot="checkbox"
 className={cn( "peer relative size-4 shrink-0 cursor-pointer rounded-sm border after:absolute after:-inset-3 border-input bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
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
