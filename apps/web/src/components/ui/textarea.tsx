import * as React from "react"
import { cn } from "cn"

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content flex min-h-24 w-full resize-y rounded-md border border-input bg-surface px-3 py-2.5 text-base text-foreground shadow-sm shadow-black/5 transition-[color,background-color,border-color,box-shadow] outline-none placeholder:text-muted-foreground selection:bg-primary/30 selection:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/75 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }