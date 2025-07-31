"use client";

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  loading,
  type,
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
        </motion.label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        {/* Input Field */}
        <motion.input
          ref={ref}
          type={inputType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={clsx(
            'w-full px-4 py-3 rounded-xl border transition-all duration-200',
            'bg-white/50 backdrop-blur-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
            icon && 'pl-10',
            isPassword && 'pr-10',
            error
              ? 'border-red-300 focus:border-red-500'
              : isFocused
              ? 'border-blue-500 shadow-lg shadow-blue-500/10'
              : 'border-gray-200 hover:border-gray-300',
            className
          )}
          {...props}
        />
        
        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
        
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Focus Ring Animation */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 rounded-xl ring-4 ring-blue-500/20 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Helper Text / Error */}
      <AnimatePresence>
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2"
          >
            <p className={clsx(
              'text-sm',
              error ? 'text-red-600' : 'text-gray-500'
            )}>
              {error || helperText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';
