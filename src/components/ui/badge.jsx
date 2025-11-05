import * as React from "react"
import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-gray-900 text-white hover:bg-gray-900/80",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-100/80",
    destructive: "bg-red-600 text-white hover:bg-red-600/80",
    outline: "text-gray-950 border border-gray-200",
    success: "bg-emerald-600 text-white",
    warning: "bg-orange-500 text-white",
    info: "bg-blue-500 text-white",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
