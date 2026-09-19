import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "skeuo-inset placeholder:text-[#6b5732] flex field-sizing-content min-h-16 w-full rounded-[9px] border px-3 py-2 text-sm font-medium transition-[box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-[#8a6420] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
