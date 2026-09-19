import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "skeuo-inset file:text-foreground placeholder:text-[#6b5732] selection:bg-[#c99b3f] selection:text-[#241a08] flex h-10 w-full min-w-0 rounded-[9px] border px-3.5 py-2 text-sm font-medium transition-all outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold",
        "focus-visible:ring-2 focus-visible:ring-[#8a6420] focus-visible:ring-offset-1",
        "aria-invalid:border-[#a92a20] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
