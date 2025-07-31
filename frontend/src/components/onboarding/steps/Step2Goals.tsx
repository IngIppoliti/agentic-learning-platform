"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  RocketLaunchIcon,
  LightBulbIcon,
  TrophyIcon,
  StarIcon,
  ClockIcon,
  FireIcon,
  HeartIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AIAvatar } from '../AIAvatar';

const step2Schema = z.object({
  primaryGoal: z.string().min(10, 'Descrivi il tuo obiettivo principale (almeno 10 caratteri)'),
  timeline: z.string().min(1, 'Seleziona una timeline'),
  motivations: z.array(z.string()).min(1, 'Seleziona almeno una motivazione'),
  successDefinition: z.string().min(5, 'Descrivi cosa significa successo per te'),
  urgencyLevel: z.number().min(1).max(10),
});

type Step2FormData = z.infer<typeof step2Schema>;

interface Step2GoalsProps {
  onNext: (data: Step2FormData) => void;
  onBack: () => void;
  initialData?: Partial<Step2FormData>;
}

const timelines = [
  { value: '1-month', label: '1 Mese', emoji: '⚡', color: 'from-red-500 to-orange-500', intensity: 'Sprint' },
  { value: '3-months', label: '3 Mesi', emoji: '🚀', color: 'from-orange-500 to-yellow-500', intensity: 'Accelerato' },
  { value: '6-months', label: '6 Mesi', emoji: '🎯', color: 'from-yellow-500 to-green-500', intensity: 'Bilanciato' },
  { value: '1-year', label: '1 Anno', emoji: '🌱', color: 'from-green-500 to-blue-500', intensity: 'Solido' },
  { value: '2-years', label: '2+ Anni', emoji: '🏔️', color: 'from-blue-500 to-purple-500', intensity: 'Mastery' },
];

