import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A field is a well, not a box: a sunken ground, no hard edge until you
 * touch it, then the section's own hue takes the border and the ring.
 * The material lives in globals.css against `[data-slot="input"]`; this
 * is layout only.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
 return (
 <input
 type={type}
 data-slot="input"
 className={cn(
 "file:text-foreground placeholder:text-muted-foreground flex h-11 w-full min-w-0 border px-4 py-2 text-sm transition-all duration-200 outline-none",
 "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
 "aria-invalid:border-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
 className,
 )}
 {...props}
 />
 )
}

export { Input }
