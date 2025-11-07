import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
      "data-[state=unchecked]:bg-neutral-200/80 data-[state=unchecked]:border-border/60",
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary-400 data-[state=checked]:to-primary-600",
      "dark:data-[state=unchecked]:bg-white/10 dark:data-[state=unchecked]:border-white/10",
      "dark:data-[state=checked]:from-primary-300 dark:data-[state=checked]:to-primary-500",
      "shadow-[inset_0_2px_6px_rgba(15,23,42,0.18)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.55)]",
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white ring-1 ring-black/5 transition-all duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        "shadow-[0_3px_8px_rgba(15,23,42,0.24)] data-[state=checked]:ring-primary-100",
        "dark:bg-neutral-900 dark:ring-white/20 dark:data-[state=checked]:bg-white",
        "dark:data-[state=unchecked]:bg-neutral-200 dark:data-[state=unchecked]:ring-white/40"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