const motivations = [
  { id: 'career', label: 'Crescita Professionale', emoji: '📈', color: 'from-blue-500 to-cyan-500' },
  { id: 'salary', label: 'Aumento Stipendio', emoji: '💰', color: 'from-green-500 to-emerald-500' },
  { id: 'passion', label: 'Passione Personale', emoji: '❤️', color: 'from-red-500 to-pink-500' },
  { id: 'challenge', label: 'Nuove Sfide', emoji: '🎯', color: 'from-purple-500 to-indigo-500' },
  { id: 'security', label: 'Sicurezza Lavorativa', emoji: '🛡️', color: 'from-gray-500 to-slate-600' },
  { id: 'freedom', label: 'Libertà Finanziaria', emoji: '🦅', color: 'from-teal-500 to-cyan-500' },
  { id: 'impact', label: 'Impatto Sociale', emoji: '🌍', color: 'from-green-600 to-lime-500' },
  { id: 'creativity', label: 'Creatività', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
];

const goalSuggestions = [
  "Diventare un esperto in Data Science per migliorare le decisioni aziendali",
  "Acquisire competenze di leadership per guidare un team",
  "Imparare lo sviluppo web per creare la mia startup",
  "Specializzarmi in UX Design per creare prodotti che le persone amano",
  "Diventare consulente digitale indipendente",
  "Ottenere una certificazione professionale riconosciuta",
];

export const Step2Goals: React.FC<Step2GoalsProps> = ({ onNext, onBack, initialData }) => {
  const [selectedTimeline, setSelectedTimeline] = useState(initialData?.timeline || '');
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>(initialData?.motivations || []);
  const [urgencyLevel, setUrgencyLevel] = useState(initialData?.urgencyLevel || 5);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiMessage, setAiMessage] = useState("Perfetto! Ora parliamo dei tuoi sogni e obiettivi! Cosa vuoi conquistare? 🎯");
  const [goalText, setGoalText] = useState(initialData?.primaryGoal || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: initialData,
    mode: 'onChange'
  });

  const watchedGoal = watch('primaryGoal');

  useEffect(() => {
    if (watchedGoal && watchedGoal.length > 20) {
      setAiMessage("WOW! Questo obiettivo è fantastico! Vedo già il tuo futuro brillante! ✨");
    } else if (selectedTimeline) {
      const timeline = timelines.find(t => t.value === selectedTimeline);
      setAiMessage(`${timeline?.emoji} ${timeline?.intensity}! Mi piace questo ritmo! Quando vuoi raggiungere il successo?`);
    }
  }, [watchedGoal, selectedTimeline]);

  const handleMotivationToggle = (motivationId: string) => {
    const updated = selectedMotivations.includes(motivationId)
      ? selectedMotivations.filter(id => id !== motivationId)
      : [...selectedMotivations, motivationId];
    
    setSelectedMotivations(updated);
    setValue('motivations', updated);
    
    if (updated.length > 0) {
      setAiMessage(`${motivations.find(m => m.id === motivationId)?.emoji} Capisco perfettamente! La motivazione è tutto!`);
    }
  };

  const handleGoalSuggestion = (suggestion: string) => {
    setValue('primaryGoal', suggestion);
    setGoalText(suggestion);
    setShowSuggestions(false);
    setAiMessage("Eccellente scelta! Questo obiettivo ha un potenziale incredibile! 🚀");
  };

  const getUrgencyLabel = (level: number) => {
    if (level <= 3) return { label: 'Rilassato', emoji: '🌱', color: 'text-green-600' };
    if (level <= 6) return { label: 'Moderato', emoji: '⚡', color: 'text-yellow-600' };
    if (level <= 8) return { label: 'Urgente', emoji: '🔥', color: 'text-orange-600' };
    return { label: 'Critico', emoji: '💥', color: 'text-red-600' };
  };

  const urgencyInfo = getUrgencyLabel(urgencyLevel);

  const onSubmit = (data: Step2FormData) => {
    setAiMessage("I tuoi obiettivi sono chiari! Ora scopriamo le tue super-competenze! 💪");
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
        emotion="excited"
        showMessage={true}
      />

      {/* Main Form Card */}
      <Card className="p-8 relative overflow-hidden" glow gradient>
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, #3B82F6 2px, transparent 2px), radial-gradient(circle at 75% 75%, #8B5CF6 2px, transparent 2px)',
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <RocketLaunchIcon className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              I Tuoi Obiettivi
            </h2>
            <p className="text-gray-600 text-lg">
              Trasformiamo i tuoi sogni in un piano d'azione concreto
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Primary Goal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Il Tuo Obiettivo Principale
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  <LightBulbIcon className="w-4 h-4 mr-1" />
                  Ispirazioni
                </Button>
              </div>
              
              <div className="relative">
                <textarea
                  {...register('primaryGoal')}
                  value={goalText}
                  onChange={(e) => {
                    setGoalText(e.target.value);
                    setValue('primaryGoal', e.target.value);
                  }}
                  placeholder="Descrivi il tuo obiettivo principale in dettaglio..."
                  className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 resize-none h-24 bg-white/50 backdrop-blur-sm"
                />
                
                {/* Character Counter */}
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {goalText.length}/200
                </div>
              </div>
              
              {errors.primaryGoal && (
                <p className="text-sm text-red-600">{errors.primaryGoal.message}</p>
              )}

              {/* Goal Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-sm text-gray-600 mb-3">💡 Clicca su un'ispirazione:</p>
                    {goalSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        type="button"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleGoalSuggestion(suggestion)}
                        className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Timeline Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <label className="block text-sm font-semibold text-gray-700">
                In Quanto Tempo Vuoi Raggiungerlo?
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {timelines.map((timeline, index) => (
                  <motion.button
                    key={timeline.value}
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedTimeline(timeline.value);
                      setValue('timeline', timeline.value);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-center relative overflow-hidden ${
                      selectedTimeline === timeline.value
                        ? 'border-transparent shadow-xl'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Gradient Background */}
                    {selectedTimeline === timeline.value && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${timeline.color} opacity-10`} />
                    )}
                    
                    <div className="relative z-10">
                      <div className="text-3xl mb-2">{timeline.emoji}</div>
                      <div className="font-semibold text-gray-900 mb-1">
                        {timeline.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {timeline.intensity}
                      </div>
                    </div>
                    
                    {/* Selection Ring */}
                    {selectedTimeline === timeline.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 rounded-xl border-2 border-blue-500"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
              {errors.timeline && (
                <p className="text-sm text-red-600">{errors.timeline.message}</p>
              )}
            </motion.div>

            {/* Motivations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <label className="block text-sm font-semibold text-gray-700">
                Cosa Ti Motiva? (Seleziona tutto quello che si applica)
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {motivations.map((motivation, index) => (
                  <motion.button
                    key={motivation.id}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMotivationToggle(motivation.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center relative overflow-hidden ${
                      selectedMotivations.includes(motivation.id)
                        ? 'border-transparent shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Gradient Background */}
                    {selectedMotivations.includes(motivation.id) && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${motivation.color} opacity-15`} />
                    )}
                    
                    <div className="relative z-10">
                      <div className="text-2xl mb-2">{motivation.emoji}</div>
                      <div className="text-sm font-medium text-gray-700">
                        {motivation.label}
                      </div>
                    </div>
                    
                    {/* Selection Checkmark */}
                    {selectedMotivations.includes(motivation.id) && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              {errors.motivations && (
                <p className="text-sm text-red-600">{errors.motivations.message}</p>
              )}
            </motion.div>

            {/* Success Definition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Input
                label="Cosa Significa Successo Per Te?"
                placeholder="Quando saprai di aver raggiunto il tuo obiettivo?"
                icon={<TrophyIcon className="w-5 h-5" />}
                error={errors.successDefinition?.message}
                {...register('successDefinition')}
              />
            </motion.div>

            {/* Urgency Level */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Livello di Urgenza
                </label>
                <div className={`flex items-center space-x-2 ${urgencyInfo.color}`}>
                  <span className="text-lg">{urgencyInfo.emoji}</span>
                  <span className="font-semibold">{urgencyInfo.label}</span>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={urgencyLevel}
                  onChange={(e) => {
                    const level = parseInt(e.target.value);
                    setUrgencyLevel(level);
                    setValue('urgencyLevel', level);
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #10B981 0%, #10B981 ${urgencyLevel <= 3 ? (urgencyLevel / 10) * 100 : 30}%, 
                      #F59E0B ${urgencyLevel <= 3 ? 30 : (urgencyLevel <= 6 ? ((urgencyLevel - 3) / 7) * 100 + 30 : 60)}%, 
                      #EF4444 ${urgencyLevel <= 6 ? 60 : ((urgencyLevel - 6) / 4) * 40 + 60}%, 
                      #E5E7EB ${(urgencyLevel / 10) * 100}%, #E5E7EB 100%)`
                  }}
                />
                
                {/* Urgency Scale */}
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-green-600">🌱 Rilassato</span>
                  <span className="text-yellow-600">⚡ Moderato</span>
                  <span className="text-orange-600">🔥 Urgente</span>
                  <span className="text-red-600">💥 Critico</span>
                </div>
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
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
                <BoltIcon className="w-5 h-5 mr-2" />
                Accendi il Futuro!
              </Button>
            </motion.div>
          </form>
        </div>
      </Card>

      {/* Goal Visualization */}
      <AnimatePresence>
        {goalText.length > 10 && selectedTimeline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative"
          >
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50" glow>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🎯 La Tua Visione del Futuro
                </h3>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full mb-4"
                />
                
                <p className="text-gray-700 italic mb-4">
                  "{goalText}"
                </p>
                
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{timelines.find(t => t.value === selectedTimeline)?.label}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FireIcon className="w-4 h-4" />
                    <span>{urgencyInfo.label}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4" />
                    <span>{selectedMotivations.length} motivazioni</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
