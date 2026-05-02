import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  asChild?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#FF6B35] text-white hover:bg-[#e85d29] shadow-sm active:scale-[0.98]',
  secondary: 'bg-[#f0f0ec] text-[#0f0f0e] hover:bg-[#e8e8e4] active:scale-[0.98]',
  ghost: 'bg-transparent text-[#5c5c58] hover:bg-[#f0f0ec] hover:text-[#0f0f0e]',
  outline: 'bg-transparent text-[#0f0f0e] border border-[#e8e8e4] hover:bg-[#f8f8f6] active:scale-[0.98]',
  danger: 'bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] active:scale-[0.98]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-[10px]',
  md: 'px-5 py-2.5 text-sm rounded-[12px]',
  lg: 'px-6 py-3.5 text-base rounded-[14px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
