Copy'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, TrendingUp, Award, Flame, Target, BarChart3 } from 'lucide-react';
import { useXPDetails } from '@/hooks/useDashboard';

interface XPCounterProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const XPCounter: React.FC<XPCounterProps> = ({
  className = "",
  showDetails = true,
  compact = false
}) => {
  const { data: xpDetails, isLoading, isError, refetch } = useXPDetails();
  
  const [animatedXP, setAnimatedXP] = useState(0);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(0);

  // 🔄 LOADING STATE
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-2xl animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full"></div>
              <div className="space-y-2">
                <div className="w-24 h-5 bg-white/20 rounded"></div>
                <div className="w-32 h-4 bg-white/20 rounded"></div>
              </div>
            </div>
            <div className="w-20 h-8 bg-white/20 rounded-lg"></div>
          </div>
          <div className="space-y-4">
            <div className="w-32 h-8 bg-white/20 rounded"></div>
            <div className="w-full h-4 bg-white/20 rounded-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-white/10 rounded-xl"></div>
              <div className="h-20 bg-white/10 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (isError || !xpDetails) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="text-center text-white">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">Errore caricamento XP</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 📊 ESTRAZIONE DATI DALLE API
  const {
    current_xp: currentXP,
    level,
    xp_to_next_level: nextLevelXP,
    level_progress_percentage: progressPercentage,
    weekly_xp: weeklyXP,
    current_streak: streak,
    daily_xp: dailyXP,
    monthly_xp: monthlyXP,
    goals_progress,
    learning_velocity,
    consistency_score,
    total_xp_earned
  } = xpDetails;

  const remainingXP = nextLevelXP - currentXP;

  // 🎯 DETECT LEVEL UP
  useEffect(() => {
    if (previousLevel > 0 && level > previousLevel) {
      handleLevelUp();
    }
    setPreviousLevel(level);
  }, [level, previousLevel]);

  // 🎬 ANIMA IL CONTATORE XP
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animatedXP < currentXP) {
        setAnimatedXP(prev => Math.min(prev + Math.ceil((currentXP - prev) / 10), currentXP));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [animatedXP, currentXP]);

  // 🎉 EFFETTO LEVEL UP
  const handleLevelUp = () => {
    setIsLevelingUp(true);
    setShowParticles(true);
    setTimeout(() => {
      setIsLevelingUp(false);
      setShowParticles(false);
    }, 2000);
  };

  // ✨ PARTICELLE ANIMATE
  const Particle = ({ delay }: { delay: number }) => (
    <motion.div
      className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
      initial={{ 
        opacity: 0, 
        scale: 0,
        x: Math.random() * 400 - 200,
        y: Math.random() * 300 - 150
      }}
      animate={{ 
        opacity: [0, 1, 0], 
        scale: [0, 1, 0],
        y: "-=100",
        rotate: 360
      }}
      transition={{ 
        duration: 2, 
        delay: delay,
        ease: "easeOut"
      }}
    />
  );

  // 🏃‍♂️ COMPACT VERSION
  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-4 shadow-lg">
          <div className="relative">
            <Trophy className="h-8 w-8 text-amber-400" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">{level}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">{currentXP.toLocaleString()} XP</span>
              <span className="text-sm opacity-80">• Livello {level}</span>
            </div>
            <div className="bg-white/20 rounded-full h-2 mt-1">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          {streak >= 3 && (
            <div className="flex items-center space-x-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold">{streak}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* ✨ Particelle di celebrazione */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {[...Array(20)].map((_, i) => (
              <Particle key={i} delay={i * 0.1} />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-2xl"
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* 🏆 Header con Level */}
        <div className="flex items-center justify-between mb-6">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <Trophy className="h-8 w-8 text-amber-400" />
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center"
                animate={{ rotate: isLevelingUp ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-xs font-bold text-white">{level}</span>
              </motion.div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Livello {level}</h3>
              <p className="text-indigo-300 text-sm">AI Learning Master</p>
            </div>
          </motion.div>

          {/* 🎯 Goals Progress Mini */}
          <div className="text-right">
            <div className="text-xs text-indigo-300 mb-1">Obiettivo giornaliero</div>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(goals_progress?.daily?.percentage || 0, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-white">
                {goals_progress?.daily?.percentage?.toFixed(0) || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* 💎 XP Counter principale */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <motion.div
              key={animatedXP}
              initial={{ scale: 1.2, color: "#fbbf24" }}
              animate={{ scale: 1, color: "#ffffff" }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-3xl font-bold text-white">{animatedXP.toLocaleString()}</span>
              <span className="text-lg text-indigo-300 ml-2">XP</span>
            </motion.div>
            <div className="text-right">
              <p className="text-sm text-indigo-300">Prossimo livello</p>
              <p className="text-lg font-semibold text-white">{remainingXP.toLocaleString()} XP</p>
            </div>
          </div>

          {/* 📊 Barra di progresso animata */}
          <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"
              animate={{ x: ["0%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* 🎯 Punti di checkpoint */}
            {[25, 50, 75].map((checkpoint) => (
              <div
                key={checkpoint}
                className={`absolute top-0 w-1 h-full ${
                  progressPercentage >= checkpoint ? 'bg-yellow-400' : 'bg-gray-500'
                }`}
                style={{ left: `${checkpoint}%` }}
              />
            ))}
          </div>
          <p className="text-center text-sm text-indigo-300 mt-2">
            {progressPercentage.toFixed(1)}% completato
          </p>
        </div>

        {/* 📈 Statistiche principali */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 🗓️ XP Settimanale */}
          <motion.div
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium text-green-300">Questa settimana</span>
            </div>
            <motion.p
              className="text-2xl font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              +{weeklyXP.toLocaleString()}
            </motion.p>
            <p className="text-xs text-green-300">
              Obiettivo: {goals_progress?.weekly?.percentage?.toFixed(0) || 0}%
            </p>
          </motion.div>

          {/* 🔥 Streak */}
          <motion.div
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-sm font-medium text-orange-300">Streak</span>
            </div>
            <div className="flex items-end space-x-1">
              <motion.p
                className="text-2xl font-bold text-white"
                animate={{ scale: streak > 7 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5, repeat: streak > 7 ? Infinity : 0, repeatDelay: 2 }}
              >
                {streak}
              </motion.p>
              <span className="text-sm text-orange-300 mb-1">giorni</span>
            </div>
            <div className="flex space-x-1 mt-2">
              {[...Array(Math.min(streak, 7))].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-orange-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* 📊 Statistiche aggiuntive (se showDetails=true) */}
        {showDetails && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <div className="text-lg font-bold text-white">{dailyXP}</div>
              <div className="text-xs text-blue-300">Oggi</div>
            </div>
            <div className="text-center p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
              <div className="text-lg font-bold text-white">{monthlyXP.toLocaleString()}</div>
              <div className="text-xs text-purple-300">Questo mese</div>
            </div>
            <div className="text-center p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
              <div className="text-lg font-bold text-white">{total_xp_earned.toLocaleString()}</div>
              <div className="text-xs text-indigo-300">XP Totali</div>
            </div>
          </div>
        )}

        {/* 🎯 Performance Metrics */}
        {showDetails && (
          <div className="flex justify-between items-center pt-4 border-t border-indigo-500/30">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-indigo-300" />
              <span className="text-sm text-indigo-300">
                Velocità: {learning_velocity.toFixed(1)} XP/giorno
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-indigo-300" />
              <span className="text-sm text-indigo-300">
                Consistenza: {(consistency_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* ⭐ Bonus multiplier indicator */}
        <AnimatePresence>
          {streak >= 7 && (
            <motion.div
              className="mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-5 w-5 text-yellow-400 animate-pulse" />
                <span className="text-sm font-semibold text-yellow-300">
                  BONUS STREAK: XP x{Math.floor(streak / 7) + 1}
                </span>
                <Star className="h-5 w-5 text-yellow-400 animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🎉 Level up celebration */}
        <AnimatePresence>
          {isLevelingUp && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/90 to-pink-500/90 rounded-2xl flex items-center justify-center z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: 1 }}
                >
                  <Award className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-white mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  LEVEL UP!
                </motion.h2>
                <motion.p
                  className="text-lg text-purple-200"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Congratulazioni! Livello {level}
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default XPCounter;
