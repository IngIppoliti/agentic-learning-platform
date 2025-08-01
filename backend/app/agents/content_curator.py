
"""
🎯 CONTENT CURATOR AGENT - RAG POWERED CONTENT DISCOVERY & CURATION
Sistema avanzato di curazione contenuti con RAG, recommendation engine e ML
"""
from typing import List, Dict, Optional, Tuple
import asyncio
from datetime import datetime, timedelta
from dataclasses import dataclass
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .base_agent import BaseAgent
from ..services.llm_service import LLMService
from ..services.vector_service import VectorService
from ..models.learning import Content, UserPreference, ContentRating

@dataclass
class ContentRecommendation:
    """Raccomandazione contenuto con scoring e ragioni"""
    content_id: str
    title: str
    description: str
    content_type: str
    difficulty_level: int
    estimated_duration: int
    relevance_score: float
    engagement_prediction: float
    learning_path_fit: float
    reasons: List[str]
    tags: List[str]
    created_at: datetime

@dataclass
class CurationCriteria:
    """Criteri per la curazione dei contenuti"""
    user_id: str
    skill_level: int
    learning_objectives: List[str]
    preferred_content_types: List[str]
    time_availability: int  # minuti
    difficulty_preference: str
    industry_focus: Optional[str] = None

class ContentCuratorAgent(BaseAgent):
    """
    🎯 CONTENT CURATOR AGENT

    Funzionalità:
    - RAG-powered content discovery
    - Personalizzazione intelligente
    - Multi-modal content analysis
    - Trend detection e content freshness
    - Collaborative filtering
    - Learning path optimization
    """

    def __init__(self, llm_service: LLMService, vector_service: VectorService):
        super().__init__("ContentCurator", "Intelligent content discovery and curation")
        self.llm_service = llm_service
        self.vector_service = vector_service
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')

        # Content analysis weights
        self.scoring_weights = {
            'relevance': 0.3,
            'engagement': 0.25,
            'difficulty_match': 0.2,
            'freshness': 0.15,
            'completion_rate': 0.1
        }

    async def curate_content(
        self,
        criteria: CurationCriteria,
        limit: int = 10
    ) -> List[ContentRecommendation]:
        """
        🎯 CURAZIONE CONTENUTI PRINCIPALE
        Sistema di raccomandazione multi-layer con AI
        """
        try:
            # 1. CONTENT DISCOVERY via RAG
            candidate_contents = await self._discover_content_via_rag(criteria)

            # 2. CONTENT SCORING con ML
            scored_contents = await self._score_contents(candidate_contents, criteria)

            # 3. DIVERSIFICATION & RERANKING
            final_recommendations = await self._diversify_and_rerank(scored_contents, criteria)

            # 4. EXPLANATION GENERATION
            explained_recommendations = await self._generate_explanations(
                final_recommendations[:limit], criteria
            )

            await self.log_activity(
                f"Curated {len(explained_recommendations)} contents for user {criteria.user_id}"
            )

            return explained_recommendations

        except Exception as e:
            await self.log_error(f"Content curation failed: {str(e)}")
            return []

    async def _discover_content_via_rag(
        self,
        criteria: CurationCriteria
    ) -> List[Dict]:
        """🔍 Discovery via RAG con query expansion"""

        # Query construction per RAG
        search_query = await self._build_search_query(criteria)

        # Vector search per contenuti simili
        similar_contents = await self.vector_service.similarity_search(
            query=search_query,
            namespace="learning_content",
            top_k=50,
            filter={
                "difficulty_level": {"$lte": criteria.skill_level + 1},
                "content_type": {"$in": criteria.preferred_content_types}
            }
        )

        # Content enrichment via LLM
        enriched_contents = []
        for content in similar_contents:
            enriched = await self._enrich_content_metadata(content, criteria)
            enriched_contents.append(enriched)

        return enriched_contents

    async def _build_search_query(self, criteria: CurationCriteria) -> str:
        """🔧 Costruzione query intelligente per RAG"""

        prompt = f"""
        Costruisci una query di ricerca ottimizzata per trovare contenuti di apprendimento:

        Obiettivi: {', '.join(criteria.learning_objectives)}
        Livello skill: {criteria.skill_level}/10
        Tipo contenuti preferiti: {', '.join(criteria.preferred_content_types)}
        Settore: {criteria.industry_focus or 'generale'}
        Tempo disponibile: {criteria.time_availability} minuti

        Query ottimizzata:
        """

        response = await self.llm_service.generate_completion(
            prompt=prompt,
            max_tokens=100,
            temperature=0.3
        )

        return response.strip()

    async def _score_contents(
        self,
        contents: List[Dict],
        criteria: CurationCriteria
    ) -> List[Tuple[Dict, float]]:
        """📊 Scoring ML dei contenuti"""

        scored_contents = []

        for content in contents:
            # Calcolo score componenti
            relevance_score = await self._calculate_relevance_score(content, criteria)
            engagement_score = await self._predict_engagement(content, criteria)
            difficulty_score = self._calculate_difficulty_match(content, criteria)
            freshness_score = self._calculate_freshness_score(content)
            completion_score = self._get_completion_rate_score(content)

            # Score finale weighted
            final_score = (
                self.scoring_weights['relevance'] * relevance_score +
                self.scoring_weights['engagement'] * engagement_score +
                self.scoring_weights['difficulty_match'] * difficulty_score +
                self.scoring_weights['freshness'] * freshness_score +
                self.scoring_weights['completion_rate'] * completion_score
            )

            scored_contents.append((content, final_score))

        # Sort per score discendente
        scored_contents.sort(key=lambda x: x[1], reverse=True)
        return scored_contents

    async def _calculate_relevance_score(
        self,
        content: Dict,
        criteria: CurationCriteria
    ) -> float:
        """🎯 Calcolo relevance via semantic similarity"""

        # Testo content per similarity
        content_text = f"{content.get('title', '')} {content.get('description', '')} {' '.join(content.get('tags', []))}"
        criteria_text = f"{' '.join(criteria.learning_objectives)} {criteria.industry_focus or ''}"

        # TF-IDF similarity
        texts = [content_text, criteria_text]
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

        return float(similarity)

    async def _predict_engagement(
        self,
        content: Dict,
        criteria: CurationCriteria
    ) -> float:
        """📈 Predizione engagement con AI"""

        # Features per predizione
        features = {
            'content_type': content.get('content_type'),
            'duration': content.get('estimated_duration', 0),
            'difficulty': content.get('difficulty_level', 1),
            'user_time_pref': criteria.time_availability,
            'user_skill': criteria.skill_level,
            'has_interactive': content.get('interactive_elements', False),
            'has_video': 'video' in content.get('content_type', '').lower(),
            'rating': content.get('average_rating', 3.0)
        }

        # Modello semplificato di engagement prediction
        engagement_score = (
            0.2 if features['content_type'] in criteria.preferred_content_types else 0.0 +
            0.15 if features['duration'] <= criteria.time_availability else 0.0 +
            0.2 if abs(features['difficulty'] - criteria.skill_level) <= 1 else 0.0 +
            0.15 if features['has_interactive'] else 0.0 +
            0.1 if features['has_video'] else 0.0 +
            0.2 * (features['rating'] / 5.0)
        )

        return min(engagement_score, 1.0)

    def _calculate_difficulty_match(self, content: Dict, criteria: CurationCriteria) -> float:
        """⚖️ Match difficoltà content vs user"""

        content_difficulty = content.get('difficulty_level', 1)

        if criteria.difficulty_preference == 'challenge':
            optimal_difficulty = criteria.skill_level + 1
        elif criteria.difficulty_preference == 'comfort':
            optimal_difficulty = criteria.skill_level - 1
        else:  # balanced
            optimal_difficulty = criteria.skill_level

        difficulty_distance = abs(content_difficulty - optimal_difficulty)
        return max(0, 1 - difficulty_distance / 5)

    def _calculate_freshness_score(self, content: Dict) -> float:
        """🆕 Score freshness basato su data"""

        created_date = content.get('created_at')
        if not created_date:
            return 0.5

        if isinstance(created_date, str):
            created_date = datetime.fromisoformat(created_date)

        days_old = (datetime.now() - created_date).days

        # Score decresce con età
        if days_old <= 7:
            return 1.0
        elif days_old <= 30:
            return 0.8
        elif days_old <= 90:
            return 0.6
        elif days_old <= 365:
            return 0.4
        else:
            return 0.2

    def _get_completion_rate_score(self, content: Dict) -> float:
        """✅ Score basato su completion rate"""
        return content.get('completion_rate', 0.5)

    async def _diversify_and_rerank(
        self,
        scored_contents: List[Tuple[Dict, float]],
        criteria: CurationCriteria
    ) -> List[Dict]:
        """🎭 Diversificazione e reranking per varietà"""

        diversified = []
        content_types_seen = set()
        topics_seen = set()

        for content, score in scored_contents:
            content_type = content.get('content_type')
            topics = set(content.get('tags', []))

            # Bonus per diversità
            diversity_bonus = 0
            if content_type not in content_types_seen:
                diversity_bonus += 0.1
                content_types_seen.add(content_type)

            if not topics.intersection(topics_seen):
                diversity_bonus += 0.05
                topics_seen.update(topics)

            # Score finale con diversity bonus
            final_score = score + diversity_bonus
            content['final_score'] = final_score

            diversified.append(content)

        # Re-sort con diversity bonus
        diversified.sort(key=lambda x: x['final_score'], reverse=True)
        return diversified

    async def _generate_explanations(
        self,
        recommendations: List[Dict],
        criteria: CurationCriteria
    ) -> List[ContentRecommendation]:
        """💬 Generazione spiegazioni AI per recommendations"""

        explained_recs = []

        for content in recommendations:
            # Generazione ragioni via LLM
            prompt = f"""
            Spiega perché questo contenuto è raccomandato per l'utente:

            Contenuto: {content.get('title', 'Unknown')}
            Tipo: {content.get('content_type', 'Unknown')}
            Difficoltà: {content.get('difficulty_level', 1)}/10

            Profilo Utente:
            - Obiettivi: {', '.join(criteria.learning_objectives)}
            - Livello: {criteria.skill_level}/10
            - Tempo: {criteria.time_availability} min
            - Preferenze: {', '.join(criteria.preferred_content_types)}

            Fornisci 2-3 ragioni specifiche e motivanti:
            """

            explanation = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=150,
                temperature=0.7
            )

            reasons = [r.strip() for r in explanation.split('
') if r.strip()][:3]

            # Creazione ContentRecommendation
            recommendation = ContentRecommendation(
                content_id=content.get('id', ''),
                title=content.get('title', ''),
                description=content.get('description', ''),
                content_type=content.get('content_type', ''),
                difficulty_level=content.get('difficulty_level', 1),
                estimated_duration=content.get('estimated_duration', 0),
                relevance_score=content.get('relevance_score', 0.0),
                engagement_prediction=content.get('engagement_prediction', 0.0),
                learning_path_fit=content.get('learning_path_fit', 0.0),
                reasons=reasons,
                tags=content.get('tags', []),
                created_at=datetime.now()
            )

            explained_recs.append(recommendation)

        return explained_recs

    async def _enrich_content_metadata(
        self,
        content: Dict,
        criteria: CurationCriteria
    ) -> Dict:
        """🔍 Enrichment metadata via AI"""

        # AI-powered metadata enhancement
        prompt = f"""
        Analizza questo contenuto e arricchisci i metadati:

        Titolo: {content.get('title', '')}
        Descrizione: {content.get('description', '')}

        Fornisci in formato JSON:
        {{
            "topics": ["topic1", "topic2"],
            "skills_developed": ["skill1", "skill2"],
            "prerequisites": ["req1", "req2"],
            "learning_outcomes": ["outcome1", "outcome2"],
            "interactive_elements": true/false,
            "practical_exercises": true/false
        }}
        """

        try:
            response = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=200,
                temperature=0.3
            )

            enriched_metadata = json.loads(response)
            content.update(enriched_metadata)

        except Exception as e:
            await self.log_error(f"Metadata enrichment failed: {str(e)}")

        return content

    async def analyze_content_performance(
        self,
        content_id: str,
        timeframe_days: int = 30
    ) -> Dict:
        """📊 Analisi performance contenuto"""

        # Metriche performance (mock data per ora)
        performance_data = {
            'views': np.random.randint(100, 1000),
            'completions': np.random.randint(50, 500),
            'average_rating': round(np.random.uniform(3.0, 5.0), 2),
            'engagement_time': np.random.randint(300, 1800),  # secondi
            'bounce_rate': round(np.random.uniform(0.1, 0.4), 2),
            'completion_rate': round(np.random.uniform(0.6, 0.9), 2)
        }

        # AI analysis delle performance
        analysis_prompt = f"""
        Analizza le performance di questo contenuto:

        Metriche:
        - Visualizzazioni: {performance_data['views']}
        - Completamenti: {performance_data['completions']}
        - Rating medio: {performance_data['average_rating']}/5
        - Tempo engagement: {performance_data['engagement_time']}s
        - Bounce rate: {performance_data['bounce_rate']*100}%
        - Completion rate: {performance_data['completion_rate']*100}%

        Fornisci insights e raccomandazioni:
        """

        insights = await self.llm_service.generate_completion(
            prompt=analysis_prompt,
            max_tokens=300,
            temperature=0.7
        )

        return {
            'metrics': performance_data,
            'insights': insights,
            'recommendations': [
                "Ottimizza intro per ridurre bounce rate",
                "Aggiungi elementi interattivi",
                "Migliora call-to-action finali"
            ]
        }

    async def get_trending_content(
        self,
        category: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """🔥 Contenuti trending con AI detection"""

        # Mock trending detection (in produzione userebbe real analytics)
        trending_contents = []

        for i in range(limit):
            content = {
                'id': f"trending_{i}",
                'title': f"Trending Content {i+1}",
                'category': category or 'general',
                'trend_score': round(np.random.uniform(0.7, 1.0), 3),
                'growth_rate': round(np.random.uniform(1.2, 3.0), 2),
                'engagement_spike': True,
                'viral_potential': round(np.random.uniform(0.6, 0.95), 2)
            }
            trending_contents.append(content)

        return trending_contents
