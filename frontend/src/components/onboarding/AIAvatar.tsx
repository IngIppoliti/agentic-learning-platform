"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface AIAvatarProps {
  message: string;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'excited' | 'encouraging';
  isTyping?: boolean;
  showMessage?: boolean;
}

const emotions = {
  neutral: {
    gradient: 'from-blue-500 to-purple-500',
    pulseColor: 'blue-500/30',
    expression: '😊'
  },
  happy: {
    gradient: 'from-green-500 to-blue-500',
    pulseColor: 'green-500/30',
    expression: '😄'
  },
  thinking: {
    gradient: 'from-purple-500 to-pink-500',
    pulseColor: 'purple-500/30',
    expression: '🤔'
  },
  excited: {
    gradient: 'from-yellow-500 to-red-500',
    pulseColor: 'yellow-500/30',
    expression: '🚀'
  },
  encouraging: {
    gradient: 'from-emerald-500 to-teal-500',
    pulseColor: 'emerald-500/30',
    expression: '💪'
  }
};

export const AIAvatar: React.FC<AIAvatarProps> = ({
  message,
  emotion = 'neutral',
  isTyping = false,
  showMessage = true
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const currentEmotion = emotions[emotion];

  useEffect(() => {
    if (!showMessage) return;
    
    setDisplayedMessage('');
    setIsComplete(false);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < message.length) {
        setDisplayedMessage(message.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [message, showMessage]);

  return (
    <div className="flex items-start space-x-4">
      {/* AI Avatar */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative flex-shrink-0"
      >
        {/* Outer Glow Ring */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${currentEmotion.gradient}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Avatar Circle */}
        <div className={`relative w-16 h-16 rounded-full bg-gradient-to-r ${currentEmotion.gradient} shadow-xl shadow-${currentEmotion.pulseColor} flex items-center justify-center`}>
          {/* Animated Neural Network Background */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 2px, transparent 2px), radial-gradient(circle at 40% 20%, white 1px, transparent 1px)',
                backgroundSize: '30px 30px, 25px 25px, 20px 20px'
              }}
            />
          </div>
          
          {/* ARIA Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 text-white font-bold text-lg"
          >
            AI
          </motion.div>
          
          {/* Floating Icons */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{
              y: [0, -8, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon className="w-5 h-5 text-yellow-400" />
          </motion.div>
        </div>
        
        {/* Thinking Animation */}
        {isTyping && (
          <motion.div
            className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-gray-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Message Bubble */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="relative max-w-md"
          >
            {/* Message Bubble */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl rounded-tl-sm p-4 shadow-lg border border-gray-200/50 backdrop-blur-sm">
              {/* Message Icon */}
              <div className="flex items-start space-x-3">
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                
                <div className="flex-1">
                  {/* AI Name */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ARIA
                    </span>
                    <span className="text-xs text-gray-400">• AI Tutor</span>
                  </div>
                  
                  {/* Message Text */}
                  <div className="text-gray-700 leading-relaxed">
                    {displayedMessage}
                    {!isComplete && !isTyping && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="ml-1 text-blue-500"
                      >
                        |
                      </motion.span>
                    )}
                  </div>
                  
                  {/* Emotion Indicator */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{currentEmotion.expression}</span>
                      <span className="text-xs text-gray-400 capitalize">{emotion}</span>
                    </div>
                    
                    {isComplete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Message Tail */}
            <div className="absolute top-4 -left-2 w-4 h-4 bg-white border-l border-t border-gray-200/50 rotate-45 rounded-tl-sm" />
            
            {/* Magical Sparkles around Message */}
            {isComplete && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${20 + i * 30}%`,
                      right: `${10 + i * 15}%`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 0.8, 0],
                      y: [0, -20],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeOut"
                    }}
                  >
                    <SparklesIcon className="w-3 h-3 text-yellow-400" />
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
