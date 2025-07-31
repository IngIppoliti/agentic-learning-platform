"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  percentage: number;
  title: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  blue: {
    gradient: 'from-blue-500 to-cyan-500',
    ring: 'stroke-blue-500',
    glow: 'shadow-blue-500/30'
  },
  green: {
    gradient: 'from-green-500 to-emerald-500',
    ring: 'stroke-green-500',
    glow: 'shadow-green-500/30'
  },
  purple: {
    gradient: 'from-purple-500 to-pink-500',
    ring: 'stroke-purple-500',
    glow: 'shadow-purple-500/30'
  },
  orange: {
    gradient: 'from-orange-500 to-red-500',
    ring: 'stroke-orange-500',
    glow: 'shadow-orange-500/30'
  }
};

const sizeMap = {
  sm: { circle: 60, strokeWidth: 6, text: 'text-lg' },
  md: { circle: 80, strokeWidth: 8, text: 'text-xl' },
  lg: { circle: 100, strokeWidth: 10, text: 'text-2xl' }
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  title,
  color = 'blue',
  size = 'md'
}) => {
  const colors = colorMap[color];
  const sizes = sizeMap[size];
  const radius = sizes.circle / 2 - sizes.strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center mb-4">
        {/* Background Circle */}
        <svg
          className="transform -rotate-90"
          width={sizes.circle}
          height={sizes.circle}
        >
          <circle
            cx={sizes.circle / 2}
            cy={sizes.circle / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={sizes.strokeWidth}
            fill="transparent"
            className="text-gray-200"
            strokeLinecap="round"
          />
          
          {/* Progress Circle */}
          <motion.circle
            cx={sizes.circle / 2}
            cy={sizes.circle / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={sizes.strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={`${colors.glow} drop-shadow-lg`}
          />
          
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className="text-blue-500" stopColor="currentColor" />
              <stop offset="100%" className="text-cyan-500" stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
            className={`font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent ${sizes.text}`}
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
        
        {/* Glowing Dot at Progress End */}
        {percentage > 0 && (
          <motion.div
            className={`absolute w-3 h-3 bg-gradient-to-r ${colors.gradient} rounded-full shadow-lg ${colors.glow}`}
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: `0 ${-radius}px`,
              transform: `translate(-50%, -50%) rotate(${(percentage / 100) * 360 - 90}deg) translate(0, ${-radius}px)`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
          />
        )}
      </div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-semibold text-gray-700 mb-1"
      >
        {title}
      </motion.h3>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full bg-gray-200 rounded-full h-1"
      >
        <motion.div
          className={`h-1 bg-gradient-to-r ${colors.gradient} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};
