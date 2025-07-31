import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'skill' | 'community';
  earnedAt?: Date;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: 'lesson' | 'milestone' | 'streak' | 'community';
  earnedAt: Date;
}

interface GamificationState {
  xp: number;
  level: number;
  badges: Badge[];
  achievements: Achievement[];
  streak: number;
  lastActivityDate: Date | null;
  
  // Actions
  addXP: (points: number, reason: string) => void;
  earnBadge: (badge: Badge) => void;
  addAchievement: (achievement: Achievement) => void;
  updateStreak: () => void;
  calculateLevel: (xp: number) => number;
  getXPForNextLevel: () => number;
  getProgress: () => number;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      badges: [],
      achievements: [],
      streak: 0,
      lastActivityDate: null,

      addXP: (points: number, reason: string) => {
        const currentXP = get().xp;
        const newXP = currentXP + points;
        const newLevel = get().calculateLevel(newXP);
        const currentLevel = get().level;
        
        // Create achievement for XP gain
        const achievement: Achievement = {
          id: `xp_${Date.now()}`,
          title: `+${points} XP`,
          description: reason,
          xp: points,
          type: 'lesson',
          earnedAt: new Date()
        };
        
        const currentAchievements = get().achievements;
        
        set({ 
          xp: newXP,
          level: newLevel,
          achievements: [achievement, ...currentAchievements]
        });
        
        // Level up celebration
        if (newLevel > currentLevel) {
          // Trigger level up animation/notification
          console.log(`🎉 Level Up! You're now level ${newLevel}!`);
        }
      },

      earnBadge: (badge: Badge) => {
        const currentBadges = get().badges;
        const badgeExists = currentBadges.some(b => b.id === badge.id);
        
        if (!badgeExists) {
          const earnedBadge = { ...badge, earnedAt: new Date() };
          set({ badges: [earnedBadge, ...currentBadges] });
          
          // Badge earned celebration
          console.log(`🏆 Badge Earned: ${badge.name}!`);
        }
      },

      addAchievement: (achievement: Achievement) => {
        const currentAchievements = get().achievements;
        set({ achievements: [achievement, ...currentAchievements] });
      },

      updateStreak: () => {
        const today = new Date();
        const lastActivity = get().lastActivityDate;
        
        if (!lastActivity) {
          // First activity
          set({ streak: 1, lastActivityDate: today });
          return;
        }
        
        const dayDifference = Math.floor(
          (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (dayDifference === 1) {
          // Consecutive day
          const newStreak = get().streak + 1;
          set({ streak: newStreak, lastActivityDate: today });
          
          // Streak milestone achievements
          if (newStreak % 7 === 0) {
            get().addAchievement({
              id: `streak_${newStreak}`,
              title: `${newStreak} Day Streak!`,
              description: `Maintained learning streak for ${newStreak} days`,
              xp: newStreak * 5,
              type: 'streak',
              earnedAt: new Date()
            });
          }
        } else if (dayDifference > 1) {
          // Streak broken
          set({ streak: 1, lastActivityDate: today });
        }
        // Same day = no change
      },

      calculateLevel: (xp: number) => {
        // Level formula: Level = floor(sqrt(XP / 100)) + 1
        return Math.floor(Math.sqrt(xp / 100)) + 1;
      },

      getXPForNextLevel: () => {
        const currentLevel = get().level;
        const nextLevel = currentLevel + 1;
        return Math.pow(nextLevel - 1, 2) * 100;
      },

      getProgress: () => {
        const currentXP = get().xp;
        const currentLevel = get().level;
        const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
        const nextLevelXP = get().getXPForNextLevel();
        
        const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        return Math.max(0, Math.min(100, progress));
      },
    }),
    {
      name: 'gamification-storage',
    }
  )
);
