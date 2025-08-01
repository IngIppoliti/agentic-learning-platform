import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  src?: string
  fallback: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

export function Avatar({ 
  src, 
  fallback, 
  size = 'md', 
  className,
  onClick 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl'
  }

  const initials = getInitials(fallback)

  return (
    <div 
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium cursor-pointer hover:scale-105 transition-transform',
        sizeClasses[size],
        className,
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {src ? (
        <Image
          src={src}
          alt={fallback}
          fill
          className="rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
