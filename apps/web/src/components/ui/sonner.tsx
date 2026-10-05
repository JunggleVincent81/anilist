"use client"

import type { CSSProperties } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import {
  Toaster as Sonner,
  type ToasterProps,
} from "sonner"

const Toaster = ({
  theme = "dark",
  position = "bottom-right",
  toastOptions,
  style,
  ...props
}: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      position={position}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-success" />
        ),

        info: (
          <InfoIcon className="size-4 text-brand-accent" />
        ),

        warning: (
          <TriangleAlertIcon className="size-4 text-warning" />
        ),

        error: (
          <OctagonXIcon className="size-4 text-destructive" />
        ),

        loading: (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--surface-elevated)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-lg)",
          ...style,
        } as CSSProperties
      }
      toastOptions={{
        ...toastOptions,

        classNames: {
          toast:
            "border-border! bg-surface-elevated! text-foreground! shadow-xl! shadow-black/25!",

          title:
            "text-sm! font-medium! text-foreground!",

          description:
            "text-small! text-muted-foreground!",

          actionButton:
            "bg-primary! text-primary-foreground! hover:bg-primary-hover!",

          cancelButton:
            "bg-surface-hover! text-foreground!",

          success:
            "border-success/25!",

          info:
            "border-brand-accent/25!",

          warning:
            "border-warning/25!",

          error:
            "border-destructive/25!",

          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }