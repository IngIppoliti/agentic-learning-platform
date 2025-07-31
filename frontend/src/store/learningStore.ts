import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { learningPathAPI, LearningPath } from '@/lib/api';

interface LearningState {
  learningPaths: LearningPath[];
  currentPath: LearningPath | null;
  currentModule: any | null;
  isLoading: boolean;
  
  // Actions
  fetchLearningPaths: () => Promise<void>;
  generateLearningPath: (pathData: any) => Promise<any>;
  setCurrentPath: (pathId: string) => Promise<void>;
  setCurrentModule: (module: any) => void;
  updateProgress: (pathId: string, moduleId: string, progress: number) => Promise<void>;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      learningPaths: [],
      currentPath: null,
      currentModule: null,
      isLoading: false,

      fetchLearningPaths: async () => {
        try {
          set({ isLoading: true });
          const paths = await learningPathAPI.getLearningPaths();
          set({ learningPaths: paths, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      generateLearningPath: async (pathData: any) => {
        try {
          set({ isLoading: true });
          const response = await learningPathAPI.generatePath(pathData);
          set({ isLoading: false });
          
          // Refresh paths after generation
          await get().fetchLearningPaths();
          
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setCurrentPath: async (pathId: string) => {
        try {
          set({ isLoading: true });
          const path = await learningPathAPI.getLearningPath(pathId);
          set({ 
            currentPath: path, 
            currentModule: path.modules?.[0] || null,
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setCurrentModule: (module: any) => {
        set({ currentModule: module });
      },

      updateProgress: async (pathId: string, moduleId: string, progress: number) => {
        try {
          await learningPathAPI.updateProgress(pathId, moduleId, progress);
          
          // Update local state
          const currentPath = get().currentPath;
          if (currentPath && currentPath.id === pathId) {
            const updatedModules = currentPath.modules.map(module =>
              module.module_id === moduleId 
                ? { ...module, progress }
                : module
            );
            
            set({ 
              currentPath: { 
                ...currentPath, 
                modules: updatedModules 
              }
            });
          }
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'learning-storage',
      partialize: (state) => ({ 
        currentPath: state.currentPath,
        currentModule: state.currentModule
      }),
    }
  )
);
