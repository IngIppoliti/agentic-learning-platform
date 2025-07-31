import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  Search, 
  Menu,
  X,
  Sparkles,
  Crown,
  Users,
  Target,
  Zap,
  Clock,
  Calendar
} from 'lucide-react';

// Import dei nostri componenti spettacolari
import WelcomeHero from '../components/WelcomeHero';
import ProgressRing from '../components/ProgressRing';
import XPCounter from '../components/XPCounter';
import AchievementWall from '../components/AchievementWall';
import SkillRadar from '../components/SkillRadar';
import CommunityFeed from '../components/CommunityFeed';
import WeeklyStats from '../components/WeeklyStats';

// Mock data per demo
const mockUser = {
  name: "Marco",
  level: 15,
  currentXP: 2750,
  nextLevelXP: 3000,
  totalXP: 15420,
  streak: 12,
  weeklyXP: 480
};

const mockProgress = {
  currentLevel: 15,
  progress: 92,
  nextMilestone: 3000,
  completedCourses: 8,
  totalCourses: 12
};

const mockAchievements = [
  {
    id: "first_week",
    title: "Prima Settimana",
    description: "Completa la tua prima settimana di studio",
    icon: Calendar,
    rarity: "common" as const,
    unlocked: true,
    unlockedAt: new Date("2024-01-15"),
    category: "Iniziazione"
  },
  {
    id: "streak_master",
    title: "Streak Master",
    description: "Mantieni uno streak di 7 giorni",
    icon: Crown,
    rarity: "legendary" as const,
    unlocked: true,
    unlockedAt: new Date("2024-01-20"),
    category: "Costanza"
  },
  {
    id: "night_owl", 
    title: "Gufo Notturno",
    description: "Studia dopo le 22:00 per 5 giorni",
    icon: Clock,
    rarity: "rare" as const,
    unlocked: false,
    progress: 3,
    maxProgress: 5,
    category: "Speciale"
  }
];

const mockSkills = [
  {
    name: "JavaScript",
    level: 8,
    maxLevel: 10,
    color: "#F7DF1E",
    icon: Zap,
    category: "Programming",
    description: "Linguaggio di programmazione versatile",
    recentGrowth: 2
  },
  {
    name: "React",
    level: 7,
    maxLevel: 10, 
    color: "#61DAFB",
    icon: Target,
    category: "Frontend",
    description: "Libreria per interfacce utente",
    recentGrowth: 1
  },
  {
    name: "Python",
    level: 6,
    maxLevel: 10,
    color: "#3776AB", 
    icon: Users,
    category: "Programming",
    description: "Linguaggio versatile per AI e web"
  },
  {
    name: "AI/ML",
    level: 4,
    maxLevel: 10,
    color: "#FF6B6B",
    icon: Sparkles,
    category: "Intelligence",
    description: "Intelligenza artificiale e machine learning"
  }
];

const mockCommunityPosts = [
  {
    id: "post1",
    author: {
      name: "Alice Dev",
      avatar: "/api/placeholder/40/40",
      level: 18,
      title: "AI Enthusiast"
    },
    content: "Appena completato il corso avanzato di Machine Learning! Le reti neurali sono incredibili 🤖✨",
    type: "achievement" as const,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likes: 24,
    comments: 8,
    shares: 3,
    tags: ["ml", "ai", "neural-networks"],
    achievement: {
      title: "ML Master",
      icon: Sparkles,
      rarity: "epic" as const
    }
  },
  {
    id: "post2", 
    author: {
      name: "Bob Learn",
      avatar: "/api/placeholder/40/40",
      level: 12,
      title: "Code Warrior"
    },
    content: "Chi può aiutarmi con i callback in JavaScript? Sto lottando con async/await 😅",
    type: "question" as const,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    likes: 15,
    comments: 12,
    shares: 2,
    tags: ["javascript", "async", "help"]
  }
];

