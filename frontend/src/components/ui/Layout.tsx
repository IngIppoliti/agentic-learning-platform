'use client'

import { ReactNode } from 'react'
import { useTranslation } from 'next-i18next'
import { useCurrentUser } from '@/hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

interface LayoutProps {
  children: ReactNode
  requireAuth?: boolean
  className?: string
}

export function Layout({ children, requireAuth = false, className = '' }: LayoutProps) {
  const { t } = useTranslation('common')
  const { data: user, isLoading, error } = useCurrentUser()

  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">{t('messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (requireAuth && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('messages.error')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('messages.auth_error')}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('buttons.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('messages.auth_required')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('messages.please_login')}
          </p>
          <a 
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('buttons.login')}
          </a>
        </div>
      </div>
    )
  }

  return <div className={className}>{children}</div>
}
