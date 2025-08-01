// frontend/src/hooks/useDashboard.ts (la tua versione corretta)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI, DashboardOverview, Achievement, UserProgress } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Dashboard Overview Hook
export const useDashboardOverview = () => {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: dashboardAPI.getOverview,
    staleTime: 5 * 60 * 1000, // 5 minuti
    gcTime: 10 * 60 * 1000, // 10 minuti (era cacheTime in v4)
    refetchOnWindowFocus: false,
    retry: 2, // 🆕 Aggiungi retry logic
  });
};

// XP Details Hook
export const useXPDetails = () => {
  return useQuery({
    queryKey: ['dashboard', 'xp-details'],
    queryFn: dashboardAPI.getXPDetails,
    staleTime: 2 * 60 * 1000, // 2 minuti
    gcTime: 5 * 60 * 1000, // 🔄 Aggiornato
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Achievements Hook
export const useAchievements = (params?: { show_locked?: boolean; category?: string }) => {
  return useQuery({
    queryKey: ['dashboard', 'achievements', params],
    queryFn: () => dashboardAPI.getAchievements(params),
    staleTime: 10 * 60 * 1000, // 10 minuti
    gcTime: 15 * 60 * 1000, // 🔄 Aggiornato
    retry: 2,
  });
};

// Weekly Stats Hook
export const useWeeklyStats = (weeksBack: number = 4) => {
  return useQuery({
    queryKey: ['dashboard', 'weekly-stats', weeksBack],
    queryFn: () => dashboardAPI.getWeeklyStats(weeksBack),
    staleTime: 30 * 60 * 1000, // 30 minuti
    gcTime: 60 * 60 * 1000, // 🔄 Aggiornato - 1 ora
    retry: 2,
  });
};

// Update Goals Mutation
export const useUpdateGoals = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dashboardAPI.updateGoals,
    onSuccess: (data) => {
      // Invalidate e refetch dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Obiettivi aggiornati con successo!');
    },
    onError: (error: any) => {
      toast.error('Errore nell\'aggiornamento degli obiettivi');
      console.error('Update goals error:', error);
    },
  });
};

// Combined Dashboard Hook (per componenti che necessitano di dati multipli)
export const useDashboardData = () => {
  const overview = useDashboardOverview();
  const xpDetails = useXPDetails();
  const achievements = useAchievements({ show_locked: false });
  const weeklyStats = useWeeklyStats();

  return {
    overview,
    xpDetails,
    achievements,
    weeklyStats,
    isLoading: overview.isLoading || xpDetails.isLoading,
    isError: overview.isError || xpDetails.isError,
    // 🆕 Aggiungi anche isSuccess per UX migliore
    isSuccess: overview.isSuccess && xpDetails.isSuccess,
    refetchAll: () => {
      overview.refetch();
      xpDetails.refetch();
      achievements.refetch();
      weeklyStats.refetch();
    }
  };
};

// 🆕 BONUS: Hook per invalidare cache dashboard
export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
};
