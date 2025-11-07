import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-[background,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
      "data-[state=checked]:bg-primary-600 data-[state=unchecked]:bg-border/80 dark:data-[state=checked]:bg-primary-500 dark:data-[state=unchecked]:bg-border/40",
      "shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_3px_rgba(3,8,22,0.7)]",
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white ring-1 ring-black/5 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        "shadow-[0_2px_6px_rgba(15,23,42,0.18)] dark:bg-[#0d1c35] dark:ring-white/12 dark:shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
