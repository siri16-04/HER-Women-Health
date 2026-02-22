import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantStyles = {
  primary: 'bg-healing-700 hover:bg-healing-800 text-white disabled:bg-healing-300',
  secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-medium rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-healing-500 focus:ring-offset-2
        disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
