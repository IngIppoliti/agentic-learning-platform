"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserIcon, 
  CameraIcon, 
  BriefcaseIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AIAvatar } from '../AIAvatar';

// Validation Schema
const step1Schema = z.object({
  firstName: z.string().min(2, 'Nome deve essere almeno 2 caratteri'),
  lastName: z.string().min(2, 'Cognome deve essere almeno 2 caratteri'),
  ageRange: z.string().min(1, 'Seleziona la tua fascia di età'),
  educationLevel: z.string().min(1, 'Seleziona il tuo livello di istruzione'),
  currentRole: z.string().min(2, 'Descrivi il tuo ruolo attuale'),
  industry: z.string().min(2, 'Seleziona il tuo settore'),
  experienceYears: z.number().min(0).max(50),
});

type Step1FormData = z.infer<typeof step1Schema>;

interface Step1ProfileProps {
  onNext: (data: Step1FormData) => void;
  initialData?: Partial<Step1FormData>;
}

const ageRanges = [
  { value: '18-24', label: '18-24 anni', emoji: '🎓' },
  { value: '25-34', label: '25-34 anni', emoji: '💼' },
  { value: '35-44', label: '35-44 anni', emoji: '🚀' },
  { value: '45-54', label: '45-54 anni', emoji: '👑' },
  { value: '55+', label: '55+ anni', emoji: '🌟' },
];

const educationLevels = [
  { value: 'highschool', label: 'Diploma', emoji: '🎓' },
  { value: 'bachelor', label: 'Laurea Triennale', emoji: '🎓' },
  { value: 'master', label: 'Laurea Magistrale', emoji: '🎓' },
  { value: 'phd', label: 'Dottorato', emoji: '👨‍🎓' },
  { value: 'other', label: 'Altro', emoji: '📚' },
];

