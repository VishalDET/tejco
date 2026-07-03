import * as React from "react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "accent" | "white"
  layout?: "inline" | "container" | "fullscreen"
  text?: string
}

export function Loader({
  size = "md",
  variant = "primary",
  layout = "container",
  text = "Loading...",
  className,
  ...props
}: LoaderProps) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-10 w-10 border-[3px]",
    lg: "h-16 w-16 border-4",
  }

  const variantClasses = {
    primary: "border-primary/20 border-t-primary",
    secondary: "border-secondary/20 border-t-secondary",
    accent: "border-accent/20 border-t-accent",
    white: "border-white/20 border-t-white",
  }

  const layoutClasses = {
    inline: "inline-flex items-center gap-2",
    container: "flex flex-col items-center justify-center min-h-[250px] w-full gap-3 p-6",
    fullscreen: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md gap-4",
  }

  const spinner = (
    <div
      className={cn(
        "animate-spin rounded-full border-solid",
        sizeClasses[size],
        variantClasses[variant]
      )}
    />
  )

  if (layout === "inline") {
    return (
      <div className={cn(layoutClasses.inline, className)} {...props}>
        {spinner}
        {text && <span className="text-sm font-medium text-muted-foreground">{text}</span>}
      </div>
    )
  }

  return (
    <div className={cn(layoutClasses[layout], className)} {...props}>
      <div className="relative flex items-center justify-center">
        {size !== "sm" && (
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse",
              variant === "primary" && "bg-primary",
              variant === "secondary" && "bg-secondary",
              variant === "accent" && "bg-accent",
              variant === "white" && "bg-white"
            )}
          />
        )}
        {spinner}
      </div>
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide mt-2">
          {text}
        </p>
      )}
    </div>
  )
}
