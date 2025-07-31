"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

// Validation Schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username deve essere almeno 3 caratteri'),
  email: z.string().email('Email non valida'),
  password: z.string()
    .min(8, 'Password deve essere almeno 8 caratteri')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password deve contenere almeno una lettera maiuscola, una minuscola e un numero'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const benefits = [
  "Percorsi di apprendimento personalizzati con AI",
  "Progress tracking dettagliato e gamification",
  "Accesso a contenuti premium selezionati",
  "Community di learners e mentorship",
  "Certificazioni riconosciute nel settore"
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.username);
      toast.success('Account creato con successo!', {
        icon: '🎉',
        duration: 4000,
      });
      router.push('/onboarding');
    } catch (error) {
      toast.error('Errore durante la registrazione');
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '' };
    
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    const labels = ['', 'Molto debole', 'Debole', 'Media', 'Forte', 'Molto forte'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
    
    return { score, label: labels[score], color: colors[score] };
  };

  const passwordStrength = getPasswordStrength(password || '');

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 flex">
        {/* Left Panel - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Agentic Learning
              </h1>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Inizia il Tuo Viaggio di
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Crescita Professionale
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-8">
              Unisciti a migliaia di professionisti che hanno trasformato la loro carriera 
              con percorsi di apprendimento personalizzati dall'AI.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center"
                >
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="p-8" glow gradient>
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:hidden flex items-center justify-center mb-4"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  Crea il Tuo Account
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600"
                >
                  Inizia gratis e sblocca il tuo potenziale
                </motion.p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Input
                    label="Username"
                    type="text"
                    icon={<UserIcon className="w-5 h-5" />}
                    placeholder="Il tuo username"
                    error={errors.username?.message}
                    {...register('username')}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Input
                    label="Email"
                    type="email"
                    icon={<EnvelopeIcon className="w-5 h-5" />}
                    placeholder="il-tuo-email@esempio.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Input
                    label="Password"
                    type="password"
                    icon={<LockClosedIcon className="w-5 h-5" />}
                    placeholder="Crea una password sicura"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Sicurezza password</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score >= 4 ? 'text-green-600' : 
                          passwordStrength.score >= 3 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Input
                    label="Conferma Password"
                    type="password"
                    icon={<LockClosedIcon className="w-5 h-5" />}
                    placeholder="Ripeti la password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    loading={isSubmitting}
                    className="w-full"
                    glow
                  >
                    Crea Account
                    <ArrowRightIcon className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>
              </form>

              {/* Terms */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center mt-6"
              >
                <p className="text-xs text-gray-500">
                  Registrandoti accetti i nostri{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                    Termini di Servizio
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </Link>
                </p>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center mt-6 pt-6 border-t border-gray-200"
              >
                <p className="text-sm text-gray-600">
                  Hai già un account?{' '}
                  <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Accedi
                  </Link>
                </p>
              </div>
            </Card>

            {/* Back to Home */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-center mt-6"
            >
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Torna alla home
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
