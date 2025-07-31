"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  BookOpenIcon,
  BoltIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useLearningStore } from '@/store/learningStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AIAvatar } from '@/components/onboarding/AIAvatar';

// Dashboard Components
import { WelcomeHero } from '@/components/dashboard/WelcomeHero';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { XPCounter } from '@/components/dashboard/XPCounter';
import { StreakCounter } from '@/components/dashboard/StreakCounter';
import { LearningPathCard } from '@/components/dashboard/LearningPathCard';
import { NextLessonCard } from '@/components/dashboard/NextLessonCard';
import { AchievementWall } from '@/components/dashboard/AchievementWall';
import { SkillRadar } from '@/components/dashboard/SkillRadar';
import { CommunityFeed } from '@/components/dashboard/CommunityFeed';
import { WeeklyStats } from '@/components/dashboard/WeeklyStats';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const { currentPath, fetchLearningPaths } = useLearningStore();
  const { xp, level, streak, badges, addXP, updateStreak } = useGamificationStore();
  
  const [mounted, setMounted] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch data
    fetchProfile();
    fetchLearningPaths();
    updateStreak();

    // Set time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Buongiorno');
    else if (hour < 18) setTimeOfDay('Buon pomeriggio');
    else setTimeOfDay('Buonasera');

    // Set AI message based on progress
    if (streak > 7) {
      setAiMessage(`🔥 ${streak} giorni consecutivi! Sei in fiamme! Continua così!`);
    } else if (currentPath && currentPath.progress_percentage > 80) {
      setAiMessage('🎯 Quasi al traguardo! Manca poco per completare il percorso!');
    } else {
      setAiMessage('✨ Pronto per imparare qualcosa di nuovo oggi?');
    }
  }, [isAuthenticated, router, fetchProfile, fetchLearningPaths, updateStreak, streak, currentPath]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
              >
                <SparklesIcon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Agentic Learning
                </h1>
                <p className="text-sm text-gray-500">La tua crescita infinita</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <BoltIcon className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900">{xp} XP</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrophyIcon className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">Lv. {level}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FireIcon className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-gray-900">{streak} giorni</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <WelcomeHero
            userName={user?.first_name || user?.username || 'Learner'}
            timeOfDay={timeOfDay}
            level={level}
            currentStreak={streak}
          />
        </motion.div>

        {/* AI Assistant */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <AIAvatar
            message={aiMessage}
            emotion="happy"
            showMessage={true}
          />
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Progress & Stats */}
          <div className="lg:col-span-8 space-y-6">
            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="p-6" glow gradient>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <ChartBarIcon className="w-7 h-7 text-blue-500" />
                    <span>Il Tuo Progresso</span>
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addXP(10, "Daily login bonus")}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium"
                  >
                    +10 XP Daily Bonus
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ProgressRing
                    percentage={currentPath?.progress_percentage || 0}
                    title="Percorso Attuale"
                    color="blue"
                  />
                  <XPCounter
                    currentXP={xp}
                    level={level}
                    nextLevelXP={1000} // Calculate from gamification store
                  />
                  <StreakCounter
                    streak={streak}
                    record={streak} // TODO: Track record streak
                  />
                </div>
              </Card>
            </motion.div>

            {/* Current Learning Path */}
            {currentPath && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <LearningPathCard path={currentPath} />
              </motion.div>
            )}

            {/* Next Lesson */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <NextLessonCard
                lesson={{
                  title: "Introduzione al Machine Learning",
                  description: "Scopri i fondamenti dell'apprendimento automatico",
                  duration: 45,
                  type: "video",
                  difficulty: "intermediate"
                }}
                onStart={() => {
                  addXP(25, "Started new lesson");
                  // Navigate to lesson
                }}
              />
            </motion.div>

            {/* Weekly Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <WeeklyStats
                data={{
                  hoursLearned: 12.5,
                  lessonsCompleted: 8,
                  xpEarned: 450,
                  averageScore: 87
                }}
              />
            </motion.div>
          </div>

          {/* Right Column - Achievements & Community */}
          <div className="lg:col-span-4 space-y-6">
            {/* Achievement Wall */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AchievementWall badges={badges.slice(0, 6)} />
            </motion.div>

            {/* Skills Radar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <SkillRadar
                skills={profile?.current_skills || {}}
                title="Le Tue Competenze"
              />
            </motion.div>

            {/* Community Feed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <CommunityFeed
                updates={[
                  {
                    user: "Marco R.",
                    action: "completed",
                    target: "Python Basics",
                    time: "2 ore fa",
                    avatar: "👨‍💻"
                  },
                  {
                    user: "Sara L.",
                    action: "earned badge",
                    target: "Data Science Explorer",
                    time: "4 ore fa",
                    avatar: "👩‍🔬"
                  },
                  {
                    user: "Luca M.",
                    action: "reached level",
                    target: "Level 5",
                    time: "1 giorno fa",
                    avatar: "🚀"
                  }
                ]}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <RocketLaunchIcon className="w-5 h-5 text-purple-500" />
                  <span>Azioni Rapide</span>
                </h3>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/learning-path')}
                  >
                    <BookOpenIcon className="w-4 h-4 mr-2" />
                    Esplora Nuovi Percorsi
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/community')}
                  >
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Unisciti alla Community
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/settings')}
                  >
                    <HeartIcon className="w-4 h-4 mr-2" />
                    Personalizza Esperienza
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Card className="p-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50" glow>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-4"
            >
              💫
            </motion.div>
            <blockquote className="text-xl font-medium text-gray-900 mb-4">
              "Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno."
            </blockquote>
            <cite className="text-gray-600">— Robert Collier</cite>
          </Card>
        </motion.div>
      </div>

      {/* Floating Action Button - Continue Learning */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 500, damping: 25 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center z-50 group"
        onClick={() => {
          addXP(5, "Continue learning clicked");
          router.push('/learning');
        }}
      >
        <RocketLaunchIcon className="w-8 h-8 text-white group-hover:animate-bounce" />
        
        {/* Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-500"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.button>

      {/* Background Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{
              y: [null, -100, null],
              opacity: [0, 0.1, 0],
              rotate: [0, 360],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon className="w-8 h-8 text-blue-300" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
