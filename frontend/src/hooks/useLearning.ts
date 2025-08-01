import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathAPI, LearningPath } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Learning Paths Hook
export const useLearningPaths = (status?: string) => {
  return useQuery({
    queryKey: ['learning', 'paths', status],
    queryFn: () => learningPathAPI.getLearningPaths(status),
    staleTime: 5 * 60 * 1000,
  });
};

// Single Learning Path Hook
export const useLearningPath = (pathId: string) => {
  return useQuery({
    queryKey: ['learning', 'path', pathId],
    queryFn: () => learningPathAPI.getLearningPath(pathId),
    enabled: !!pathId,
    staleTime: 2 * 60 * 1000,
  });
};

// Content Recommendations Hook
export const useContentRecommendations = (params?: {
  topic?: string;
  difficulty?: string;
  content_type?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['learning', 'recommendations', params],
    queryFn: () => learningPathAPI.getRecommendations(params),
    staleTime: 10 * 60 * 1000,
  });
};

// Generate Learning Path Mutation
export const useGenerateLearningPath = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: learningPathAPI.generatePath,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'paths'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Refresh dashboard
      toast.success('Percorso di apprendimento generato con successo!');
    },
    onError: (error: any) => {
      toast.error('Errore nella generazione del percorso');
      console.error('Generate path error:', error);
    },
  });
};

// Update Progress Mutation
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ pathId, progressUpdate }: {
      pathId: string;
      progressUpdate: {
        module_id: string;
        completed: boolean;
        time_spent_minutes?: number;
        notes?: string;
      };
    }) => learningPathAPI.updateProgress(pathId, progressUpdate),
    onSuccess: (data, variables) => {
      // Refresh specific learning path
      queryClient.invalidateQueries({ 
        queryKey: ['learning', 'path', variables.pathId] 
      });
      // Refresh paths list
      queryClient.invalidateQueries({ queryKey: ['learning', 'paths'] });
      // Refresh dashboard for XP updates
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (data.xp_earned > 0) {
        toast.success(`Modulo completato! +${data.xp_earned} XP`);
      }
    },
    onError: (error: any) => {
      toast.error('Errore nell\'aggiornamento del progresso');
      console.error('Update progress error:', error);
    },
  });
};

// Generate Assessment Mutation
export const useGenerateAssessment = () => {
  return useMutation({
    mutationFn: learningPathAPI.generateAssessment,
    onSuccess: () => {
      toast.success('Assessment generato con successo!');
    },
    onError: (error: any) => {
      toast.error('Errore nella generazione dell\'assessment');
      console.error('Generate assessment error:', error);
    },
  });
};

// Submit Assessment Mutation
export const useSubmitAssessment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: learningPathAPI.submitAssessment,
    onSuccess: (data) => {
      // Refresh dashboard for XP updates
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (data.xp_earned) {
        toast.success(`Assessment completato! Punteggio: ${data.results.score}% (+${data.xp_earned} XP)`);
      } else {
        toast.success(`Assessment completato! Punteggio: ${data.results.score}%`);
      }
    },
    onError: (error: any) => {
      toast.error('Errore nell\'invio dell\'assessment');
      console.error('Submit assessment error:', error);
    },
  });
};
