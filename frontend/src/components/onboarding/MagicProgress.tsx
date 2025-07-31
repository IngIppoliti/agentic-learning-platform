"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

interface Step {
  id: number;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface MagicProgressProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export const MagicProgress: React.FC<MagicProgressProps> = ({
  steps,
  currentStep,
  completedSteps
}) => {
  return (
    <div className="relative">
      {/* Background Magical Trail */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-full blur-xl" />
      
      <div className="relative flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isUpcoming = step.id > currentStep;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isCurrent ? 1.2 : 1, 
                    opacity: 1 
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25 
                  }}
                  className={clsx(
                    'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500',
                    isCompleted 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30' 
                      : isCurrent 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl shadow-blue-500/40' 
                      : 'bg-gray-100 border-2 border-gray-300'
                  )}
                >
                  {/* Magical Glow Effect for Current Step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* Step Content */}
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="completed"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <CheckIcon className="w-8 h-8 text-white" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        key="current"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-white"
                      >
                        {step.icon}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="upcoming"
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: isUpcoming ? 0.4 : 1 }}
                        className={clsx(
                          isUpcoming ? 'text-gray-400' : 'text-gray-600'
                        )}
                      >
                        {step.icon}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Sparkles for Current Step */}
                  {isCurrent && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                            x: [0, Math.random() * 40 - 20],
                            y: [0, Math.random() * 40 - 20],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: "easeOut"
                          }}
                        >
                          <SparklesIcon className="w-4 h-4 text-yellow-400" />
                        </motion.div>
                      ))}
                    </>
                  )}
                </motion.div>
                
                {/* Step Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="mt-3 text-center"
                >
                  <h3 className={clsx(
                    'text-sm font-semibold transition-colors duration-300',
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-20">
                    {step.description}
                  </p>
                </motion.div>
              </div>
              
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: step.id < currentStep ? '100%' : '0%' 
                      }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                    
                    {/* Animated Sparkle Trail */}
                    {step.id < currentStep && (
                      <motion.div
                        className="absolute inset-y-0 left-0 w-full"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="h-full w-8 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
