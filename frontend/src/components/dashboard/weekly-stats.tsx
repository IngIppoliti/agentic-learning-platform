import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
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
  EyeOff
} from 'lucide-react';

interface WeeklyData {
  day: string;
  xpGained: number;
  hoursStudied: number;
  lessonsCompleted: number;
  streakMaintained: boolean;
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
  weeklyData: WeeklyData[];
  stats: StatCard[];
  className?: string;
}

const WeeklyStats: React.FC<WeeklyStatsProps> = ({
  weeklyData,
  stats,
  className = ""
}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'bars' | 'lines'>('bars');
  const [selectedMetric, setSelectedMetric] = useState<'xpGained' | 'hoursStudied' | 'lessonsCompleted'>('xpGained');
  const [showInsights, setShowInsights] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });

  // Calcoli per insights
  const totalXP = weeklyData.reduce((sum, day) => sum + day.xpGained, 0);
  const totalHours = weeklyData.reduce((sum, day) => sum + day.hoursStudied, 0);
  const averageDaily = totalXP / weeklyData.length;
  const bestDay = weeklyData.reduce((best, day) => 
    day.xpGained > best.xpGained ? day : best
  );
  const streak = weeklyData.filter(day => day.streakMaintained).length;

  // Configurazioni metriche
  const metricConfig = {
    xpGained: {
      label: 'XP Guadagnati',
      color: '#8B5CF6',
      unit: 'XP',
      icon: Zap
    },
    hoursStudied: {
      label: 'Ore di Studio',
      color: '#10B981',
      unit: 'ore',
      icon: Clock
    },
    lessonsCompleted: {
      label: 'Lezioni Completate',
      color: '#F59E0B',
      unit: 'lezioni',
      icon: Brain
    }
  };

  const currentConfig = metricConfig[selectedMetric];

  // Calcola l'altezza normalizzata per le barre
  const maxValue = Math.max(...weeklyData.map(day => day[selectedMetric]));
  const chartHeight = 200;

  // Componente Barra del grafico
  const ChartBar = ({ day, index }: { day: WeeklyData; index: number }) => {
    const value = day[selectedMetric];
    const normalizedHeight = (value / maxValue) * chartHeight;
    const isSelected = selectedDay === day.day;

    return (
      <motion.div
        className="flex flex-col items-center cursor-pointer group"
        onClick={() => setSelectedDay(isSelected ? null : day.day)}
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

          {/* Indicatore streak */}
          {day.streakMaintained && (
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

        {/* Label giorno */}
        <motion.div
          className={`text-sm font-medium transition-colors ${
            isSelected ? 'text-purple-400' : 'text-gray-300 group-hover:text-white'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          {day.day.substring(0, 3)}
        </motion.div>
      </motion.div>
    );
  };

  // Componente Carta Statistica
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
              <p className="text-gray-400">Il tuo progresso negli ultimi 7 giorni</p>
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
              {weeklyData.map((day, index) => (
                <ChartBar key={day.day} day={day} index={index} />
              ))}
            </div>

            {/* Selected Day Details */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {(() => {
                    const dayData = weeklyData.find(d => d.day === selectedDay);
                    if (!dayData) return null;

                    return (
                      <div>
                        <h5 className="text-lg font-semibold text-white mb-3">{selectedDay}</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{dayData.xpGained}</div>
                            <div className="text-sm text-gray-400">XP Guadagnati</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{dayData.hoursStudied}</div>
                            <div className="text-sm text-gray-400">Ore di Studio</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-400">{dayData.lessonsCompleted}</div>
                            <div className="text-sm text-gray-400">Lezioni</div>
                          </div>
                        </div>
                        {dayData.streakMaintained && (
                          <div className="mt-3 flex items-center justify-center text-amber-400">
                            <Star className="h-4 w-4 mr-2 fill-current" />
                            <span className="text-sm">Streak mantenuto!</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Insights Section */}
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
                    <span className="font-semibold text-green-400">Migliore Giornata</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="font-bold">{bestDay.day}</span> con {bestDay.xpGained} XP guadagnati!
                    {bestDay.xpGained > averageDaily * 1.5 && " 🔥 Performance eccezionale!"}
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
                    Streak di <span className="font-bold text-amber-400">{streak} giorni</span> su 7!
                    {streak >= 5 && " 🌟 Ottima costanza!"}
                    {streak === 7 && " 🏆 Settimana perfetta!"}
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
                    <span className="font-semibold text-purple-400">Media Giornaliera</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="font-bold">{Math.round(averageDaily)} XP</span> al giorno
                    {averageDaily > 100 && " ⚡ Ritmo eccellente!"}
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
                    <span className="font-semibold text-orange-400">Tempo Totale</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="font-bold">{totalHours} ore</span> di studio questa settimana
                    {totalHours >= 10 && " 💪 Dedizione impressionante!"}
                  </p>
                </motion.div>
              </div>

              {/* Motivational message */}
              <motion.div
                className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-purple-300 font-medium">
                  {totalXP > 500 && "🚀 Sei in fuoco! Continua così!"}
                  {totalXP <= 500 && totalXP > 200 && "⭐ Ottimo progresso! Stai migliorando!"}
                  {totalXP <= 200 && "💪 Ogni passo conta! Continua a crescere!"}
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