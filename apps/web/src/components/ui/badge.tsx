import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import {
  cva,
  type VariantProps,
} from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 text-caption font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/75 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary-hover",

        primary:
          "bg-primary text-primary-foreground [a]:hover:bg-primary-hover",

        neutral:
          "border-border bg-surface-hover text-secondary-foreground [a]:hover:bg-muted",

        secondary:
          "border-border bg-surface-hover text-secondary-foreground [a]:hover:bg-muted",

        success:
          "border-success/20 bg-success/10 text-success [a]:hover:bg-success/15",

        warning:
          "border-warning/20 bg-warning/10 text-warning [a]:hover:bg-warning/15",

        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive [a]:hover:bg-destructive/15",

        outline:
          "border-border bg-transparent text-foreground [a]:hover:bg-surface-hover",

        ghost:
          "bg-transparent text-muted-foreground [a]:hover:bg-surface-hover [a]:hover:text-foreground",

        link:
          "rounded-none px-0 text-primary underline-offset-4 hover:underline",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",

    props: mergeProps<"span">(
      {
        className: cn(
          badgeVariants({ variant }),
          className,
        ),
      },
      props,
    ),

    render,

    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }