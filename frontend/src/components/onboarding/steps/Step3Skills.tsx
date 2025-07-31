Copy"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CodeBracketIcon,
  PaintBrushIcon,
  ChartBarIcon,
  CpuChipIcon,
  MegaphoneIcon,
  UserGroupIcon,
  CogIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AIAvatar } from '../AIAvatar';

const step3Schema = z.object({
  currentSkills: z.record(z.number().min(0).max(10)),
  targetSkills: z.array(z.string()).min(1, 'Seleziona almeno una skill da imparare'),
  portfolioProjects: z.array(z.string()).optional(),
  customSkills: z.array(z.string()).optional(),
});

type Step3FormData = z.infer<typeof step3Schema>;

interface Step3SkillsProps {
  onNext: (data: Step3FormData) => void;
  onBack: () => void;
  initialData?: Partial<Step3FormData>;
}

const skillCategories = {
  technical: {
    name: 'Competenze Tecniche',
    icon: CodeBracketIcon,
    color: 'from-blue-500 to-cyan-500',
    skills: [
      { id: 'python', name: 'Python', icon: '🐍' },
      { id: 'javascript', name: 'JavaScript', icon: '⚡' },
      { id: 'react', name: 'React', icon: '⚛️' },
      { id: 'nodejs', name: 'Node.js', icon: '🟢' },
      { id: 'sql', name: 'SQL', icon: '🗄️' },
      { id: 'aws', name: 'AWS', icon: '☁️' },
      { id: 'docker', name: 'Docker', icon: '🐳' },
      { id: 'git', name: 'Git', icon: '📋' },
    ]
  },
  design: {
    name: 'Design & Creatività',
    icon: PaintBrushIcon,
    color: 'from-pink-500 to-rose-500',
    skills: [
      { id: 'figma', name: 'Figma', icon: '🎨' },
      { id: 'photoshop', name: 'Photoshop', icon: '🖼️' },
      { id: 'ux-ui', name: 'UX/UI Design', icon: '📱' },
      { id: 'illustration', name: 'Illustration', icon: '✏️' },
      { id: 'branding', name: 'Branding', icon: '🏷️' },
      { id: 'video-editing', name: 'Video Editing', icon: '🎬' },
    ]
  },
  analytics: {
    name: 'Data & Analytics',
    icon: ChartBarIcon,
    color: 'from-green-500 to-emerald-500',
    skills: [
      { id: 'excel', name: 'Excel', icon: '📊' },
      { id: 'powerbi', name: 'Power BI', icon: '📈' },
      { id: 'tableau', name: 'Tableau', icon: '📉' },
      { id: 'r', name: 'R', icon: '📋' },
      { id: 'statistics', name: 'Statistics', icon: '🔢' },
      { id: 'machine-learning', name: 'Machine Learning', icon: '🤖' },
    ]
  },
  marketing: {
    name: 'Marketing & Business',
    icon: MegaphoneIcon,
    color: 'from-orange-500 to-yellow-500',
    skills: [
      { id: 'seo', name: 'SEO', icon: '🔍' },
      { id: 'google-ads', name: 'Google Ads', icon: '📢' },
      { id: 'social-media', name: 'Social Media', icon: '📱' },
      { id: 'copywriting', name: 'Copywriting', icon: '✍️' },
      { id: 'email-marketing', name: 'Email Marketing', icon: '📧' },
      { id: 'project-management', name: 'Project Management', icon: '📋' },
    ]
  },
  soft: {
    name: 'Soft Skills',
    icon: UserGroupIcon,
    color: 'from-purple-500 to-indigo-500',
    skills: [
      { id: 'leadership', name: 'Leadership', icon: '👑' },
      { id: 'communication', name: 'Comunicazione', icon: '🗣️' },
      { id: 'teamwork', name: 'Teamwork', icon: '🤝' },
      { id: 'problem-solving', name: 'Problem Solving', icon: '🧩' },
      { id: 'time-management', name: 'Time Management', icon: '⏰' },
      { id: 'negotiation', name: 'Negoziazione', icon: '🤝' },
    ]
  }
};

export const Step3Skills: React.FC<Step3SkillsProps> = ({ onNext, onBack, initialData }) => {
  const [currentSkills, setCurrentSkills] = useState<Record<string, number>>(initialData?.currentSkills || {});
  const [targetSkills, setTargetSkills] = useState<string[]>(initialData?.targetSkills || []);
  const [customSkills, setCustomSkills] = useState<string[]>(initialData?.customSkills || []);
  const [newSkill, setNewSkill] = useState('');
  const [portfolioProjects, setPortfolioProjects] = useState<string[]>(initialData?.portfolioProjects || []);
  const [newProject, setNewProject] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('technical');
  const [aiMessage, setAiMessage] = useState("Ora scopriamo le tue super-competenze! Mostrami di cosa sei capace! 💪");

  const {
    handleSubmit,
    formState: { isValid },
    setValue
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: initialData,
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('currentSkills', currentSkills);
    setValue('targetSkills', targetSkills);
    setValue('customSkills', customSkills);
    setValue('portfolioProjects', portfolioProjects);
  }, [currentSkills, targetSkills, customSkills, portfolioProjects, setValue]);

  useEffect(() => {
    const skillCount = Object.keys(currentSkills).length;
    const targetCount = targetSkills.length;
    
    if (skillCount > 5) {
      setAiMessage("WOW! Sei un vero esperto! Con queste competenze andrai lontano! 🚀");
    } else if (targetCount > 3) {
      setAiMessage("Fantastico! Hai ambizioni grandi! Insieme raggiungeremo tutti questi obiettivi! ✨");
    } else if (skillCount > 0) {
      setAiMessage("Ottimo! Vedo già delle basi solide. Costruiamo sopra queste fondamenta! 🏗️");
    }
  }, [currentSkills, targetSkills]);

  const handleSkillRating = (skillId: string, rating: number) => {
    const updated = { ...currentSkills };
    if (rating === 0) {
      delete updated[skillId];
    } else {
      updated[skillId] = rating;
    }
    setCurrentSkills(updated);
  };

  const handleTargetSkillToggle = (skillId: string) => {
    const updated = targetSkills.includes(skillId)
      ? targetSkills.filter(id => id !== skillId)
      : [...targetSkills, skillId];
    setTargetSkills(updated);
  };

  const addCustomSkill = () => {
    if (newSkill.trim() && !customSkills.includes(newSkill.trim())) {
      setCustomSkills([...customSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeCustomSkill = (skill: string) => {
    setCustomSkills(customSkills.filter(s => s !== skill));
  };

  const addProject = () => {
    if (newProject.trim() && !portfolioProjects.includes(newProject.trim())) {
      setPortfolioProjects([...portfolioProjects, newProject.trim()]);
      setNewProject('');
    }
  };

  const removeProject = (project: string) => {
    setPortfolioProjects(portfolioProjects.filter(p => p !== project));
  };

  const getSkillLevel = (rating: number) => {
    if (rating <= 2) return { label: 'Principiante', color: 'text-red-500', bgColor: 'bg-red-100' };
    if (rating <= 5) return { label: 'Intermedio', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    if (rating <= 8) return { label: 'Avanzato', color: 'text-blue-500', bgColor: 'bg-blue-100' };
    return { label: 'Esperto', color: 'text-green-500', bgColor: 'bg-green-100' };
  };

  const onSubmit = (data: Step3FormData) => {
    setAiMessage("Le tue competenze sono impressionanti! Vediamo come preferisci imparare! 🎓");
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
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <CpuChipIcon className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Le Tue Super-Competenze
          </h2>
          <p className="text-gray-600 text-lg">
            Mappatura completa delle tue abilità attuali e future
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(skillCategories).map(([key, category]) => (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeCategory === key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Skills Section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {skillCategories[activeCategory as keyof typeof skillCategories].name}
                </h3>
                <p className="text-gray-600">
                  Valuta le tue competenze attuali e seleziona quelle che vuoi sviluppare
                </p>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillCategories[activeCategory as keyof typeof skillCategories].skills.map((skill, index) => {
                  const currentRating = currentSkills[skill.id] || 0;
                  const isTarget = targetSkills.includes(skill.id);
                  const skillLevel = getSkillLevel(currentRating);

                  return (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 space-y-3"
                    >
                      {/* Skill Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{skill.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                            {currentRating > 0 && (
                              <span className={`text-xs px-2 py-1 rounded-full ${skillLevel.bgColor} ${skillLevel.color}`}>
                                {skillLevel.label}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Target Toggle */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleTargetSkillToggle(skill.id)}
                          className={`p-2 rounded-full transition-all duration-200 ${
                            isTarget
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <PlusIcon className={`w-4 h-4 ${isTarget ? 'rotate-45' : ''} transition-transform duration-200`} />
                        </motion.button>
                      </div>

                      {/* Rating Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Competenza attuale</span>
                          <span>{currentRating}/10</span>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={currentRating}
                            onChange={(e) => handleSkillRating(skill.id, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, 
                                #3B82F6 0%, #3B82F6 ${(currentRating / 10) * 100}%, 
                                #E5E7EB ${(currentRating / 10) * 100}%, #E5E7EB 100%)`
                            }}
                          />
                          
                          {/* Skill Level Indicators */}
                          <div className="flex justify-between mt-1 text-xs text-gray-400">
                            <span>0</span>
                            <span>5</span>
                            <span>10</span>
                          </div>
                        </div>
                      </div>

                      {/* Target Badge */}
                      {isTarget && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          <SparklesIcon className="w-4 h-4" />
                          <span>Obiettivo di crescita</span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Custom Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Altre Competenze
            </h3>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Aggiungi una competenza personalizzata"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
              />
              <Button
                type="button"
                onClick={addCustomSkill}
                disabled={!newSkill.trim()}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Custom Skills List */}
            {customSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customSkills.map((skill, index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomSkill(skill)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Portfolio Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Progetti / Portfolio (Opzionale)
            </h3>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Descrivi un progetto significativo"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProject())}
              />
              <Button
                type="button"
                onClick={addProject}
                disabled={!newProject.trim()}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Projects List */}
            {portfolioProjects.length > 0 && (
              <div className="space-y-2">
                {portfolioProjects.map((project, index) => (
                  <motion.div
                    key={project}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="text-green-800">{project}</span>
                    <button
                      type="button"
                      onClick={() => removeProject(project)}
                      className="text-green-500 hover:text-green-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Skills Summary */}
          <AnimatePresence>
            {(Object.keys(currentSkills).length > 0 || targetSkills.length > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  🎯 Il Tuo Profilo Skills
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      💪 Competenze Attuali ({Object.keys(currentSkills).length})
                    </h4>
                    <div className="text-sm text-gray-600">
                      {Object.keys(currentSkills).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(currentSkills).slice(0, 5).map(([skill, rating]) => (
                            <div key={skill} className="flex justify-between">
                              <span className="capitalize">{skill.replace('-', ' ')}</span>
                              <span className="font-medium">{rating}/10</span>
                            </div>
                          ))}
                          {Object.keys(currentSkills).length > 5 && (
                            <div className="text-blue-600">+{Object.keys(currentSkills).length - 5} altre...</div>
                          )}
                        </div>
                      ) : (
                        'Nessuna competenza valutata'
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      🚀 Obiettivi di Crescita ({targetSkills.length})
                    </h4>
                    <div className="text-sm text-gray-600">
                      {targetSkills.length > 0 ? (
                        <div className="space-y-1">
                          {targetSkills.slice(0, 5).map(skill => (
                            <div key={skill} className="capitalize">
                              {skill.replace('-', ' ')}
                            </div>
                          ))}
                          {targetSkills.length > 5 && (
                            <div className="text-purple-600">+{targetSkills.length - 5} altre...</div>
                          )}
                        </div>
                      ) : (
                        'Seleziona skills da imparare'
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
              disabled={targetSkills.length === 0}
              glow
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Potenzia le Skills!
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};