const industries = [
  { value: 'technology', label: 'Tecnologia', emoji: '💻', color: 'from-blue-500 to-cyan-500' },
  { value: 'finance', label: 'Finanza', emoji: '💰', color: 'from-green-500 to-emerald-500' },
  { value: 'healthcare', label: 'Sanità', emoji: '🏥', color: 'from-red-500 to-pink-500' },
  { value: 'education', label: 'Educazione', emoji: '📚', color: 'from-purple-500 to-indigo-500' },
  { value: 'marketing', label: 'Marketing', emoji: '📈', color: 'from-orange-500 to-yellow-500' },
  { value: 'design', label: 'Design', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  { value: 'consulting', label: 'Consulenza', emoji: '🤝', color: 'from-indigo-500 to-blue-500' },
  { value: 'other', label: 'Altro', emoji: '🌐', color: 'from-gray-500 to-slate-500' },
];

export const Step1Profile: React.FC<Step1ProfileProps> = ({ onNext, initialData }) => {
  const [selectedAgeRange, setSelectedAgeRange] = useState(initialData?.ageRange || '');
  const [selectedEducation, setSelectedEducation] = useState(initialData?.educationLevel || '');
  const [selectedIndustry, setSelectedIndustry] = useState(initialData?.industry || '');
  const [experienceYears, setExperienceYears] = useState(initialData?.experienceYears || 0);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("Ciao! Sono ARIA, la tua AI tutor. Iniziamo conoscendoci meglio! ✨");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: initialData,
    mode: 'onChange'
  });

  // Watch form changes to update AI messages
  const watchedFields = watch();
  
  React.useEffect(() => {
    const firstName = watchedFields.firstName;
    if (firstName && firstName.length > 2) {
      setAiMessage(`Ciao ${firstName}! Fantastico nome! Continua a raccontarmi di te 😊`);
    } else if (selectedIndustry) {
      const industry = industries.find(i => i.value === selectedIndustry);
      setAiMessage(`${industry?.emoji} ${industry?.label}! Settore interessante! Hai tanta esperienza in questo campo?`);
    }
  }, [watchedFields.firstName, selectedIndustry]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        setAiMessage("Perfetto! Ora ti riconosco! 📸 Hai un sorriso contagioso!");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const onSubmit = (data: Step1FormData) => {
    setAiMessage("Eccellente! Ora conosco le basi. Passiamo ai tuoi obiettivi! 🎯");
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
        emotion="happy"
        showMessage={true}
      />

      {/* Main Form Card */}
      <Card className="p-8" glow gradient>
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <UserIcon className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Chi Sei Tu?
          </h2>
          <p className="text-gray-600 text-lg">
            Raccontami qualcosa di te per creare il tuo profilo perfetto
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Photo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center cursor-pointer relative"
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-gray-400" />
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {/* Magic Ring Animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            <p className="text-sm text-gray-500 text-center">
              Carica una tua foto (opzionale)
            </p>
          </motion.div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Input
                label="Nome"
                placeholder="Il tuo nome"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                label="Cognome"
                placeholder="Il tuo cognome"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </motion.div>
          </div>

          {/* Age Range Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <label className="block text-sm font-semibold text-gray-700">
              Fascia di Età
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ageRanges.map((age, index) => (
                <motion.button
                  key={age.value}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAgeRange(age.value);
                    setValue('ageRange', age.value);
                  }}
                  className={clsx(
                    'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                    selectedAgeRange === age.value
                      ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="text-2xl mb-1">{age.emoji}</div>
                  <div className="text-sm font-medium text-gray-700">
                    {age.label}
                  </div>
                </motion.button>
              ))}
            </div>
            {errors.ageRange && (
              <p className="text-sm text-red-600">{errors.ageRange.message}</p>
            )}
          </motion.div>

          {/* Education Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <label className="block text-sm font-semibold text-gray-700">
              Livello di Istruzione
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {educationLevels.map((edu, index) => (
                <motion.button
                  key={edu.value}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedEducation(edu.value);
                    setValue('educationLevel', edu.value);
                  }}
                  className={clsx(
                    'p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3',
                    selectedEducation === edu.value
                      ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-xl">{edu.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {edu.label}
                  </span>
                </motion.button>
              ))}
            </div>
            {errors.educationLevel && (
              <p className="text-sm text-red-600">{errors.educationLevel.message}</p>
            )}
          </motion.div>

          {/* Current Role */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Input
              label="Ruolo Attuale"
              placeholder="es. Software Developer, Marketing Manager, Studente..."
              icon={<BriefcaseIcon className="w-5 h-5" />}
              error={errors.currentRole?.message}
              {...register('currentRole')}
            />
          </motion.div>

          {/* Industry Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-4"
          >
            <label className="block text-sm font-semibold text-gray-700">
              Settore di Attività
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {industries.map((industry, index) => (
                <motion.button
                  key={industry.value}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedIndustry(industry.value);
                    setValue('industry', industry.value);
                  }}
                  className={clsx(
                    'p-4 rounded-xl border-2 transition-all duration-200 text-center relative overflow-hidden',
                    selectedIndustry === industry.value
                      ? 'border-transparent shadow-xl shadow-gray-900/10'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {/* Gradient Background for Selected */}
                  {selectedIndustry === industry.value && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${industry.color} opacity-10`} />
                  )}
                  
                  <div className="relative z-10">
                    <div className="text-2xl mb-2">{industry.emoji}</div>
                    <div className="text-sm font-medium text-gray-700">
                      {industry.label}
                    </div>
                  </div>
                  
                  {/* Selection Ring */}
                  {selectedIndustry === industry.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-xl border-2 border-blue-500"
                    />
                  )}
                </motion.button>
              ))}
            </div>
            {errors.industry && (
              <p className="text-sm text-red-600">{errors.industry.message}</p>
            )}
          </motion.div>

          {/* Experience Years Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="space-y-4"
          >
            <label className="block text-sm font-semibold text-gray-700">
              Anni di Esperienza: {experienceYears}
            </label>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="30"
                value={experienceYears}
                onChange={(e) => {
                  const years = parseInt(e.target.value);
                  setExperienceYears(years);
                  setValue('experienceYears', years);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(experienceYears / 30) * 100}%, #E5E7EB ${(experienceYears / 30) * 100}%, #E5E7EB 100%)`
                }}
              />
              
              {/* Experience Level Indicators */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Principiante</span>
                <span>Intermedio</span>
                <span>Esperto</span>
                <span>Senior</span>
              </div>
            </div>
          </motion.div>

          {/* Next Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="pt-6"
          >
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isValid}
              glow
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Continua la Magia
            </Button>
          </motion.div>
        </form>
      </Card>
      
      {/* Magical Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{
              y: [null, -100, null],
              opacity: [0, 0.6, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon className="w-4 h-4 text-blue-400" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
