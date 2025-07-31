import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, TrendingUp, Award, Flame } from 'lucide-react';

interface XPCounterProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  weeklyXP: number;
  streak: number;
  className?: string;
}

const XPCounter: React.FC<XPCounterProps> = ({
  currentXP,
  nextLevelXP,
  level,
  weeklyXP,
  streak,
  className = ""
}) => {
  const [animatedXP, setAnimatedXP] = useState(0);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const progressPercentage = (currentXP / nextLevelXP) * 100;
  const remainingXP = nextLevelXP - currentXP;

  // Anima il contatore XP
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animatedXP < currentXP) {
        setAnimatedXP(prev => Math.min(prev + Math.ceil((currentXP - prev) / 10), currentXP));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [animatedXP, currentXP]);

  // Effetto level up
  const handleLevelUp = () => {
    setIsLevelingUp(true);
    setShowParticles(true);
    setTimeout(() => {
      setIsLevelingUp(false);
      setShowParticles(false);
    }, 2000);
  };

  // Particelle animate
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

  return (
    <div className={`relative ${className}`}>
      {/* Particelle di celebrazione */}
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
        {/* Header con Level */}
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

          <motion.button
            onClick={handleLevelUp}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-purple-500/25"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Level Up!
          </motion.button>
        </div>

        {/* XP Counter principale */}
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

          {/* Barra di progresso animata */}
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

            {/* Punti di checkpoint */}
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

        {/* Statistiche secondarie */}
        <div className="grid grid-cols-2 gap-4">
          {/* XP Settimanale */}
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
            <p className="text-xs text-green-300">XP guadagnati</p>
          </motion.div>

          {/* Streak */}
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

        {/* Bonus multiplier indicator */}
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

        {/* Level up celebration */}
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
                  Congratulazioni! Livello {level + 1}
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