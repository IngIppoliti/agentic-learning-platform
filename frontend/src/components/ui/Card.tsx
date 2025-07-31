"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

const paddingVariants = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10'
};

export const Card: React.FC<CardProps> = ({
  className,
  children,
  hover = false,
  glow = false,
  gradient = false,
  padding = 'md',
  onClick,
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-gray-200/50 backdrop-blur-sm',
        'shadow-lg shadow-gray-900/5',
        hover && 'cursor-pointer hover:shadow-2xl hover:shadow-gray-900/10 hover:border-gray-300/50',
        glow && 'ring-1 ring-blue-500/10 hover:ring-blue-500/20',
        gradient && 'bg-gradient-to-br from-white via-gray-50/50 to-white',
        paddingVariants[padding],
        className
      )}
    >
      {/* Inner Glow Effect */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
