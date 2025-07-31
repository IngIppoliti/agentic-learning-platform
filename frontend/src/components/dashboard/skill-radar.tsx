import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Brain, 
  Code, 
  Palette, 
  Database, 
  Zap, 
  Target, 
  TrendingUp,
  Star,
  ChevronRight,
  Info
} from 'lucide-react';

interface Skill {
  name: string;
  level: number;
  maxLevel: number;
  color: string;
  icon: React.ComponentType<any>;
  category: string;
  description?: string;
  recentGrowth?: number;
}

interface SkillRadarProps {
  skills: Skill[];
  className?: string;
}

const SkillRadar: React.FC<SkillRadarProps> = ({
  skills,
  className = ""
}) => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const ref = useRef(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });

  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;

  // Calcola le posizioni dei punti del radar
  const calculatePointPosition = (skill: Skill, index: number) => {
    const angle = (index * 2 * Math.PI) / skills.length - Math.PI / 2;
    const normalizedLevel = skill.level / skill.maxLevel;
    const radius = normalizedLevel * maxRadius;

    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      angle,
      radius,
      normalizedLevel
    };
  };

  // Genera i cerchi concentrici
  const concentricCircles = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Genera path per l'area del radar
  const generateRadarPath = (animationProgress: number) => {
    if (skills.length === 0) return "";

    const points = skills.map((skill, index) => {
      const pos = calculatePointPosition(skill, index);
      return {
        x: centerX + Math.cos(pos.angle) * (pos.radius * animationProgress),
        y: centerY + Math.sin(pos.angle) * (pos.radius * animationProgress)
      };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach(point => {
      path += ` L ${point.x} ${point.y}`;
    });
    path += " Z";

    return path;
  };

  // Componente Skill Point
  const SkillPoint = ({ skill, index, animationProgress }: { 
    skill: Skill; 
    index: number; 
    animationProgress: number 
  }) => {
    const pos = calculatePointPosition(skill, index);
    const currentRadius = pos.radius * animationProgress;
    const x = centerX + Math.cos(pos.angle) * currentRadius;
    const y = centerY + Math.sin(pos.angle) * currentRadius;
    const Icon = skill.icon;

    const isHovered = hoveredSkill === skill.name;
    const isSelected = selectedSkill?.name === skill.name;

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: 1, 
          scale: isHovered || isSelected ? 1.3 : 1,
          transition: { delay: index * 0.1, type: "spring", stiffness: 300 }
        }}
        whileHover={{ scale: 1.4 }}
        className="cursor-pointer"
        onClick={() => setSelectedSkill(skill)}
        onMouseEnter={() => setHoveredSkill(skill.name)}
        onMouseLeave={() => setHoveredSkill(null)}
      >
        {/* Glow effect */}
        <circle
          cx={x}
          cy={y}
          r={isHovered || isSelected ? 15 : 8}
          fill={skill.color}
          opacity={0.3}
          className="animate-pulse"
        />

        {/* Main point */}
        <circle
          cx={x}
          cy={y}
          r={isHovered || isSelected ? 8 : 5}
          fill={skill.color}
          stroke="white"
          strokeWidth={2}
          className="drop-shadow-lg"
        />

        {/* Skill label */}
        <text
          x={x + (Math.cos(pos.angle) * 20)}
          y={y + (Math.sin(pos.angle) * 20)}
          textAnchor="middle"
          className="text-xs font-semibold fill-white drop-shadow-md"
          style={{ 
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
            fontSize: isHovered || isSelected ? '12px' : '10px'
          }}
        >
          {skill.name}
        </text>

        {/* Level indicator */}
        <text
          x={x}
          y={y + 25}
          textAnchor="middle"
          className="text-xs fill-gray-300"
          style={{ fontSize: '8px' }}
        >
          {skill.level}/{skill.maxLevel}
        </text>
      </motion.g>
    );
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div
        className="bg-gradient-to-br from-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: isInView ? 360 : 0 }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              <Target className="h-8 w-8 text-cyan-400" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white">Radar Competenze</h3>
              <p className="text-gray-400">Visualizzazione delle tue abilità</p>
            </div>
          </div>

          {/* Overall score */}
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">
              {Math.round((skills.reduce((sum, skill) => sum + (skill.level / skill.maxLevel), 0) / skills.length) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Competenza Media</div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Radar Chart */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <motion.svg
                ref={svgRef}
                width="300"
                height="300"
                viewBox="0 0 300 300"
                className="drop-shadow-xl"
                initial={{ rotate: -90, opacity: 0 }}
                animate={isInView ? { rotate: 0, opacity: 1 } : {}}
                transition={{ duration: 1 }}
              >
                {/* Background grid */}
                <defs>
                  <radialGradient id="gridGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(56, 189, 248, 0.1)" />
                    <stop offset="100%" stopColor="rgba(56, 189, 248, 0.05)" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Concentric circles */}
                {concentricCircles.map((ratio, index) => (
                  <motion.circle
                    key={index}
                    cx={centerX}
                    cy={centerY}
                    r={maxRadius * ratio}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.3)"
                    strokeWidth={index === concentricCircles.length - 1 ? 2 : 1}
                    strokeDasharray={index % 2 === 0 ? "none" : "5,5"}
                    initial={{ r: 0, opacity: 0 }}
                    animate={isInView ? { 
                      r: maxRadius * ratio, 
                      opacity: 1,
                      transition: { delay: 0.2 + index * 0.1 }
                    } : {}}
                  />
                ))}

                {/* Axis lines */}
                {skills.map((_, index) => {
                  const angle = (index * 2 * Math.PI) / skills.length - Math.PI / 2;
                  const endX = centerX + Math.cos(angle) * maxRadius;
                  const endY = centerY + Math.sin(angle) * maxRadius;

                  return (
                    <motion.line
                      key={index}
                      x1={centerX}
                      y1={centerY}
                      x2={endX}
                      y2={endY}
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeWidth={1}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isInView ? { 
                        pathLength: 1, 
                        opacity: 1,
                        transition: { delay: 0.5 + index * 0.05 }
                      } : {}}
                    />
                  );
                })}

                {/* Radar area */}
                <motion.path
                  d={generateRadarPath(1)}
                  fill="url(#skillGradient)"
                  stroke="rgba(56, 189, 248, 0.8)"
                  strokeWidth={2}
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={isInView ? { 
                    pathLength: 1, 
                    opacity: 0.6,
                    transition: { delay: 1, duration: 1.5 }
                  } : {}}
                  onAnimationComplete={() => setAnimationComplete(true)}
                />

                <defs>
                  <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                    <stop offset="50%" stopColor="rgba(147, 51, 234, 0.4)" />
                    <stop offset="100%" stopColor="rgba(236, 72, 153, 0.4)" />
                  </linearGradient>
                </defs>

                {/* Skill points */}
                {animationComplete && skills.map((skill, index) => (
                  <SkillPoint
                    key={skill.name}
                    skill={skill}
                    index={index}
                    animationProgress={1}
                  />
                ))}
              </motion.svg>

              {/* Center info */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 2 }}
              >
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
                  <div className="text-lg font-bold text-cyan-400">
                    {skills.length}
                  </div>
                  <div className="text-xs text-gray-400">Competenze</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Skills List */}
          <div className="lg:w-80">
            <h4 className="text-lg font-semibold text-white mb-4">Dettaglio Competenze</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {skills.map((skill, index) => {
                const Icon = skill.icon;
                const progressPercentage = (skill.level / skill.maxLevel) * 100;
                const isActive = hoveredSkill === skill.name || selectedSkill?.name === skill.name;

                return (
                  <motion.div
                    key={skill.name}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/50' 
                        : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                    }`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: 1.5 + index * 0.1 }
                    } : {}}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedSkill(skill)}
                    onMouseEnter={() => setHoveredSkill(skill.name)}
                    onMouseLeave={() => setHoveredSkill(null)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: skill.color + '33' }}
                        >
                          <Icon className="h-4 w-4" style={{ color: skill.color }} />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-white">{skill.name}</h5>
                          <p className="text-xs text-gray-400">{skill.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {skill.level}/{skill.maxLevel}
                        </div>
                        {skill.recentGrowth && (
                          <div className="flex items-center text-xs text-green-400">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{skill.recentGrowth}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: skill.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ delay: 1.8 + index * 0.1, duration: 0.8 }}
                      />
                    </div>

                    {progressPercentage >= 80 && (
                      <div className="flex items-center justify-center mt-1">
                        <Star className="h-3 w-3 text-amber-400" />
                        <span className="text-xs text-amber-400 ml-1">Esperto</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSkill(null)}
          >
            <motion.div
              className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: selectedSkill.color + '33' }}
                >
                  <selectedSkill.icon className="h-10 w-10" style={{ color: selectedSkill.color }} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{selectedSkill.name}</h3>
                <p className="text-gray-400 mb-4">{selectedSkill.category}</p>

                {selectedSkill.description && (
                  <p className="text-gray-300 text-sm mb-4">{selectedSkill.description}</p>
                )}

                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {selectedSkill.level}
                      </div>
                      <div className="text-xs text-gray-400">Livello Attuale</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {Math.round((selectedSkill.level / selectedSkill.maxLevel) * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">Competenza</div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: selectedSkill.color,
                        width: `${(selectedSkill.level / selectedSkill.maxLevel) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {selectedSkill.recentGrowth && (
                  <div className="flex items-center justify-center text-green-400">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="text-sm">+{selectedSkill.recentGrowth} crescita recente</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillRadar;