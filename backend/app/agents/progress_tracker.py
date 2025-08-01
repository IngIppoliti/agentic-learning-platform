
"""
📊 PROGRESS TRACKER AGENT - ADVANCED LEARNING ANALYTICS & INSIGHTS
Sistema avanzato di tracking progresso con analytics predittive e insights AI
"""
from typing import List, Dict, Optional, Tuple, Any
import asyncio
from datetime import datetime, timedelta
from dataclasses import dataclass
import json
import numpy as np
from scipy import stats
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans

from .base_agent import BaseAgent
from ..services.llm_service import LLMService
from ..services.analytics import AnalyticsService
from ..models.learning import LearningSession, Progress, Milestone

@dataclass
class ProgressMetrics:
    """Metriche progress complete"""
    user_id: str
    current_level: int
    xp_total: int
    xp_this_week: int
    xp_this_month: int
    completion_rate: float
    streak_days: int
    max_streak: int
    avg_session_duration: float
    skills_mastered: int
    skills_in_progress: int
    learning_velocity: float  # XP per hour
    consistency_score: float
    engagement_score: float
    predicted_next_level_date: Optional[datetime]
    performance_trend: str  # "improving", "stable", "declining"

@dataclass
class LearningInsight:
    """Insight personalizzato sull'apprendimento"""
    type: str  # "strength", "weakness", "opportunity", "warning"
    title: str
    description: str
    priority: int  # 1-5
    action_items: List[str]
    impact_score: float
    confidence: float
    supporting_data: Dict[str, Any]

@dataclass
class PredictiveAnalysis:
    """Analisi predittiva performance"""
    success_probability: float
    risk_factors: List[str]
    opportunity_factors: List[str]
    recommended_actions: List[str]
    timeline_prediction: Dict[str, datetime]
    confidence_interval: Tuple[float, float]