const mockWeeklyData = [
  { day: "Lunedì", xpGained: 120, hoursStudied: 2.5, lessonsCompleted: 3, streakMaintained: true },
  { day: "Martedì", xpGained: 95, hoursStudied: 2.0, lessonsCompleted: 2, streakMaintained: true },
  { day: "Mercoledì", xpGained: 150, hoursStudied: 3.0, lessonsCompleted: 4, streakMaintained: true },
  { day: "Giovedì", xpGained: 80, hoursStudied: 1.5, lessonsCompleted: 2, streakMaintained: true },
  { day: "Venerdì", xpGained: 110, hoursStudied: 2.2, lessonsCompleted: 3, streakMaintained: true },
  { day: "Sabato", xpGained: 70, hoursStudied: 1.8, lessonsCompleted: 1, streakMaintained: false },
  { day: "Domenica", xpGained: 135, hoursStudied: 2.8, lessonsCompleted: 3, streakMaintained: true }
];

const mockStats = [
  {
    title: "XP Totali",
    value: 15420,
    change: 12.5,
    changeType: "increase" as const,
    icon: Zap,
    color: "#8B5CF6"
  },
  {
    title: "Ore Studio",
    value: "15.8",
    change: 8.2,
    changeType: "increase" as const,
    icon: Clock,
    color: "#10B981",
    unit: "h"
  },
  {
    title: "Lezioni",
    value: 18,
    change: -2.1,
    changeType: "decrease" as const,
    icon: Target,
    color: "#F59E0B"
  },
  {
    title: "Streak",
    value: 12,
    change: 0,
    changeType: "neutral" as const,
    icon: Calendar,
    color: "#EF4444",
    unit: "giorni"
  }
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Aggiorna l'ora ogni minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Buongiorno";
    if (hour < 18) return "Buon pomeriggio";
    return "Buonasera";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <motion.header 
        className="bg-black/20 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e titolo */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>

              <motion.div 
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">AI Learning Hub</h1>
              </motion.div>
            </div>

            {/* Search bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca corsi, skills, community..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-4">
              {/* Notifiche */}
              <motion.button
                className="relative p-2 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {notifications}
                  </motion.span>
                )}
              </motion.button>

              {/* Settings */}
              <motion.button
                className="p-2 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white transition-colors"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <Settings className="h-5 w-5" />
              </motion.button>

              {/* Profile */}
              <motion.div 
                className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-3 py-2"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src="/api/placeholder/32/32"
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-purple-500"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{mockUser.name}</p>
                  <p className="text-xs text-gray-400">Livello {mockUser.level}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {greeting()}, {mockUser.name}! 👋
              </h2>
              <p className="text-gray-400">
                Pronto per un'altra giornata di apprendimento spettacolare?
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">
                {currentTime.toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-lg font-semibold text-purple-400">
                {currentTime.toLocaleTimeString('it-IT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <WelcomeHero 
              userName={mockUser.name}
              currentStreak={mockUser.streak}
              totalXP={mockUser.totalXP}
              className="h-full"
            />
          </div>
          <div className="space-y-4">
            <ProgressRing 
              progress={mockProgress.progress}
              level={mockProgress.currentLevel}
              nextMilestone={mockProgress.nextMilestone}
              className="h-full"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <XPCounter
            currentXP={mockUser.currentXP}
            nextLevelXP={mockUser.nextLevelXP}
            level={mockUser.level}
            weeklyXP={mockUser.weeklyXP}
            streak={mockUser.streak}
          />
          <div className="lg:col-span-2">
            <WeeklyStats
              weeklyData={mockWeeklyData}
              stats={mockStats}
            />
          </div>
        </div>

        {/* Skills & Achievements */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <SkillRadar skills={mockSkills} />
          <AchievementWall achievements={mockAchievements} />
        </div>

        {/* Community Feed */}
        <div className="mb-8">
          <CommunityFeed posts={mockCommunityPosts} />
        </div>

        {/* Footer motivazionale */}
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-6 py-3"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-purple-300 font-medium">
              Ogni giorno è una nuova opportunità per crescere! 🚀
            </span>
          </motion.div>
        </motion.div>
      </main>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 z-50"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <motion.button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                <nav className="space-y-2">
                  {[
                    { label: "Dashboard", icon: Sparkles },
                    { label: "Corsi", icon: Target },
                    { label: "Community", icon: Users },
                    { label: "Achievements", icon: Crown },
                    { label: "Impostazioni", icon: Settings }
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.a
                        key={item.label}
                        href="#"
                        className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </motion.a>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;