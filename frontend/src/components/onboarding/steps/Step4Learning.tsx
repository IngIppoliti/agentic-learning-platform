"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  EyeIcon,
  SpeakerWaveIcon,
  HandRaisedIcon,
  BookOpenIcon,
  ClockIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  AdjustmentsHorizontalIcon,
  BrainIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AIAvatar } from '../AIAvatar';

const step4Schema = z.object({
  learningStyle: z.record(z.number().min(0).max(1)),
  preferredContentTypes: z.array(z.string()).min(1, 'Seleziona almeno un tipo di contenuto'),
  dailyTimeCommitment: z.number().min(15).max(480),
  weeklyTimeCommitment: z.number().min(2).max(40),
  budgetRange: z.string().min(1, 'Seleziona un budget'),
  preferredPace: z.string().min(1, 'Seleziona un ritmo'),
  languages: z.array(z.string()).min(1, 'Seleziona almeno una lingua'),
  difficultyPreference: z.string().min(1, 'Seleziona una preferenza di difficoltà'),
});

type Step4FormData = z.infer<typeof step4Schema>;

interface Step4LearningProps {
  onNext: (data: Step4FormData) => void;
  onBack: () => void;
  initialData?: Partial<Step4FormData>;
}

const learningStyleQuestions = [
  {
    id: 'visual',
    question: 'Preferisco imparare guardando diagrammi, grafici e video',
    icon: EyeIcon,
    color: 'from-blue-500 to-cyan-500',
    emoji: '👁️'
  },
  {
    id: 'auditory',
    question: 'Imparo meglio ascoltando spiegazioni e podcast',
    icon: SpeakerWaveIcon,
    color: 'from-green-500 to-emerald-500',
    emoji: '👂'
  },
  {
    id: 'kinesthetic',
    question: 'Preferisco imparare facendo pratica e esperimenti',
    icon: HandRaisedIcon,
    color: 'from-purple-500 to-pink-500',
    emoji: '🤏'
  },
  {
    id: 'reading',
    question: 'Mi piace leggere testi dettagliati e prendere appunti',
    icon: BookOpenIcon,
    color: 'from-orange-500 to-red-500',
    emoji: '📚'
  }
];

const contentTypes = [
  { id: 'video', name: 'Video Lezioni', emoji: '🎬', description: 'Tutorial e corsi video' },
  { id: 'text', name: 'Articoli & Guide', emoji: '📄', description: 'Documentazione scritta' },
  { id: 'interactive', name: 'Esercizi Interattivi', emoji: '🎮', description: 'Quiz e simulazioni' },
  { id: 'audio', name: 'Podcast & Audio', emoji: '🎧', description: 'Contenuti audio' },
  { id: 'practice', name: 'Progetti Pratici', emoji: '🛠️', description: 'Hands-on experience' },
  { id: 'community', name: 'Discussioni', emoji: '💬', description: 'Forum e gruppi' },
];

const budgetRanges = [
  { value: '0-50', label: 'Gratuito/Low Cost', emoji: '🆓', description: 'Fino a 50€/mese' },
  { value: '50-200', label: 'Investimento Base', emoji: '💡', description: '50-200€/mese' },
  { value: '200-500', label: 'Investimento Pro', emoji: '💼', description: '200-500€/mese' },
  { value: '500+', label: 'Investimento Premium', emoji: '👑', description: '500€+/mese' },
];

const paceOptions = [
  { value: 'slow', label: 'Rilassato', emoji: '🐢', description: 'Passo lento e approfondito' },
  { value: 'medium', label: 'Bilanciato', emoji: '🚶', description: 'Ritmo moderato' },
  { value: 'fast', label: 'Intensivo', emoji: '🏃', description: 'Passo veloce e sfidante' },
];

const languages = [
  { value: 'it', label: 'Italiano', emoji: '🇮🇹' },
  { value: 'en', label: 'English', emoji: '🇬🇧' },
  { value: 'fr', label: 'Français', emoji: '🇫🇷' },
  { value: 'es', label: 'Español', emoji: '🇪🇸' },
  { value: 'de', label: 'Deutsch', emoji: '🇩🇪' },
];

const difficultyLevels = [
  { value: 'beginner', label: 'Principiante', emoji: '🌱', description: 'Parti dalle basi' },
  { value: 'intermediate', label: 'Intermedio', emoji: '🌿', description: 'Hai già qualche base' },
  { value: 'advanced', label: 'Avanzato', emoji: '🌳', description: 'Cerca sfide complesse' },
  { value: 'expert', label: 'Esperto', emoji: '🏔️', description: 'Vuoi specializzazioni' },
];

