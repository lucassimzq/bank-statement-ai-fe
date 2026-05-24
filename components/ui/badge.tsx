import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline"
}

export function Badge({ className = "", variant = "secondary", children, ...props }: BadgeProps) {
  const base = "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors"
  const variants = {
    default:   "bg-primary text-primary-foreground",
    secondary: "bg-muted text-muted-foreground",
    outline:   "border border-border text-muted-foreground",
  }
  return (
    <span className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  )
}
