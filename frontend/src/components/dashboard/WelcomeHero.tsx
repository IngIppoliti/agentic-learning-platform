"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FireIcon, 
  TrophyIcon, 
  SparklesIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

interface WelcomeHeroProps {
  userName: string;
  timeOfDay: string;
  level: number;
  currentStreak: number;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  userName,
  timeOfDay,
  level,
  currentStreak
}) => {
  const getTimeIcon = () => {
    const hour = new Date().getHours();
    return hour < 18 ? SunIcon : MoonIcon;
  };

  const TimeIcon = getTimeIcon();

  return (
    <div className="relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern id="heroPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#heroPattern)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-3 mb-3"
            >
              <TimeIcon className="w-8 h-8" />
              <h1 className="text-3xl md:text-4xl font-bold">
                {timeOfDay}, {userName}!
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl opacity-90 mb-6"
            >
              Pronto per un'altra giornata di crescita straordinaria?
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <TrophyIcon className="w-6 h-6 text-yellow-300" />
                <span className="text-lg font-semibold">Level {level}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <FireIcon className="w-6 h-6 text-orange-300" />
                <span className="text-lg font-semibold">{currentStreak} giorni</span>
              </div>
            </motion.div>
          </div>
          
          {/* Animated Mascot/Character */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            className="hidden md:block"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="text-8xl"
              >
                🚀
              </motion.div>
              
              {/* Sparkles around character */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                >
                  <SparklesIcon className="w-4 h-4 text-yellow-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
};
