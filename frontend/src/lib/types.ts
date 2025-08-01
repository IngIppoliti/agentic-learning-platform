// Extend your existing API types
export * from '@/lib/api'

// Additional UI types
export interface UIState {
  isLoading: boolean
  error: string | null
  success: boolean
}

export interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export interface AvatarProps {
  src?: string
  fallback: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

// Form types
export interface LoginFormData {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

// Dashboard specific types
export interface DashboardStats {
  totalXP: number
  level: number
  streak: number
  achievements: number
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType
  href: string
  color: string
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type ThemeMode = 'light' | 'dark' | 'system'
export type Locale = 'it' | 'en' | 'es' | 'fr' | 'de'
