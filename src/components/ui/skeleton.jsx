import React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-lg bg-neutral-200/60 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent", className)}
      {...props} />
  );
}

export { Skeleton }