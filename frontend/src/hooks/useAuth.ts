import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI, type User } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { toast } from 'react-hot-toast'

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: authAPI.getCurrentUser,
    enabled: !!Cookies.get('access_token'),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
}

export const useLogin = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.login(email, password),
    onSuccess: (data) => {
      Cookies.set('access_token', data.access_token, { expires: 7 })
      queryClient.setQueryData(['auth', 'current-user'], data.user)
      toast.success(`Benvenuto, ${data.user.full_name || data.user.username}!`)
      router.push('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Errore durante il login')
    },
  })
}

export const useLogout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      Cookies.remove('access_token')
      queryClient.clear()
      toast.success('Logout effettuato con successo')
      router.push('/login')
    },
    onError: () => {
      Cookies.remove('access_token')
      queryClient.clear()
      router.push('/login')
    },
  })
}
