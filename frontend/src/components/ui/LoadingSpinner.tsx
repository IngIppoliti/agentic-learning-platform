import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'blue' | 'white' | 'gray'
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  color = 'blue' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600'
  }

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300',
        `border-t-${color === 'blue' ? 'blue-600' : color === 'white' ? 'white' : 'gray-600'}`,
        sizeClasses[size],
        className
      )} 
    />
  )
}
