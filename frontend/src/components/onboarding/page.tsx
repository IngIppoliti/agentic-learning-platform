"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  UserIcon, 
  RocketLaunchIcon, 
  CpuChipIcon, 
  BrainIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { workflowAPI } from '@/lib/api';
import { MagicProgress } from '@/components/onboarding/MagicProgress';
import { Step1Profile } from '@/components/onboarding/steps/Step1Profile';
import { Step2Goals } from '@/components/onboarding/steps/Step2Goals';
import { Step3Skills } from '@/components/onboarding/steps/Step3Skills';
import { Step4Learning } from '@/components/onboarding/steps/Step4Learning';
import { Step5Personalization } from '@/components/onboarding/steps/Step5Personalization';

const onboardingSteps = [
  {
    id: 1,
    title: "Profilo",
    icon: <UserIcon className="w-6 h-6" />,
    description: "Chi sei"
  },
  {
    id: 2,
    title: "Obiettivi",
    icon: <RocketLaunchIcon className="w-6 h-6" />,
    description: "Dove vuoi arrivare"
  },
  {
    id: 3,
    title: "Competenze",
    icon: <CpuChipIcon className="w-6 h-6" />,
    description: "Le tue skills"
  },
  {
    id: 4,
    title: "Apprendimento",
    icon: <BrainIcon className="w-6 h-6" />,
    description: "Come impari"
  },
  {
    id: 5,
    title: "Personalizzazione",
    icon: <SparklesIcon className="w-6 h-6" />,
    description: "Il tocco finale"
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { onboardingStep, onboardingData, setOnboardingStep, setOnboardingData, resetOnboarding } = useProfileStore();
  
  const [currentStep, setCurrentStep] = useState(onboardingStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Update completed steps based on current step
    const completed = Array.from({ length: currentStep - 1 }, (_, i) => i + 1);
    setCompletedSteps(completed);
    setOnboardingStep(currentStep);
  }, [currentStep, setOnboardingStep]);

  const handleStepNext = (stepData: any) => {
    // Save step data
    setOnboardingData({ [`step${currentStep}`]: stepData });
    
    // Celebrazione per ogni step completato
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#8B5CF6', '#EC4899']
    });
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSubmission();
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmission = async () => {
    setIsSubmitting(true);
    
    try {
      // Grande celebrazione finale
      const celebration = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
          }));
          confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
          }));
        }, 250);
      };

      celebration();

      // Combina tutti i dati degli step
      const allData = { ...onboardingData, [`step${currentStep}`]: onboardingData[`step${currentStep}`] };
      
      // Prepara dati per il backend
      const profileData = {
        ...allData.step1,
        goals: allData.step2,
        preferences: {
          ...allData.step4,
          ...allData.step5
        },
        constraints: {
          daily_minutes: allData.step4?.dailyTimeCommitment || 60,
          budget_range: allData.step4?.budgetRange || '50-200'
        },
        self_assessment: allData.step3?.currentSkills || {}
      };

      const learningGoal = allData.step2?.primaryGoal || "Crescita professionale";

      // Esegui workflow di onboarding completo
      const result = await workflowAPI.executeNewUserOnboarding(profileData, learningGoal);

      toast.success('🎉 Profilo creato con successo! Benvenuto nella tua avventura!', {
        duration: 5000,
        icon: '🚀'
      });

      // Reset onboarding data
      resetOnboarding();

      // Redirect to dashboard dopo un breve delay per la celebrazione
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Onboarding submission error:', error);
      toast.error('Si è verificato un errore. Riprova tra poco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <SparklesIcon className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Creando la Tua Esperienza Magica...
          </h2>
          <p className="text-gray-600">
            La nostra AI sta preparando tutto per te! ✨
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/50 p-6">
        <div className="max-w-4xl mx-auto">
          <MagicProgress
            steps={onboardingSteps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1Profile
              key="step1"
              onNext={handleStepNext}
              initialData={onboardingData.step1}
            />
          )}
          {currentStep === 2 && (
            <Step2Goals
              key="step2"
              onNext={handleStepNext}
              onBack={handleStepBack}
              initialData={onboardingData.step2}
            />
          )}
          {currentStep === 3 && (
            <Step3Skills
              key="step3"
              onNext={handleStepNext}
              onBack={handleStepBack}
              initialData={onboardingData.step3}
            />
          )}
          {currentStep === 4 && (
            <Step4Learning
              key="step4"
              onNext={handleStepNext}
              onBack={handleStepBack}
              initialData={onboardingData.step4}
            />
          )}
          {currentStep === 5 && (
            <Step5Personalization
              key="step5"
              onNext={handleStepNext}
              onBack={handleStepBack}
              initialData={onboardingData.step5}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Background Magic Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{
              y: [null, -50, null],
              opacity: [0, 0.3, 0],
              rotate: [0, 180, 360],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon className="w-6 h-6 text-blue-400" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
