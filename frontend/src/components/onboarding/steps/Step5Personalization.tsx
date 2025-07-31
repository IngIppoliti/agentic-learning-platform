"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  BellIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  RocketLaunchIcon,
  HeartIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AIAvatar } from '../AIAvatar';

const step5Schema = z.object({
  notificationPreferences: z.object({
    dailyReminders: z.boolean(),
    weeklyProgress: z.boolean(),
    achievements: z.boolean(),
    communityUpdates: z.boolean(),
    newContent: z.boolean(),
  }),
  gamificationLevel: z.enum(['minimal', 'moderate', 'intense']),
  aiPersonality: z.enum(['professional', 'friendly', 'enthusiastic', 'motivational']),
  preferredDevice: z.enum(['desktop', 'mobile', 'both']),
  studyTimePreference: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
  motivationalQuotes: z.boolean(),
  privacyLevel: z.enum(['public', 'friends', 'private']),
});

type Step5FormData = z.infer<typeof step5Schema>;

interface Step5PersonalizationProps {
  onNext: (data: Step5FormData) => void;
  onBack: () => void;
  initialData?: Partial<Step5FormData>;
}

const gamificationLevels = [
  {
    value: 'minimal',
    label: 'Minimalista',
    emoji: '🌱',
    description: 'Solo progress tracking essenziale',
    color: 'from-green-400 to-green-600'
  },
  {
    value: 'moderate',
    label: 'Bilanciato',
    emoji: '⚡',
    description: 'XP, badges e leaderboard',
    color: 'from-blue-400 to-blue-600'
  },
  {
    value: 'intense',
    label: 'Hardcore Gamer',
    emoji: '🔥',
    description: 'Tutto il possibile: sfide, competizioni, rewards',
    color: 'from-red-400 to-red-600'
  }
];

const aiPersonalities = [
  {
    value: 'professional',
    label: 'Professionale',
    emoji: '👔',
    description: 'Formale, diretto, orientato ai risultati',
    sample: 'Hai completato il 75% del modulo. Procediamo con il prossimo obiettivo.'
  },
  {
    value: 'friendly',
    label: 'Amichevole',
    emoji: '😊',
    description: 'Cordiale, supportivo, conversazionale',
    sample: 'Grande lavoro! Sei sulla buona strada. Come ti senti riguardo al prossimo step?'
  },
  {
    value: 'enthusiastic',
    label: 'Entusiasta',
    emoji: '🎉',
    description: 'Energico, celebrativo, coinvolgente',
    sample: 'WOW! Fantastico progresso! Sei in fiamme oggi! Continuiamo così! 🚀'
  },
  {
    value: 'motivational',
    label: 'Coach Motivazionale',
    emoji: '💪',
    description: 'Ispirante, sfidante, orientato alla crescita',
    sample: 'Stai superando i tuoi limiti! Ogni passo ti avvicina al tuo obiettivo. Push harder!'
  }
];

const studyTimes = [
  { value: 'morning', label: 'Mattino', emoji: '🌅', time: '06:00-10:00' },
  { value: 'afternoon', label: 'Pomeriggio', emoji: '☀️', time: '12:00-17:00' },
  { value: 'evening', label: 'Sera', emoji: '🌙', time: '18:00-23:00' },
  { value: 'flexible', label: 'Flessibile', emoji: '🔄', time: 'Quando capita' },
];

export const Step5Personalization: React.FC<Step5PersonalizationProps> = ({ 
  onNext, 
  onBack, 
  initialData 
}) => {
  const [selectedGamification, setSelectedGamification] = useState(
    initialData?.gamificationLevel || 'moderate'
  );
  const [selectedPersonality, setSelectedPersonality] = useState(
    initialData?.aiPersonality || 'friendly'
  );
  const [selectedDevice, setSelectedDevice] = useState(
    initialData?.preferredDevice || 'both'
  );
  const [selectedStudyTime, setSelectedStudyTime] = useState(
    initialData?.studyTimePreference || 'flexible'
  );
  const [notifications, setNotifications] = useState({
    dailyReminders: true,
    weeklyProgress: true,
    achievements: true,
    communityUpdates: false,
    newContent: true,
    ...initialData?.notificationPreferences
  });
  const [aiMessage, setAiMessage] = useState("Ultimo tocco! Personalizziamo ogni dettaglio per la tua esperienza perfetta! ✨");

  const {
    register,
    handleSubmit,
    formState: { isValid },
    setValue,
    watch
  } = useForm<Step5FormData>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      gamificationLevel: selectedGamification,
      aiPersonality: selectedPersonality,
      preferredDevice: selectedDevice,
      studyTimePreference: selectedStudyTime,
      notificationPreferences: notifications,
      motivationalQuotes: true,
      privacyLevel: 'friends',
      ...initialData
    },
    mode: 'onChange'
  });

  React.useEffect(() => {
    setValue('gamificationLevel', selectedGamification);
    setValue('aiPersonality', selectedPersonality);
    setValue('preferredDevice', selectedDevice);
    setValue('studyTimePreference', selectedStudyTime);
    setValue('notificationPreferences', notifications);
  }, [selectedGamification, selectedPersonality, selectedDevice, selectedStudyTime, notifications, setValue]);

  React.useEffect(() => {
    const personality = aiPersonalities.find(p => p.value === selectedPersonality);
    if (personality) {
      setAiMessage(`${personality.emoji} ${personality.sample}`);
    }
  }, [selectedPersonality]);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const onSubmit = (data: Step5FormData) => {
    setAiMessage("🚀 PERFETTO! Il tuo profilo è completo! Benvenuto nella tua nuova avventura di crescita!");
    setTimeout(() => onNext(data), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-8"
    >
      {/* AI Assistant */}
      <AIAvatar 
        message={aiMessage}
        emotion="excited"
        showMessage={true}
      />

      {/* Main Form Card */}
      <Card className="p-8 relative overflow-hidden" glow gradient>
        {/* Celebration Background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: '100%',
                opacity: 0
              }}
              animate={{
                y: [null, '-20%', null],
                opacity: [0, 0.8, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-16 h-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <SparklesIcon className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Il Tocco Finale
            </h2>
            <p className="text-gray-600 text-lg">
              Personalizza ogni dettaglio della tua esperienza
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Gamification Level */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                <span>Livello di Gamification</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gamificationLevels.map((level, index) => (
                  <motion.button
                    key={level.value}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGamification(level.value)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-center relative overflow-hidden ${
                      selectedGamification === level.value
                        ? 'border-transparent shadow-2xl'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Gradient Background */}
                    {selectedGamification === level.value && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${level.color} opacity-10`} />
                    )}
                    
                    <div className="relative z-10">
                      <div className="text-4xl mb-3">{level.emoji}</div>
                      <h4 className="font-bold text-gray-900 mb-2">{level.label}</h4>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                    
                    {/* Selection Ring */}
                    {selectedGamification === level.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 rounded-xl border-2 border-blue-500"
                      />
                    )}
                    
                    {/* Power Indicator */}
                    <div className="mt-3 flex justify-center space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < (level.value === 'minimal' ? 1 : level.value === 'moderate' ? 2 : 3)
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* AI Personality */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <HeartIcon className="w-6 h-6 text-red-500" />
                <span>Personalità dell'AI Tutor</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiPersonalities.map((personality, index) => (
                  <motion.button
                    key={personality.value}
                    type="button"
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPersonality(personality.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedPersonality === personality.value
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-3xl">{personality.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {personality.label}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {personality.description}
                        </p>
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <p className="text-xs text-gray-700 italic">
                            "{personality.sample}"
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection Indicator */}
                    {selectedPersonality === personality.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <SparklesIcon className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Device & Study Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Preferred Device */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <DevicePhoneMobileIcon className="w-5 h-5 text-purple-500" />
                  <span>Device Preferito</span>
                </h3>
                
                <div className="space-y-2">
                  {[
                    { value: 'desktop', label: 'Desktop', icon: ComputerDesktopIcon },
                    { value: 'mobile', label: 'Mobile', icon: DevicePhoneMobileIcon },
                    { value: 'both', label: 'Entrambi', icon: SparklesIcon }
                  ].map((device) => (
                    <motion.button
                      key={device.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDevice(device.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                        selectedDevice === device.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <device.icon className="w-5 h-5 text-purple-500" />
                      <span className="font-medium text-gray-900">{device.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Study Time */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  ⏰ Orario di Studio Preferito
                </h3>
                
                <div className="space-y-2">
                  {studyTimes.map((time) => (
                    <motion.button
                      key={time.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStudyTime(time.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                        selectedStudyTime === time.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{time.emoji}</span>
                        <span className="font-medium text-gray-900">{time.label}</span>
                      </div>
                      <span className="text-sm text-gray-500">{time.time}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Notification Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <BellIcon className="w-5 h-5 text-blue-500" />
                <span>Preferenze Notifiche</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(notifications).map(([key, value], index) => {
                  const labels = {
                    dailyReminders: 'Promemoria Giornalieri',
                    weeklyProgress: 'Report Settimanali',
                    achievements: 'Nuovi Achievement',
                    communityUpdates: 'Aggiornamenti Community',
                    newContent: 'Nuovi Contenuti'
                  };
                  
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                        value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">
                        {labels[key as keyof typeof labels]}
                      </span>
                      
                      <motion.div
                        animate={{ scale: value ? 1.2 : 1 }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          value ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        {value && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </motion.svg>
                        )}
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Final Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                🎯 Anteprima della Tua Esperienza
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gamification:</span>
                    <span className="font-semibold capitalize">{selectedGamification}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Personality:</span>
                    <span className="font-semibold capitalize">{selectedPersonality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Device:</span>
                    <span className="font-semibold capitalize">{selectedDevice}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Studio:</span>
                    <span className="font-semibold capitalize">{selectedStudyTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notifiche Attive:</span>
                    <span className="font-semibold">
                      {Object.values(notifications).filter(Boolean).length}/5
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex space-x-4 pt-6"
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onBack}
                className="flex-1"
              >
                Indietro
              </Button>
              
              <Button
                type="submit"
                size="lg"
                className="flex-2"
                disabled={!isValid}
                glow
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2" />
                Inizia l'Avventura!
              </Button>
            </motion.div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
};
