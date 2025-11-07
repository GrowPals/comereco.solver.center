import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-60",
      "data-[state=unchecked]:bg-gradient-to-b data-[state=unchecked]:from-white data-[state=unchecked]:to-neutral-100",
      "data-[state=unchecked]:border-neutral-200 data-[state=unchecked]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_4px_10px_rgba(15,23,42,0.15)]",
      "data-[state=checked]:bg-gradient-to-b data-[state=checked]:from-white data-[state=checked]:to-neutral-50",
      "data-[state=checked]:border-neutral-300 data-[state=checked]:shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_-2px_4px_rgba(0,0,0,0.1)]",
      "dark:data-[state=unchecked]:from-[rgba(22,32,50,0.8)] dark:data-[state=unchecked]:to-[rgba(10,16,28,0.9)]",
      "dark:data-[state=unchecked]:border-white/15 dark:data-[state=unchecked]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_4px_12px_rgba(0,0,0,0.75)]",
      "dark:data-[state=checked]:from-[rgba(94,162,255,0.95)] dark:data-[state=checked]:to-[rgba(62,124,255,0.95)]",
      "dark:data-[state=checked]:border-primary-300 dark:data-[state=checked]:shadow-[0_8px_20px_rgba(32,102,255,0.45),inset_0_-2px_6px_rgba(0,0,0,0.45)]",
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full transition-all duration-300 ease-out",
        "bg-gradient-to-b from-neutral-700 to-neutral-800 ring-1 ring-neutral-800",
        "shadow-[0_3px_8px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.8)]",
        "data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5",
        "data-[state=checked]:from-neutral-700 data-[state=checked]:to-neutral-900 data-[state=checked]:ring-neutral-900 data-[state=checked]:shadow-[0_3px_8px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.7)]",
        "dark:bg-gradient-to-b dark:from-neutral-100 dark:to-white",
        "dark:ring-white/40 dark:data-[state=checked]:ring-white/70",
        "dark:shadow-[0_3px_8px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)]",
        "dark:data-[state=checked]:shadow-[0_4px_10px_rgba(32,102,255,0.45),0_0_0_1px_rgba(255,255,255,0.6)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
