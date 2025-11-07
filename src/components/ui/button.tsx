import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary touch-manipulation active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-[#00C16A] text-[#0F1115] hover:bg-[#00A85B] active:scale-[0.98] font-semibold",
        destructive:
          "bg-[#ff6b6b] text-white hover:bg-[#ff5252] active:scale-[0.98]",
        outline:
          "border border-[#27272A] bg-transparent text-[#F4F4F5] hover:bg-[#181A1F] hover:border-[#27272A] active:scale-[0.98]",
        secondary:
          "bg-[#181A1F] text-[#F4F4F5] hover:bg-[#27272A] active:scale-[0.98]",
        ghost:
          "text-[#A1A1AA] hover:bg-[#181A1F] hover:text-[#F4F4F5] active:scale-[0.98]",
        link: "text-[#00C16A] underline-offset-4 hover:underline hover:text-[#00A85B] p-0",
      },
      size: {
        default: "h-11 min-h-[44px] px-4 py-2 has-[>svg]:px-3",
        sm: "h-10 min-h-[44px] rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 min-h-[44px] rounded-md px-6 has-[>svg]:px-4",
        icon: "size-11 min-w-[44px] min-h-[44px]",
        "icon-sm": "size-10 min-w-[44px] min-h-[44px]",
        "icon-lg": "size-12 min-w-[44px] min-h-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
