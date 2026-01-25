import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-full w-full bg-transparent px-0 py-0 text-base md:text-lg transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-0 shadow-none outline-none ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }
