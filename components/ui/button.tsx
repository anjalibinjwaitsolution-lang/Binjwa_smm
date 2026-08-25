import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-gray-200 shadow-lg hover:shadow-xl",
        destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-lg hover:shadow-xl",
        outline: "border-2 border-white bg-transparent text-white hover:bg-white hover:text-black shadow-md",
        secondary: "bg-white text-black border border-gray-200 hover:bg-[#f5f5f5] transition-colors shadow-md hover:shadow-lg",
        ghost: "hover:bg-white/10 hover:text-white",
        link: "text-white underline-offset-4 hover:underline",
        accent:
          "bg-gradient-to-r from-[#ff6b4a] to-[#ffa726] text-white hover:shadow-[0_0_20px_rgba(255,107,74,0.4)] shadow-lg",
      },
      size: {
        default: "h-11 px-6 py-3 has-[>svg]:px-5",
        sm: "h-9 px-4 gap-1.5 has-[>svg]:px-3 text-xs",
        lg: "h-14 px-10 text-base has-[>svg]:px-8",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