export const Step4Learning: React.FC<Step4LearningProps> = ({ onNext, onBack, initialData }) => {
  const [learningStyles, setLearningStyles] = useState<Record<string, number>>(
    initialData?.learningStyle || { visual: 0.5, auditory: 0.5, kinesthetic: 0.5, reading: 0.5 }
  );
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(initialData?.preferredContentTypes || []);
  const [dailyTime, setDailyTime] = useState(initialData?.dailyTimeCommitment || 60);
  const [weeklyTime, setWeeklyTime] = useState(initialData?.weeklyTimeCommitment || 7);
  const [selectedBudget, setSelectedBudget] = useState(initialData?.budgetRange || '');
  const [selectedPace, setSelectedPace] = useState(initialData?.preferredPace || '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialData?.languages || ['it']);
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialData?.difficultyPreference || '');
  const [aiMessage, setAiMessage] = useState("Ora scopriamo come il tuo cervello apprende meglio! La scienza dell'apprendimento! 🧠");

  const {
    handleSubmit,
    formState: { isValid },
    setValue
  } = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: initialData,
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('learningStyle', learningStyles);
    setValue('preferredContentTypes', selectedContentTypes);
    setValue('dailyTimeCommitment', dailyTime);
    setValue('weeklyTimeCommitment', weeklyTime);
    setValue('budgetRange', selectedBudget);
    setValue('preferredPace', selectedPace);
    setValue('languages', selectedLanguages);
    setValue('difficultyPreference', selectedDifficulty);
  }, [learningStyles, selectedContentTypes, dailyTime, weeklyTime, selectedBudget, selectedPace, selectedLanguages, selectedDifficulty, setValue]);

  // AI message updates
  useEffect(() => {
    const dominantStyle = Object.entries(learningStyles).reduce((a, b) => learningStyles[a[0]] > learningStyles[b[0]] ? a : b)[0];
    const styleEmojis = { visual: '👁️', auditory: '👂', kinesthetic: '🤏', reading: '📚' };
    
    if (Math.max(...Object.values(learningStyles)) > 0.7) {
      setAiMessage(`${styleEmojis[dominantStyle as keyof typeof styleEmojis]} Perfetto! Vedo che sei un learner ${dominantStyle}! Ottimizzerò tutto per te!`);
    } else if (selectedContentTypes.length > 3) {
      setAiMessage("🎨 Fantastico! Ti piace la varietà nei contenuti! Creeremo un mix perfetto!");
    }
  }, [learningStyles, selectedContentTypes]);

  const getDominantLearningStyle = () => {
    return Object.entries(learningStyles).reduce((a, b) => learningStyles[a[0]] > learningStyles[b[0]] ? a : b);
  };

  const handleStyleChange = (styleId: string, value: number) => {
    setLearningStyles(prev => ({
      ...prev,
      [styleId]: value / 100
    }));
  };

  const handleContentTypeToggle = (typeId: string) => {
    const updated = selectedContentTypes.includes(typeId)
      ? selectedContentTypes.filter(id => id !== typeId)
      : [...selectedContentTypes, typeId];
    setSelectedContentTypes(updated);
  };

  const handleLanguageToggle = (langId: string) => {
    const updated = selectedLanguages.includes(langId)
      ? selectedLanguages.filter(id => id !== langId)
      : [...selectedLanguages, langId];
    setSelectedLanguages(updated);
  };

  const onSubmit = (data: Step4FormData) => {
    setAiMessage("Il tuo profilo di apprendimento è completo! Ultima domanda: personalizza la tua esperienza! 🎯");
    setTimeout(() => onNext(data), 1000);
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
        emotion="thinking"
        showMessage={true}
      />

      {/* Main Form Card */}
      <Card className="p-8 relative overflow-hidden" glow gradient>
        {/* Neural Network Background */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Neural connections */}
            {[...Array(20)].map((_, i) => (
              <motion.circle
                key={i}
                cx={Math.random() * 100}
                cy={Math.random() * 100}
                r="1"
                fill="#3B82F6"
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </svg>
        </div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <BrainIcon className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Come Impari Meglio?
            </h2>
            <p className="text-gray-600 text-lg">
              Scopriamo il tuo stile di apprendimento ottimale
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Learning Style Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                🧠 Assessment Neuroscientifico
              </h3>
              
              {learningStyleQuestions.map((question, index) => {
                const value = Math.round(learningStyles[question.id] * 100);
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${question.color} flex items-center justify-center`}>
                        <question.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{question.question}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm text-gray-500">Non sono d'accordo</span>
                          <div className="flex-1 relative">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={value}
                              onChange={(e) => handleStyleChange(question.id, parseInt(e.target.value))}
                              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, 
                                  #E5E7EB 0%, #E5E7EB ${value}%, 
                                  #3B82F6 ${value}%, #3B82F6 100%)`
                              }}
                            />
                            {/* Neural pulse effect */}
                            <motion.div
                              className="absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 pointer-events-none"
                              style={{ left: `${value}%`, marginLeft: '-8px' }}
                              animate={{
                                boxShadow: [
                                  '0 0 0 0 rgba(59, 130, 246, 0.7)',
                                  '0 0 0 10px rgba(59, 130, 246, 0)',
                                  '0 0 0 0 rgba(59, 130, 246, 0)'
                                ]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeOut"
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">Totalmente d'accordo</span>
                          <span className="text-lg ml-2">{question.emoji}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Learning Style Results */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl"
              >
                <h4 className="font-semibold text-gray-900 mb-4 text-center">
                  🎯 Il Tuo Profilo di Apprendimento
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {learningStyleQuestions.map((question) => {
                    const percentage = Math.round(learningStyles[question.id] * 100);
                    return (
                      <div key={question.id} className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${question.color} flex items-center justify-center mb-2`}>
                          <span className="text-white font-bold">{percentage}%</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 capitalize">
                          {question.id}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Dominante: <span className="font-semibold capitalize">{getDominantLearningStyle()[0]}</span> 
                    ({Math.round(getDominantLearningStyle()[1] * 100)}%)
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Content Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                📚 Tipi di Contenuto Preferiti
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {contentTypes.map((type, index) => (
                  <motion.button
                    key={type.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleContentTypeToggle(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedContentTypes.includes(type.id)
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{type.emoji}</span>
                      <h4 className="font-semibold text-gray-900">{type.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                    
                    {selectedContentTypes.includes(type.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-2 flex items-center space-x-1 text-blue-600 text-sm"
                      >
                        <SparklesIcon className="w-4 h-4" />
                        <span>Selezionato</span>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Time Commitment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Daily Time */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tempo Giornaliero: {dailyTime} min
                  </h3>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min="15"
                    max="240"
                    step="15"
                    value={dailyTime}
                    onChange={(e) => setDailyTime(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, 
                        #3B82F6 0%, #3B82F6 ${((dailyTime - 15) / 225) * 100}%, 
                        #E5E7EB ${((dailyTime - 15) / 225) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>15 min</span>
                    <span>2 ore</span>
                    <span>4+ ore</span>
                  </div>
                </div>
              </div>

              {/* Weekly Time */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  ⚡ Ore Settimanali: {weeklyTime}h
                </h3>
                
                <div className="relative">
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={weeklyTime}
                    onChange={(e) => setWeeklyTime(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, 
                        #10B981 0%, #10B981 ${((weeklyTime - 2) / 38) * 100}%, 
                        #E5E7EB ${((weeklyTime - 2) / 38) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>2h</span>
                    <span>20h</span>
                    <span>40h+</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Budget Range */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Budget Mensile
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {budgetRanges.map((budget, index) => (
                  <motion.button
                    key={budget.value}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBudget(budget.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      selectedBudget === budget.value
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{budget.emoji}</div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {budget.label}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {budget.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Learning Pace */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                🏃 Ritmo di Apprendimento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {paceOptions.map((pace, index) => (
                  <motion.button
                    key={pace.value}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPace(pace.value)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                      selectedPace === pace.value
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-3">{pace.emoji}</div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {pace.label}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {pace.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Languages & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Languages */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <LanguageIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Lingue</h3>
                </div>
                
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLanguageToggle(lang.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                        selectedLanguages.includes(lang.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{lang.emoji}</span>
                      <span className="font-medium text-gray-900">{lang.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Difficulty */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Difficoltà</h3>
                </div>
                
                <div className="space-y-2">
                  {difficultyLevels.map((level) => (
                    <motion.button
                      key={level.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDifficulty(level.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedDifficulty === level.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{level.emoji}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{level.label}</h4>
                          <p className="text-sm text-gray-600">{level.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
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
                <BrainIcon className="w-5 h-5 mr-2" />
                Ottimizza l'Apprendimento!
              </Button>
            </motion.div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
};
