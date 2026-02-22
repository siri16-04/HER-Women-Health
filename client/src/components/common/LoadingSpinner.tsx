interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white'
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

const colorStyles = {
  primary: 'border-clinical-600 border-t-transparent',
  white: 'border-white border-t-transparent',
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`
        inline-block rounded-full border-2 animate-spin
        ${sizeStyles[size]}
        ${colorStyles[color]}
      `}
      role="status"
      aria-label="Loading"
    />
  )
}
