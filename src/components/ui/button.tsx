import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline:
          'border border-primary/30 bg-transparent text-primary hover:bg-soft hover:border-primary/50',
        ghost: 'bg-transparent text-fg-2 hover:bg-bg-alt hover:text-foreground',
        soft: 'bg-soft text-primary hover:bg-primary/15',
        secondary:
          'border border-border bg-bg-alt text-foreground hover:bg-bg-inset hover:border-border-strong',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-9 px-4 text-[13px]',
        default: 'h-11 px-6 text-[15px]',
        lg: 'h-12 px-7 text-base',
        xl: 'h-14 px-8 text-[17px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}