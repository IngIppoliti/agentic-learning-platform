import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authAPI, User } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          const { access_token, user } = await authAPI.login(email, password);
          
          // Store token in cookie
          Cookies.set('access_token', access_token, { 
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' 
          });
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, username: string) => {
        try {
          set({ isLoading: true });
          
          const { access_token, user } = await authAPI.register(email, password, username);
          
          Cookies.set('access_token', access_token, { 
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove('access_token');
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      },

      checkAuth: async () => {
        try {
          const token = Cookies.get('access_token');
          
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          const user = await authAPI.getCurrentUser();
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
        } catch (error) {
          // Token invalid, remove it
          Cookies.remove('access_token');
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
