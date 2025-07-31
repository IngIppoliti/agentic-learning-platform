"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl',
  secondary: 'bg-gray-900 text-white hover:bg-gray-800',
  outline: 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl',
  success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-6 py-3 text-base font-semibold',
  xl: 'px-8 py-4 text-lg font-semibold'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  gradient = false,
  glow = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      className={clsx(
        'relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size],
        glow && 'hover:shadow-2xl hover:shadow-blue-500/25',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Background Gradient Overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Loading Spinner */}
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      
      {/* Left Icon */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {/* Button Text */}
      <span className="relative z-10">{children}</span>
      
      {/* Right Icon */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
      
      {/* Ripple Effect */}
      <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 bg-gradient-to-r from-white/10 via-white/5 to-transparent transition-opacity duration-300" />
    </motion.button>
  );
};