class ProgressTrackerAgent(BaseAgent):
    """
    📊 PROGRESS TRACKER AGENT

    Funzionalità:
    - Real-time progress tracking
    - Predictive analytics con ML
    - Personalized insights generation
    - Learning pattern analysis
    - Performance benchmarking
    - Adaptive recommendations
    - Gamification metrics
    """

    def __init__(self, llm_service: LLMService, analytics_service: AnalyticsService):
        super().__init__("ProgressTracker", "Advanced learning analytics and progress insights")
        self.llm_service = llm_service
        self.analytics_service = analytics_service
        self.scaler = MinMaxScaler()

        # Thresholds per insights
        self.thresholds = {
            'low_engagement': 0.3,
            'high_engagement': 0.8,
            'streak_risk': 2,  # giorni senza attività
            'velocity_decline': 0.2,  # 20% decrease
            'completion_excellent': 0.9,
            'completion_poor': 0.4
        }

    async def track_learning_session(
        self,
        user_id: str,
        session_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        📈 TRACKING SESSIONE APPRENDIMENTO
        Real-time tracking con analytics immediate
        """
        try:
            # 1. REGISTRA SESSIONE
            session_metrics = await self._process_session_data(user_id, session_data)

            # 2. AGGIORNA METRICHE GLOBALI
            updated_metrics = await self._update_user_metrics(user_id, session_metrics)

            # 3. ANALISI IN TEMPO REALE
            real_time_insights = await self._generate_real_time_insights(
                user_id, session_metrics, updated_metrics
            )

            # 4. TRIGGER NOTIFICATIONS se necessario
            notifications = await self._check_milestone_triggers(user_id, updated_metrics)

            await self.log_activity(
                f"Tracked session for user {user_id}: {session_metrics['duration']}min, "
                f"{session_metrics['xp_gained']} XP"
            )

            return {
                'session_metrics': session_metrics,
                'updated_metrics': updated_metrics,
                'insights': real_time_insights,
                'notifications': notifications,
                'timestamp': datetime.now()
            }

        except Exception as e:
            await self.log_error(f"Session tracking failed: {str(e)}")
            return {}

    async def get_comprehensive_progress(
        self,
        user_id: str,
        timeframe_days: int = 30
    ) -> ProgressMetrics:
        """
        🎯 PROGRESS COMPLETO con analytics avanzate
        """
        try:
            # 1. DATI RAW da database
            raw_data = await self._fetch_user_progress_data(user_id, timeframe_days)

            # 2. CALCOLO METRICHE BASE
            base_metrics = await self._calculate_base_metrics(raw_data)

            # 3. ADVANCED ANALYTICS
            advanced_metrics = await self._calculate_advanced_metrics(raw_data, base_metrics)

            # 4. PREDICTIVE ANALYSIS
            predictions = await self._generate_predictions(raw_data, advanced_metrics)

            # 5. COMPOSIZIONE FINAL METRICS
            progress_metrics = ProgressMetrics(
                user_id=user_id,
                current_level=base_metrics['level'],
                xp_total=base_metrics['xp_total'],
                xp_this_week=base_metrics['xp_week'],
                xp_this_month=base_metrics['xp_month'],
                completion_rate=base_metrics['completion_rate'],
                streak_days=base_metrics['streak_current'],
                max_streak=base_metrics['streak_max'],
                avg_session_duration=advanced_metrics['avg_session_duration'],
                skills_mastered=advanced_metrics['skills_mastered'],
                skills_in_progress=advanced_metrics['skills_in_progress'],
                learning_velocity=advanced_metrics['learning_velocity'],
                consistency_score=advanced_metrics['consistency_score'],
                engagement_score=advanced_metrics['engagement_score'],
                predicted_next_level_date=predictions.get('next_level_date'),
                performance_trend=predictions.get('trend', 'stable')
            )

            return progress_metrics

        except Exception as e:
            await self.log_error(f"Progress calculation failed: {str(e)}")
            return None

    async def generate_learning_insights(
        self,
        user_id: str,
        timeframe_days: int = 14
    ) -> List[LearningInsight]:
        """
        🧠 GENERAZIONE INSIGHTS PERSONALIZZATI
        AI-powered insights con actionable recommendations
        """
        try:
            # 1. ANALISI DATI UTENTE
            user_data = await self._fetch_user_progress_data(user_id, timeframe_days)
            progress_metrics = await self.get_comprehensive_progress(user_id, timeframe_days)

            # 2. PATTERN ANALYSIS
            patterns = await self._analyze_learning_patterns(user_data)

            # 3. INSIGHTS GENERATION
            insights = []

            # Performance Insights
            performance_insights = await self._generate_performance_insights(
                progress_metrics, patterns
            )
            insights.extend(performance_insights)

            # Behavioral Insights
            behavioral_insights = await self._generate_behavioral_insights(
                user_data, patterns
            )
            insights.extend(behavioral_insights)

            # Opportunity Insights
            opportunity_insights = await self._generate_opportunity_insights(
                progress_metrics, patterns
            )
            insights.extend(opportunity_insights)

            # 4. PRIORITIZZAZIONE INSIGHTS
            prioritized_insights = await self._prioritize_insights(insights)

            # 5. AI ENHANCEMENT delle spiegazioni
            enhanced_insights = await self._enhance_insights_with_ai(prioritized_insights)

            return enhanced_insights[:10]  # Top 10 insights

        except Exception as e:
            await self.log_error(f"Insights generation failed: {str(e)}")
            return []

    async def predict_learning_outcomes(
        self,
        user_id: str,
        target_skill: str,
        timeframe_weeks: int = 12
    ) -> PredictiveAnalysis:
        """
        🔮 ANALISI PREDITTIVA OUTCOMES
        ML-powered predictions per success probability
        """
        try:
            # 1. HISTORICAL DATA ANALYSIS
            historical_data = await self._fetch_user_progress_data(user_id, 90)

            # 2. FEATURE ENGINEERING
            features = await self._extract_predictive_features(historical_data, target_skill)

            # 3. PREDICTION MODEL (simplified)
            predictions = await self._run_prediction_model(features, target_skill, timeframe_weeks)

            # 4. RISK & OPPORTUNITY ANALYSIS
            risk_analysis = await self._analyze_risk_factors(features, predictions)
            opportunity_analysis = await self._analyze_opportunities(features, predictions)

            # 5. ACTIONABLE RECOMMENDATIONS
            recommendations = await self._generate_predictive_recommendations(
                predictions, risk_analysis, opportunity_analysis
            )

            return PredictiveAnalysis(
                success_probability=predictions['success_probability'],
                risk_factors=risk_analysis['factors'],
                opportunity_factors=opportunity_analysis['factors'],
                recommended_actions=recommendations,
                timeline_prediction=predictions['timeline'],
                confidence_interval=predictions['confidence_interval']
            )

        except Exception as e:
            await self.log_error(f"Predictive analysis failed: {str(e)}")
            return None

    async def _process_session_data(
        self,
        user_id: str,
        session_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """🔄 Processing dati sessione"""

        # Calcolo metriche sessione
        duration = session_data.get('duration', 0)  # minuti
        activities_completed = session_data.get('activities_completed', 0)
        correct_answers = session_data.get('correct_answers', 0)
        total_answers = session_data.get('total_answers', 1)

        # XP calculation
        base_xp = activities_completed * 10
        accuracy_bonus = (correct_answers / total_answers) * 20 if total_answers > 0 else 0
        duration_bonus = min(duration * 2, 50)  # max 50 XP da durata

        xp_gained = int(base_xp + accuracy_bonus + duration_bonus)

        return {
            'user_id': user_id,
            'duration': duration,
            'activities_completed': activities_completed,
            'accuracy': correct_answers / total_answers if total_answers > 0 else 0,
            'xp_gained': xp_gained,
            'engagement_score': min(duration / 30, 1.0),  # normalizzato a 30min
            'efficiency_score': activities_completed / max(duration, 1),
            'timestamp': datetime.now()
        }

    async def _calculate_base_metrics(self, raw_data: Dict) -> Dict:
        """📊 Calcolo metriche base"""

        # Mock calculation (in produzione userebbe real DB queries)
        return {
            'level': np.random.randint(1, 50),
            'xp_total': np.random.randint(1000, 10000),
            'xp_week': np.random.randint(100, 1000),
            'xp_month': np.random.randint(500, 3000),
            'completion_rate': round(np.random.uniform(0.4, 0.95), 2),
            'streak_current': np.random.randint(0, 30),
            'streak_max': np.random.randint(5, 60)
        }

    async def _calculate_advanced_metrics(
        self,
        raw_data: Dict,
        base_metrics: Dict
    ) -> Dict:
        """🎯 Calcolo metriche avanzate"""

        return {
            'avg_session_duration': round(np.random.uniform(15, 45), 1),
            'skills_mastered': np.random.randint(5, 25),
            'skills_in_progress': np.random.randint(2, 8),
            'learning_velocity': round(np.random.uniform(50, 200), 1),  # XP/hour
            'consistency_score': round(np.random.uniform(0.5, 1.0), 2),
            'engagement_score': round(np.random.uniform(0.6, 0.95), 2)
        }

    async def _generate_predictions(
        self,
        raw_data: Dict,
        advanced_metrics: Dict
    ) -> Dict:
        """🔮 Generazione predictions"""

        # Prediction trend
        trends = ['improving', 'stable', 'declining']
        trend = np.random.choice(trends, p=[0.4, 0.4, 0.2])

        # Next level prediction
        days_to_next_level = np.random.randint(7, 30)
        next_level_date = datetime.now() + timedelta(days=days_to_next_level)

        return {
            'trend': trend,
            'next_level_date': next_level_date,
            'confidence': round(np.random.uniform(0.7, 0.95), 2)
        }

    async def _generate_performance_insights(
        self,
        metrics: ProgressMetrics,
        patterns: Dict
    ) -> List[LearningInsight]:
        """🎯 Insights performance"""

        insights = []

        # Streak insight
        if metrics.streak_days > 7:
            insights.append(LearningInsight(
                type="strength",
                title="🔥 Streak Incredibile!",
                description=f"Hai mantenuto una streak di {metrics.streak_days} giorni! La consistenza è la chiave del successo.",
                priority=1,
                action_items=["Continua così!", "Punta ai 30 giorni consecutivi"],
                impact_score=0.9,
                confidence=0.95,
                supporting_data={'streak_days': metrics.streak_days}
            ))
        elif metrics.streak_days == 0:
            insights.append(LearningInsight(
                type="warning",
                title="⚠️ Streak Interrotta",
                description="La tua streak si è interrotta. Ripartiamo subito per riprendere il ritmo!",
                priority=2,
                action_items=["Completa una lezione oggi", "Imposta reminder giornalieri"],
                impact_score=0.7,
                confidence=0.9,
                supporting_data={'days_since_last': 1}
            ))

        # Velocity insight
        if metrics.learning_velocity > 150:
            insights.append(LearningInsight(
                type="strength",
                title="⚡ Velocità Supersonica!",
                description=f"Stai apprendendo a {metrics.learning_velocity} XP/ora - molto sopra la media!",
                priority=1,
                action_items=["Mantieni questo ritmo", "Considera contenuti più avanzati"],
                impact_score=0.8,
                confidence=0.85,
                supporting_data={'velocity': metrics.learning_velocity}
            ))

        return insights

    async def _generate_behavioral_insights(
        self,
        user_data: Dict,
        patterns: Dict
    ) -> List[LearningInsight]:
        """🧠 Insights comportamentali"""

        insights = []

        # Pattern orario (mock)
        best_hour = np.random.randint(9, 21)
        insights.append(LearningInsight(
            type="opportunity",
            title="⏰ Orario Ottimale Identificato",
            description=f"I tuoi picchi di performance sono intorno alle {best_hour}:00. Sfrutta questo momento!",
            priority=2,
            action_items=[f"Programma sessioni alle {best_hour}:00", "Blocca questo slot nel calendario"],
            impact_score=0.6,
            confidence=0.8,
            supporting_data={'optimal_hour': best_hour}
        ))

        return insights

    async def _generate_opportunity_insights(
        self,
        metrics: ProgressMetrics,
        patterns: Dict
    ) -> List[LearningInsight]:
        """🚀 Insights opportunità"""

        insights = []

        # Skill gap opportunity
        if metrics.skills_in_progress > 5:
            insights.append(LearningInsight(
                type="opportunity",
                title="🎯 Focus Su Meno Skills",
                description=f"Hai {metrics.skills_in_progress} skill in corso. Concentrati su 2-3 per risultati migliori.",
                priority=3,
                action_items=["Seleziona 3 skill prioritarie", "Completa una skill prima di iniziarne altre"],
                impact_score=0.7,
                confidence=0.75,
                supporting_data={'skills_in_progress': metrics.skills_in_progress}
            ))

        return insights

    async def _prioritize_insights(self, insights: List[LearningInsight]) -> List[LearningInsight]:
        """📋 Prioritizzazione insights"""

        # Sort per priority e impact_score
        return sorted(
            insights,
            key=lambda x: (x.priority, -x.impact_score)
        )

    async def _enhance_insights_with_ai(
        self,
        insights: List[LearningInsight]
    ) -> List[LearningInsight]:
        """🤖 Enhancement insights con AI"""

        enhanced_insights = []

        for insight in insights:
            # AI enhancement del description
            prompt = f"""
            Migliora questa descrizione di insight per l'apprendimento:

            Titolo: {insight.title}
            Descrizione attuale: {insight.description}
            Tipo: {insight.type}

            Crea una descrizione più coinvolgente, motivante e specifica (max 100 parole):
            """

            try:
                enhanced_description = await self.llm_service.generate_completion(
                    prompt=prompt,
                    max_tokens=120,
                    temperature=0.7
                )

                insight.description = enhanced_description.strip()

            except Exception as e:
                # Keep original se enhancement fails
                pass

            enhanced_insights.append(insight)

        return enhanced_insights

    async def _fetch_user_progress_data(
        self,
        user_id: str,
        timeframe_days: int
    ) -> Dict:
        """📥 Fetch dati progress utente"""

        # Mock data structure (in produzione farebbe query DB reali)
        return {
            'sessions': [
                {'date': datetime.now() - timedelta(days=i), 'xp': np.random.randint(50, 200)}
                for i in range(timeframe_days)
            ],
            'activities': np.random.randint(100, 500),
            'time_spent': np.random.randint(1000, 5000),  # minuti
            'skills': ['Python', 'JavaScript', 'React', 'ML', 'Data Science']
        }

    async def _analyze_learning_patterns(self, user_data: Dict) -> Dict:
        """🔍 Analisi pattern apprendimento"""

        return {
            'peak_hours': [9, 14, 20],
            'best_days': ['Monday', 'Wednesday', 'Friday'],
            'preferred_content_types': ['video', 'interactive'],
            'learning_style': 'visual',
            'difficulty_preference': 'progressive'
        }

    async def _extract_predictive_features(
        self,
        historical_data: Dict,
        target_skill: str
    ) -> Dict:
        """🔧 Feature extraction per predictions"""

        return {
            'avg_daily_xp': np.random.uniform(50, 200),
            'consistency_score': np.random.uniform(0.5, 1.0),
            'skill_affinity': np.random.uniform(0.6, 0.95),
            'time_availability': np.random.uniform(30, 120),  # minuti/giorno
            'current_skill_level': np.random.randint(1, 10),
            'historical_success_rate': np.random.uniform(0.7, 0.95)
        }

    async def _run_prediction_model(
        self,
        features: Dict,
        target_skill: str,
        timeframe_weeks: int
    ) -> Dict:
        """🤖 Prediction model execution"""

        # Simplified prediction model
        base_probability = features['historical_success_rate']
        consistency_factor = features['consistency_score']
        affinity_factor = features['skill_affinity']

        success_probability = (
            base_probability * 0.4 +
            consistency_factor * 0.3 +
            affinity_factor * 0.3
        )

        # Timeline prediction
        weeks_needed = max(4, timeframe_weeks - int(consistency_factor * 4))
        completion_date = datetime.now() + timedelta(weeks=weeks_needed)

        return {
            'success_probability': round(success_probability, 2),
            'timeline': {
                'estimated_completion': completion_date,
                'milestone_1': datetime.now() + timedelta(weeks=weeks_needed//3),
                'milestone_2': datetime.now() + timedelta(weeks=2*weeks_needed//3)
            },
            'confidence_interval': (
                round(success_probability - 0.1, 2),
                round(success_probability + 0.1, 2)
            )
        }

    async def _analyze_risk_factors(self, features: Dict, predictions: Dict) -> Dict:
        """⚠️ Analisi fattori di rischio"""

        risk_factors = []

        if features['consistency_score'] < 0.6:
            risk_factors.append("Bassa consistenza nelle sessioni di studio")

        if features['time_availability'] < 60:
            risk_factors.append("Tempo limitato disponibile per l'apprendimento")

        if features['current_skill_level'] < 3:
            risk_factors.append("Livello skill corrente ancora base")

        return {'factors': risk_factors}

    async def _analyze_opportunities(self, features: Dict, predictions: Dict) -> Dict:
        """🚀 Analisi opportunità"""

        opportunity_factors = []

        if features['skill_affinity'] > 0.8:
            opportunity_factors.append("Alta affinità con l'argomento")

        if features['avg_daily_xp'] > 150:
            opportunity_factors.append("Ritmo di apprendimento accelerato")

        if features['historical_success_rate'] > 0.85:
            opportunity_factors.append("Track record di successo eccellente")

        return {'factors': opportunity_factors}

    async def _generate_predictive_recommendations(
        self,
        predictions: Dict,
        risk_analysis: Dict,
        opportunity_analysis: Dict
    ) -> List[str]:
        """💡 Raccomandazioni da analisi predittiva"""

        recommendations = []

        if predictions['success_probability'] > 0.8:
            recommendations.append("🚀 Mantieni il ritmo attuale - sei sulla strada giusta!")
            recommendations.append("🎯 Considera di aumentare la difficoltà per accelerare")
        else:
            recommendations.append("⚡ Aumenta la frequenza delle sessioni")
            recommendations.append("🎯 Concentrati su review e consolidamento")

        # Risk-based recommendations
        if risk_analysis['factors']:
            recommendations.append("⚠️ Lavora sulla consistenza - programma sessioni fisse")

        # Opportunity-based recommendations
        if opportunity_analysis['factors']:
            recommendations.append("🚀 Sfrutta i tuoi punti di forza per accelerare")

        return recommendations

    async def _update_user_metrics(
        self,
        user_id: str,
        session_metrics: Dict
    ) -> Dict:
        """🔄 Aggiornamento metriche utente"""

        # In produzione aggiornerebbe il database
        # Per ora return mock updated metrics
        return {
            'total_xp': session_metrics.get('xp_gained', 0) + np.random.randint(1000, 5000),
            'level': np.random.randint(1, 30),
            'streak_updated': True,
            'new_achievements': np.random.choice([True, False], p=[0.3, 0.7])
        }

    async def _generate_real_time_insights(
        self,
        user_id: str,
        session_metrics: Dict,
        updated_metrics: Dict
    ) -> List[str]:
        """⚡ Insights real-time post-sessione"""

        insights = []

        if session_metrics['accuracy'] > 0.9:
            insights.append("🎯 Accuratezza eccellente! Sei padrone dell'argomento!")

        if session_metrics['duration'] > 45:
            insights.append("⏰ Sessione lunga e produttiva - ottima concentrazione!")

        if updated_metrics.get('new_achievements'):
            insights.append("🏆 Hai sbloccato un nuovo achievement!")

        return insights

    async def _check_milestone_triggers(
        self,
        user_id: str,
        updated_metrics: Dict
    ) -> List[Dict]:
        """🎊 Check trigger milestone e notifications"""

        notifications = []

        # Level up notification
        if np.random.random() < 0.1:  # 10% chance
            notifications.append({
                'type': 'level_up',
                'title': '🚀 Level Up!',
                'message': f'Congratulazioni! Hai raggiunto il livello {updated_metrics["level"]}!',
                'priority': 'high'
            })

        # Streak milestone
        if np.random.random() < 0.05:  # 5% chance
            notifications.append({
                'type': 'streak_milestone',
                'title': '🔥 Streak Milestone!',
                'message': 'Hai raggiunto 7 giorni consecutivi!',
                'priority': 'medium'
            })

        return notifications
