'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useWeeklyStats } from '@/hooks/useDashboard';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Zap,
  Brain,
  Trophy,
  Star,
  Activity,
  PieChart,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  BookOpen,
  Award
} from 'lucide-react';

// 🎯 TYPES AGGIORNATI PER API DATA
interface WeeklyData {
  week_start: string;
  xp_gained: number;
  lessons_completed: number;
  quizzes_completed: number;
  learning_time_minutes: number;
  days_active: number;
  average_session_time: number;
}

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  unit?: string;
}

interface WeeklyStatsProps {
  weeksBack?: number;
  className?: string;
  showInsights?: boolean;
  compact?: boolean;
}

const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  weeksBack = 4,
  className = "",
  showInsights: initialShowInsights = true,
  compact = false
}) => {
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'xp_gained' | 'learning_time_minutes' | 'lessons_completed' | 'quizzes_completed'>('xp_gained');
  const [showInsights, setShowInsights] = useState(initialShowInsights);
  
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });

  // 🔄 FETCH DATA FROM API
  const { data: weeklyStatsData, isLoading, isError, refetch } = useWeeklyStats(weeksBack);

  // 🎨 LOADING STATE
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-br from-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
              <div>
                <div className="w-48 h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="w-32 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl p-4">
                <div className="w-full h-16 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex justify-center space-x-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-12 h-48 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (isError || !weeklyStatsData) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-red-400 opacity-50" />
          <p className="text-lg font-semibold text-white mb-2">Errore caricamento statistiche</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Riprova</span>
          </button>
        </div>
      </div>
    );
  }

  // 📊 DATA PROCESSING
  const { weekly_data, trends, summary } = weeklyStatsData;

  // Convert API data format per compatibilato con il tuo componente
  const processedWeeklyData: Array<WeeklyData & { day: string; xpGained: number; hoursStudied: number; lessonsCompleted: number; streakMaintained: boolean }> = 
    weekly_data.map((week, index) => ({
      ...week,
      day: `Settimana ${index + 1}`,
      xpGained: week.xp_gained,
      hoursStudied: Math.round(week.learning_time_minutes / 60 * 10) / 10,
      lessonsCompleted: week.lessons_completed,
      streakMaintained: week.days_active >= 5 // Consider 5+ days as streak maintained
    }));

  // 📈 GENERATE STATS CARDS FROM API DATA
  const generateStatsCards = (): StatCard[] => {
    const currentWeek = weekly_data[0] || {};
    const previousWeek = weekly_data[1] || {};
    
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const getChangeType = (change: number): 'increase' | 'decrease' | 'neutral' => {
      if (change > 0) return 'increase';
      if (change < 0) return 'decrease';
      return 'neutral';
    };

    return [
      {
        title: 'XP Totali Settimana',
        value: currentWeek.xp_gained || 0,
        change: calculateChange(currentWeek.xp_gained || 0, previousWeek.xp_gained || 0),
        changeType: getChangeType(calculateChange(currentWeek.xp_gained || 0, previousWeek.xp_gained || 0)),
        icon: Zap,
        color: '#8B5CF6',
        unit: 'XP'
      },
      {
        title: 'Ore di Studio',
        value: Math.round((currentWeek.learning_time_minutes || 0) / 60 * 10) / 10,
        change: calculateChange(currentWeek.learning_time_minutes || 0, previousWeek.learning_time_minutes || 0),
        changeType: getChangeType(calculateChange(currentWeek.learning_time_minutes || 0, previousWeek.learning_time_minutes || 0)),
        icon: Clock,
        color: '#10B981',
        unit: 'h'
      },
      {
        title: 'Lezioni Completate',
        value: currentWeek.lessons_completed || 0,
        change: calculateChange(currentWeek.lessons_completed || 0, previousWeek.lessons_completed || 0),
        changeType: getChangeType(calculateChange(currentWeek.lessons_completed || 0, previousWeek.lessons_completed || 0)),
        icon: BookOpen,
        color: '#F59E0B',
        unit: 'lezioni'
      },
      {
        title: 'Quiz Completati',
        value: currentWeek.quizzes_completed || 0,
        change: calculateChange(currentWeek.quizzes_completed || 0, previousWeek.quizzes_completed || 0),
        changeType: getChangeType(calculateChange(currentWeek.quizzes_completed || 0, previousWeek.quizzes_completed || 0)),
        icon: Award,
        color: '#EF4444',
        unit: 'quiz'
      }
    ];
  };

  const stats = generateStatsCards();

  // 📊 CALCOLI PER INSIGHTS (aggiornati con dati API)
  const totalXP = summary.average_weekly_xp * summary.total_weeks_tracked;
  const totalHours = summary.average_weekly_time / 60;
  const averageDaily = summary.average_weekly_xp / 7;
  const bestWeek = weekly_data.reduce((best, week) => 
    week.xp_gained > best.xp_gained ? week : best, weekly_data[0] || {}
  );
  const consistencyScore = summary.total_weeks_tracked > 0 ? 
    (weekly_data.filter(week => week.days_active >= 5).length / summary.total_weeks_tracked) * 100 : 0;

  // 🎨 CONFIGURAZIONI METRICHE (manteniamo le tue)
  const metricConfig = {
    xp_gained: {
      label: 'XP Guadagnati',
      color: '#8B5CF6',
      unit: ' XP',
      icon: Zap,
      key: 'xpGained' as const
    },
    learning_time_minutes: {
      label: 'Minuti di Studio',
      color: '#10B981',
      unit: ' min',
      icon: Clock,
      key: 'learning_time_minutes' as const
    },
    lessons_completed: {
      label: 'Lezioni Completate',
      color: '#F59E0B',
      unit: ' lezioni',
      icon: Brain,
      key: 'lessonsCompleted' as const
    },
    quizzes_completed: {
      label: 'Quiz Completati',
      color: '#EF4444',
      unit: ' quiz',
      icon: Award,
      key: 'quizzes_completed' as const
    }
  };

  const currentConfig = metricConfig[selectedMetric];

  // 📏 CALCOLA ALTEZZA NORMALIZZATA PER LE BARRE
  const maxValue = Math.max(...processedWeeklyData.map(week => {
    if (selectedMetric === 'learning_time_minutes') {
      return week.learning_time_minutes;
    }
    return week[selectedMetric];
  }));
  const chartHeight = 200;

  // 📊 COMPONENTE BARRA DEL GRAFICO (manteniamo la tua con dati API)
  const ChartBar = ({ week, index }: { week: WeeklyData & { day: string; xpGained: number; hoursStudied: number; lessonsCompleted: number; streakMaintained: boolean }; index: number }) => {
    const value = selectedMetric === 'learning_time_minutes' ? week.learning_time_minutes : week[selectedMetric];
    const normalizedHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
    const isSelected = selectedWeek === week.day;

    return (
      <motion.div
        className="flex flex-col items-center cursor-pointer group"
        onClick={() => setSelectedWeek(isSelected ? null : week.day)}
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { 
          opacity: 1, 
          y: 0,
          transition: { delay: index * 0.1 }
        } : {}}
      >
        {/* Valore sopra la barra */}
        <motion.div
          className={`text-xs font-semibold mb-2 transition-colors ${
            isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 + index * 0.1 }}
        >
          {value}{currentConfig.unit}
        </motion.div>

        {/* Barra */}
        <div className="relative mb-3" style={{ height: chartHeight }}>
          <motion.div
            className={`absolute bottom-0 w-12 rounded-t-lg transition-all duration-300 ${
              isSelected 
                ? 'shadow-lg shadow-purple-500/25' 
                : 'group-hover:shadow-md group-hover:shadow-purple-500/20'
            }`}
            style={{ 
              backgroundColor: currentConfig.color,
              opacity: isSelected ? 1 : 0.7
            }}
            initial={{ height: 0 }}
            animate={{ height: normalizedHeight }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.6, ease: "easeOut" }}
          />

          {/* Indicatore settimana attiva */}
          {week.streakMaintained && (
            <motion.div
              className="absolute -top-6 left-1/2 transform -translate-x-1/2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
            >
              <Star className="h-4 w-4 text-amber-400 fill-current" />
            </motion.div>
          )}
        </div>

        {/* Label settimana */}
        <motion.div
          className={`text-sm font-medium transition-colors ${
            isSelected ? 'text-purple-400' : 'text-gray-300 group-hover:text-white'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          S{index + 1}
        </motion.div>
      </motion.div>
    );
  };

  // 🃏 COMPONENTE CARTA STATISTICA (manteniamo la tua)
  const StatisticCard = ({ stat, index }: { stat: StatCard; index: number }) => {
    const Icon = stat.icon;
    const isPositive = stat.changeType === 'increase';
    const isNegative = stat.changeType === 'decrease';

    return (
      <motion.div
        className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { 
          opacity: 1, 
          scale: 1,
          transition: { delay: 0.2 + index * 0.1 }
        } : {}}
        whileHover={{ scale: 1.05, y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: stat.color + '33' }}>
            <Icon className="h-5 w-5" style={{ color: stat.color }} />
          </div>

          {stat.changeType !== 'neutral' && (
            <div className={`flex items-center space-x-1 text-xs ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span>{Math.abs(stat.change)}%</span>
            </div>
          )}
        </div>

        <div className="mb-1">
          <motion.div
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            {stat.unit && <span className="text-sm text-gray-400 ml-1">{stat.unit}</span>}
          </motion.div>
        </div>

        <p className="text-sm text-gray-400">{stat.title}</p>
      </motion.div>
    );
  };

  // 🏃‍♂️ COMPACT VERSION
  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-br from-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Questa Settimana</h4>
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {stats.slice(0, 4).map((stat, index) => (
              <div key={stat.title} className="text-center">
                <div className="text-lg font-bold text-white">{stat.value}{stat.unit}</div>
                <div className="text-xs text-gray-400">{stat.title.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div
        className="bg-gradient-to-br from-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white">Statistiche Settimanali</h3>
              <p className="text-gray-400">Il tuo progresso nelle ultime {weeksBack} settimane</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => setShowInsights(!showInsights)}
              className={`p-2 rounded-lg transition-colors ${
                showInsights ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700/50 text-gray-400'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showInsights ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <StatisticCard key={stat.title} stat={stat} index={index} />
          ))}
        </div>

        {/* Chart Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Andamento Settimanale</h4>

            {/* Metric Selector */}
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((metric) => {
                const config = metricConfig[metric];
                const Icon = config.icon;
                return (
                  <motion.button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedMetric === metric
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:block">{config.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex justify-center space-x-6">
              {processedWeeklyData.map((week, index) => (
                <ChartBar key={week.day} week={week} index={index} />
              ))}
            </div>

            {/* Selected Week Details */}
            <AnimatePresence>
              {selectedWeek && (
                <motion.div
                  className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {(() => {
                    const weekData = processedWeeklyData.find(w => w.day === selectedWeek);
                    if (!weekData) return null;

                    return (
                      <div>
                        <h5 className="text-lg font-semibold text-white mb-3">{selectedWeek}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{weekData.xp_gained}</div>
                            <div className="text-sm text-gray-400">XP Guadagnati</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{Math.round(weekData.learning_time_minutes / 60 * 10) / 10}</div>
                            <div className="text-sm text-gray-400">Ore di Studio</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-400">{weekData.lessons_completed}</div>
                            <div className="text-sm text-gray-400">Lezioni</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">{weekData.quizzes_completed}</div>
                            <div className="text-sm text-gray-400">Quiz</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-center space-x-4">
                          <div className="flex items-center text-blue-400">
                            <Activity className="h-4 w-4 mr-2" />
                            <span className="text-sm">{weekData.days_active} giorni attivi</span>
                          </div>
                          {weekData.streakMaintained && (
                            <div className="flex items-center text-amber-400">
                              <Star className="h-4 w-4 mr-2 fill-current" />
                              <span className="text-sm">Obiettivo raggiunto!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Insights Section con dati API */}
        <AnimatePresence>
          {showInsights && (
            <motion.div
              className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="h-6 w-6 text-indigo-400" />
                <h4 className="text-lg font-semibold text-white">Insights Intelligenti</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  className="bg-gray-800/50 rounded-lg p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <span className="font-semibold text-green-400">Migliore Settimana</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="font-bold">{summary.best_week_xp} XP</span> nella tua settimana migliore!
                    {summary.best_week_xp > summary.average_weekly_xp * 1.5 && " 🔥 Performance eccezionale!"}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gray-800/50 rounded-lg p-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    <span className="font-semibold text-blue-400">Consistenza</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="font-bold text-amber-400">{consistencyScore.toFixed(0)}%</span> delle settimane con 5+ giorni attivi!
                    {trends.consistency_score > 0.8 && " 🌟 Ottima costanza!"}
                    {trends.consistency_score === 1 && " 🏆 Consistenza perfetta!"}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gray-800/50 rounded-lg p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    <span className="font-semibold text-purple-400">Media Settimanale</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="font-bold">{Math.round(summary.average_weekly_xp)} XP</span> a settimana
                    {trends.xp_change > 0 && ` 📈 Trend: +${trends.xp_change} XP`}
                    {trends.xp_change < 0 && ` 📉 Trend: ${trends.xp_change} XP`}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gray-800/50 rounded-lg p-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-400" />
                    <span className="font-semibold text-orange-400">Tempo Medio</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="font-bold">{Math.round(summary.average_weekly_time / 60 * 10) / 10} ore</span> a settimana
                    {trends.time_change > 0 && ` ⏰ +${Math.round(trends.time_change / 60)} min/settimana`}
                  </p>
                </motion.div>
              </div>

              {/* Motivational message basato sui dati reali */}
              <motion.div
                className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-purple-300 font-medium">
                  {summary.average_weekly_xp > 500 && "🚀 Sei in fuoco! Continua così!"}
                  {summary.average_weekly_xp <= 500 && summary.average_weekly_xp > 200 && "⭐ Ottimo progresso! Stai migliorando!"}
                  {summary.average_weekly_xp <= 200 && "💪 Ogni passo conta! Continua a crescere!"}
                  {trends.xp_change > 50 && " 📈 Il tuo trend è fantastico!"}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default WeeklyStats;
