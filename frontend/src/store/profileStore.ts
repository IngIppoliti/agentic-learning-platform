import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { profileAPI, UserProfile } from '@/lib/api';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  onboardingStep: number;
  onboardingData: Record<string, any>;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  analyzeProfile: (analysisData: any) => Promise<any>;
  
  // Onboarding
  setOnboardingStep: (step: number) => void;
  setOnboardingData: (data: Record<string, any>) => void;
  resetOnboarding: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      onboardingStep: 1,
      onboardingData: {},

      fetchProfile: async () => {
        try {
          set({ isLoading: true });
          const profile = await profileAPI.getProfile();
          set({ profile, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateProfile: async (profileData: Partial<UserProfile>) => {
        try {
          set({ isLoading: true });
          const updatedProfile = await profileAPI.updateProfile(profileData);
          set({ profile: updatedProfile, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      analyzeProfile: async (analysisData: any) => {
        try {
          set({ isLoading: true });
          const response = await profileAPI.analyzeProfile(analysisData);
          set({ isLoading: false });
          
          // Refresh profile after analysis
          await get().fetchProfile();
          
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setOnboardingStep: (step: number) => {
        set({ onboardingStep: step });
      },

      setOnboardingData: (data: Record<string, any>) => {
        const currentData = get().onboardingData;
        set({ onboardingData: { ...currentData, ...data } });
      },

      resetOnboarding: () => {
        set({ onboardingStep: 1, onboardingData: {} });
      },
    }),
    {
      name: 'profile-storage',
      partialize: (state) => ({ 
        profile: state.profile,
        onboardingStep: state.onboardingStep,
        onboardingData: state.onboardingData
      }),
    }
  )
);
