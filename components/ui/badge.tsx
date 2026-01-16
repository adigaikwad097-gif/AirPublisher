import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          {
            'bg-muted text-foreground': variant === 'default',
            'bg-primary/20 text-primary': variant === 'primary',
            'bg-green-500/20 text-green-400': variant === 'success',
            'bg-yellow-500/20 text-yellow-400': variant === 'warning',
            'bg-red-500/20 text-red-400': variant === 'danger',
            'border border-border bg-transparent': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }

