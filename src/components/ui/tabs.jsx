import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base styles - sin sombras
      "inline-flex h-12 items-center justify-center rounded-xl bg-muted/10 p-1.5 gap-1",
      // Dark mode
      "dark:bg-muted/5",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles - sin sombras, sin bordes duros
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium",
      "transition-all duration-200",

      // Inactive state - text muted
      "text-muted-foreground",

      // Hover state - color pastel
      "hover:text-foreground/80",

      // Active state - gradiente pastel, sin sombras
      "data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/20 data-[state=active]:to-primary/10",
      "data-[state=active]:text-primary dark:data-[state=active]:from-primary/15 dark:data-[state=active]:to-primary/5",
      "data-[state=active]:font-semibold",

      // Focus state
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",

      // Disabled state
      "disabled:pointer-events-none disabled:opacity-50",

      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
