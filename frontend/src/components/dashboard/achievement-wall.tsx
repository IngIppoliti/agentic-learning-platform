import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Target, 
  Flame, 
  Brain, 
  Users, 
  Clock, 
  Award,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: Date;
  category: string;
}

interface AchievementWallProps {
  achievements: Achievement[];
  className?: string;
}

const AchievementWall: React.FC<AchievementWallProps> = ({
  achievements,
  className = ""
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<string | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Configurazioni rarità
  const rarityConfig = {
    common: {
      gradient: 'from-gray-400 to-gray-600',
      border: 'border-gray-500/50',
      glow: 'shadow-gray-500/25',
      bg: 'from-gray-500/20 to-gray-600/20',
      particle: 'bg-gray-400'
    },
    rare: {
      gradient: 'from-blue-400 to-blue-600',
      border: 'border-blue-500/50',
      glow: 'shadow-blue-500/25',
      bg: 'from-blue-500/20 to-blue-600/20',
      particle: 'bg-blue-400'
    },
    epic: {
      gradient: 'from-purple-400 to-purple-600',
      border: 'border-purple-500/50',
      glow: 'shadow-purple-500/25',
      bg: 'from-purple-500/20 to-purple-600/20',
      particle: 'bg-purple-400'
    },
    legendary: {
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      border: 'border-amber-500/50',
      glow: 'shadow-amber-500/25',
      bg: 'from-amber-500/20 to-red-500/20',
      particle: 'bg-amber-400'
    }
  };

  // Filtri disponibili
  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const filteredAchievements = achievements.filter(
    a => filter === 'all' || a.category === filter
  );

  // Animazione unlock
  const handleUnlock = (achievementId: string) => {
    setShowUnlockAnimation(achievementId);
    setTimeout(() => setShowUnlockAnimation(null), 3000);
  };

  // Componente Particella
  const Particle = ({ color, delay }: { color: string; delay: number }) => (
    <motion.div
      className={`absolute w-1 h-1 ${color} rounded-full`}
      initial={{ 
        opacity: 0, 
        scale: 0,
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100
      }}
      animate={{ 
        opacity: [0, 1, 0], 
        scale: [0, 1, 0],
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        rotate: 360
      }}
      transition={{ 
        duration: 2, 
        delay: delay,
        ease: "easeOut"
      }}
    />
  );

  // Componente Badge Achievement
  const AchievementBadge = ({ achievement, index }: { achievement: Achievement; index: number }) => {
    const config = rarityConfig[achievement.rarity];
    const Icon = achievement.icon;
    const progressPercentage = achievement.progress && achievement.maxProgress 
      ? (achievement.progress / achievement.maxProgress) * 100 
      : 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 50, rotateY: -90 }}
        animate={isInView ? { 
          opacity: 1, 
          y: 0, 
          rotateY: 0,
          transition: { delay: index * 0.1 }
        } : {}}
        whileHover={{ 
          scale: 1.05, 
          rotateY: 10,
          z: 50,
          transition: { type: "spring", stiffness: 300 }
        }}
        className="relative group cursor-pointer"
        onClick={() => setSelectedAchievement(achievement)}
      >
        {/* Badge principale */}
        <div className={`
          relative w-24 h-24 rounded-2xl p-4 backdrop-blur-xl border-2
          ${achievement.unlocked 
            ? `bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}` 
            : 'bg-gray-800/50 border-gray-700/50'
          }
          transition-all duration-300 group-hover:shadow-lg
        `}>

          {/* Effetto brillante per legendary */}
          {achievement.unlocked && achievement.rarity === 'legendary' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
          )}

          {/* Icona */}
          <div className="relative z-10 flex items-center justify-center h-full">
            {achievement.unlocked ? (
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon className={`h-8 w-8 text-white`} />
              </motion.div>
            ) : (
              <Lock className="h-8 w-8 text-gray-500" />
            )}
          </div>

          {/* Barra di progresso per achievement non completati */}
          {!achievement.unlocked && achievement.progress !== undefined && (
            <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </div>
          )}

          {/* Indicatore rarità */}
          <div className={`
            absolute -top-1 -right-1 w-4 h-4 rounded-full
            bg-gradient-to-r ${config.gradient}
            flex items-center justify-center
          `}>
            {achievement.rarity === 'legendary' && <Crown className="h-2 w-2 text-white" />}
            {achievement.rarity === 'epic' && <Star className="h-2 w-2 text-white" />}
            {achievement.rarity === 'rare' && <Sparkles className="h-2 w-2 text-white" />}
          </div>
        </div>

        {/* Tooltip al hover */}
        <AnimatePresence>
          <motion.div
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-lg p-3 min-w-48 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h4 className="text-sm font-semibold text-white mb-1">{achievement.title}</h4>
            <p className="text-xs text-gray-300 mb-2">{achievement.description}</p>

            {achievement.unlocked ? (
              <div className="flex items-center text-xs text-green-400">
                <Unlock className="h-3 w-3 mr-1" />
                Sbloccato {achievement.unlockedAt?.toLocaleDateString()}
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                )}
              </div>
            )}

            {/* Indicatore rarità */}
            <div className={`inline-block px-2 py-1 rounded-full text-xs mt-2 bg-gradient-to-r ${config.gradient} text-white`}>
              {achievement.rarity.toUpperCase()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Particelle per unlock animation */}
        <AnimatePresence>
          {showUnlockAnimation === achievement.id && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <Particle key={i} color={config.particle} delay={i * 0.1} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div
        className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Trophy className="h-8 w-8 text-amber-400" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white">Bacheca Successi</h3>
              <p className="text-gray-400">
                {achievements.filter(a => a.unlocked).length}/{achievements.length} sbloccati
              </p>
            </div>
          </div>

          {/* Statistiche rapide */}
          <div className="flex space-x-4">
            {Object.entries(
              achievements.reduce((acc, a) => {
                if (a.unlocked) acc[a.rarity] = (acc[a.rarity] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([rarity, count]) => (
              <div key={rarity} className="text-center">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${rarityConfig[rarity as keyof typeof rarityConfig].gradient} flex items-center justify-center mx-auto mb-1`}>
                  <span className="text-xs font-bold text-white">{count}</span>
                </div>
                <span className="text-xs text-gray-400 capitalize">{rarity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filtri */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === category
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category === 'all' ? 'Tutti' : category}
            </motion.button>
          ))}
        </div>

        {/* Griglia Achievement */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {filteredAchievements.map((achievement, index) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </div>

        {/* Progress Summary */}
        <motion.div
          className="mt-6 p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white mb-1">Progresso Totale</h4>
              <p className="text-indigo-300 text-sm">
                Continua così per sbloccare nuovi achievement!
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
              </div>
              <div className="text-sm text-indigo-300">Completato</div>
            </div>
          </div>

          <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ 
                width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%`
              }}
              transition={{ duration: 2, delay: 1 }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Modal dettaglio achievement */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className={`w-24 h-24 rounded-2xl mx-auto mb-4 bg-gradient-to-br ${rarityConfig[selectedAchievement.rarity].bg} border-2 ${rarityConfig[selectedAchievement.rarity].border} flex items-center justify-center`}>
                  <selectedAchievement.icon className="h-12 w-12 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{selectedAchievement.title}</h3>
                <p className="text-gray-300 mb-4">{selectedAchievement.description}</p>

                <div className={`inline-block px-4 py-2 rounded-full text-sm bg-gradient-to-r ${rarityConfig[selectedAchievement.rarity].gradient} text-white mb-4`}>
                  {selectedAchievement.rarity.toUpperCase()}
                </div>

                {selectedAchievement.unlocked ? (
                  <div className="text-green-400 flex items-center justify-center">
                    <Unlock className="h-4 w-4 mr-2" />
                    Sbloccato il {selectedAchievement.unlockedAt?.toLocaleDateString()}
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Lock className="h-4 w-4 mx-auto mb-2" />
                    Non ancora sbloccato
                    {selectedAchievement.progress !== undefined && selectedAchievement.maxProgress && (
                      <div className="mt-2">
                        <div className="text-sm mb-1">
                          Progresso: {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                            style={{ width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AchievementWall;