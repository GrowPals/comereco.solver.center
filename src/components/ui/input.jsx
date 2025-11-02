import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
          {React.cloneElement(icon, { className: 'h-5 w-5' })}
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 transition-all duration-200 focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-200/30 focus-visible:shadow-glow-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
          icon ? "pl-12" : "px-4",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
})
Input.displayName = "Input"

export { Input }
