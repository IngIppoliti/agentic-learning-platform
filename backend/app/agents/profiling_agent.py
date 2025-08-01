from typing import Dict, Any, List, Optional
import json
from datetime import datetime
import structlog
from .base_agent import BaseAgent, AgentMessage, AgentResponse, AgentStatus
from app.services.llm_service import LLMService
from app.models.profile import UserProfile
from app.models.user import User
from sqlalchemy.orm import Session
from app.core.config import settings
import asyncio

logger = structlog.get_logger(__name__)

class ProfilingAgent(BaseAgent):
    """
    Profiling Agent - Analizza e mantiene profili utente dettagliati
    """
    
    def __init__(self, llm_service: LLMService, db_session: Session):
        super().__init__("profiling_agent", "1.0.0")
        self.llm_service = llm_service
        self.db_session = db_session
        self.default_model = getattr(settings, 'OPENAI_MODEL', 'gpt-4-turbo')
        
        # Definisci capacità dell'agente
        self.capabilities = [
            "profile_analysis",
            "skill_assessment",
            "learning_style_detection",
            "goal_extraction",
            "constraint_mapping",
            "personality_analysis"
        ]
        
        # Template per analisi profilo
        self.analysis_templates = {
            "skill_assessment": """
Analizza le competenze dell'utente basandoti sulle seguenti informazioni:

Informazioni utente:
{user_info}

Esperienza professionale: {experience}
Educazione: {education}
Progetti/Portfolio: {projects}
Auto-valutazione: {self_assessment}

Fornisci un'analisi strutturata in formato JSON con:
1. current_skills: dizionario {skill: confidence_level} dove confidence_level è 0.0-1.0
2. skill_gaps: liste delle competenze mancanti per raggiungere gli obiettivi
3. learning_readiness: valutazione della preparazione all'apprendimento (0.0-1.0)
4. recommended_starting_level: "beginner", "intermediate", "advanced"

Rispondi solo con JSON valido.
            """,
            
            "learning_style": """
Determina lo stile di apprendimento preferito dell'utente:

Informazioni:
{user_info}

Preferenze dichiarate: {preferences}
Comportamenti passati: {past_behavior}
Risposte a domande specifiche: {learning_questions}

Analizza e fornisci in formato JSON:
1. learning_style_scores: {"visual": 0.0-1.0, "auditory": 0.0-1.0, "kinesthetic": 0.0-1.0, "reading": 0.0-1.0}
2. preferred_content_types: lista ordinata per preferenza ["video", "text", "interactive", "audio", "practice"]
3. optimal_session_length: minuti consigliati per sessione
4. best_time_of_day: "morning", "afternoon", "evening", "flexible"
5. motivation_factors: lista dei fattori motivazionali principali
            """,
            
            "goal_analysis": """
Analizza gli obiettivi di apprendimento dell'utente:

Obiettivo principale: {primary_goal}
Contesto: {context}
Timeline: {timeline}
Motivazioni: {motivations}

Fornisci analisi in JSON:
1. goal_clarity: 0.0-1.0 (quanto è chiaro l'obiettivo)
2. goal_feasibility: 0.0-1.0 (quanto è fattibile nel tempo dato)
3. sub_goals: lista di sotto-obiettivi specifici e misurabili
4. success_metrics: metriche per misurare il successo
5. potential_obstacles: possibili ostacoli e difficoltà
6. motivation_level: 0.0-1.0 (livello di motivazione stimato)
            """
        }
    
    async def process(self, message: AgentMessage) -> AgentResponse:
        """Processo principale del Profiling Agent"""
        try:
            start_time = datetime.now()
            
            # Validazione input
            if not await self.validate_input(message):
                return AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error="Invalid input message"
                )
            
            # Pre-processing
            message = await self.pre_process(message)
            
            # Routing interno basato sul tipo di messaggio
            if message.message_type == "profile_analysis":
                result = await self._analyze_complete_profile(message.payload)
            elif message.message_type == "skill_assessment":
                result = await self._assess_skills(message.payload)
            elif message.message_type == "learning_style_detection":
                result = await self._detect_learning_style(message.payload)
            elif message.message_type == "goal_extraction":
                result = await self._extract_goals(message.payload)
            else:
                return AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error=f"Unknown message type: {message.message_type}"
                )
            
            # Calcola tempo di esecuzione
            execution_time = (datetime.now() - start_time).total_seconds()
            
            response = AgentResponse(
                agent_name=self.name,
                status=AgentStatus.COMPLETED,
                result=result,
                execution_time=execution_time,
                metadata={
                    "processing_steps": ["validation", "analysis", "profile_update"],
                    "llm_calls": result.get("llm_calls_made", 0)
                }
            )
            
            return await self.post_process(response)
            
        except Exception as e:
            return await self.handle_error(e, message.context)
    
    async def validate_input(self, message: AgentMessage) -> bool:
        """Valida l'input del messaggio"""
        required_fields = {
            "profile_analysis": ["user_id"],
            "skill_assessment": ["user_id", "assessment_data"],
            "learning_style_detection": ["user_id", "preference_data"],
            "goal_extraction": ["user_id", "goal_data"]
        }
        
        required = required_fields.get(message.message_type, [])
        return all(field in message.payload for field in required)
    
    async def _analyze_complete_profile(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Analisi completa del profilo utente"""
        user_id = payload["user_id"]
        
        # Recupera utente e profilo esistente
        user = self.db_session.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User not found: {user_id}")
        
        profile = self.db_session.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        # Raccogli dati per analisi
        user_data = {
            "basic_info": {
                "age_range": payload.get("age_range"),
                "education_level": payload.get("education_level"),
                "current_role": payload.get("current_role"),
                "industry": payload.get("industry"),
                "experience_years": payload.get("experience_years")
            },
            "goals": payload.get("goals", {}),
            "preferences": payload.get("preferences", {}),
            "constraints": payload.get("constraints", {}),
            "self_assessment": payload.get("self_assessment", {})
        }
        
        # Esegui analisi parallele
        tasks = [
            self._assess_skills_internal(user_data),
            self._detect_learning_style_internal(user_data),
            self._analyze_goals_internal(user_data),
            self._assess_personality_internal(user_data)
        ]
        
        skill_analysis, style_analysis, goal_analysis, personality_analysis = await asyncio.gather(*tasks)
        
        # Crea o aggiorna profilo
        if not profile:
            profile = UserProfile(user_id=user_id)
            self.db_session.add(profile)
        
        # Aggiorna campi profilo
        profile.current_skills = skill_analysis.get("current_skills", {})
        profile.learning_style = style_analysis.get("learning_style_scores", {})
        profile.preferred_pace = style_analysis.get("optimal_pace", "medium")
        profile.personality_insights = personality_analysis
        profile.primary_goal = goal_analysis.get("primary_goal")
        profile.secondary_goals = goal_analysis.get("sub_goals", [])
        profile.target_timeline = goal_analysis.get("estimated_timeline")
        
        # Aggiorna preferenze
        profile.daily_time_commitment = user_data["constraints"].get("daily_minutes", 60)
        profile.budget_range = user_data["constraints"].get("budget_range", "50-200")
        profile.preferred_content_types = style_analysis.get("preferred_content_types", [])
        
        self.db_session.commit()
        
        return {
            "profile_updated": True,
            "profile_id": str(profile.id),
            "analysis_summary": {
                "skills_identified": len(skill_analysis.get("current_skills", {})),
                "learning_style": style_analysis.get("dominant_style"),
                "goal_clarity": goal_analysis.get("goal_clarity", 0.0),
                "readiness_score": skill_analysis.get("learning_readiness", 0.0)
            },
            "recommendations": {
                "starting_level": skill_analysis.get("recommended_starting_level"),
                "focus_areas": skill_analysis.get("skill_gaps", [])[:3],
                "learning_approach": style_analysis.get("recommended_approach")
            },
            "llm_calls_made": 4
        }
    
    async def _assess_skills_internal(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Valutazione interna delle competenze"""
        prompt = self.analysis_templates["skill_assessment"].format(
            user_info=json.dumps(user_data["basic_info"], indent=2),
            experience=user_data["basic_info"].get("current_role", ""),
            education=user_data["basic_info"].get("education_level", ""),
            projects=user_data.get("projects", "None provided"),
            self_assessment=json.dumps(user_data.get("self_assessment", {}), indent=2)
        )
        
        response = await self.llm_service.generate_completion(
            prompt=prompt,
            model=self.default_model,
            temperature=0.3,
            max_tokens=1000
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Fallback parsing
            return {
                "current_skills": {},
                "skill_gaps": [],
                "learning_readiness": 0.5,
                "recommended_starting_level": "beginner"
            }
    
    async def _detect_learning_style_internal(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rilevamento interno dello stile di apprendimento"""
        prompt = self.analysis_templates["learning_style"].format(
            user_info=json.dumps(user_data["basic_info"], indent=2),
            preferences=json.dumps(user_data.get("preferences", {}), indent=2),
            past_behavior=user_data.get("learning_history", "No past data"),
            learning_questions=json.dumps(user_data.get("learning_survey", {}), indent=2)
        )
        
        response = await self.llm_service.generate_completion(
            prompt=prompt,
            model=self.default_model,
            temperature=0.3,
            max_tokens=800
        )
        
        try:
            result = json.loads(response)
            # Determina stile dominante
            style_scores = result.get("learning_style_scores", {})
            dominant_style = max(style_scores, key=style_scores.get) if style_scores else "visual"
            result["dominant_style"] = dominant_style
            return result
        except json.JSONDecodeError:
            return {
                "learning_style_scores": {"visual": 0.7, "auditory": 0.3, "kinesthetic": 0.5, "reading": 0.4},
                "dominant_style": "visual",
                "preferred_content_types": ["video", "interactive", "text"],
                "optimal_session_length": 45,
                "best_time_of_day": "flexible"
            }
    
    async def _analyze_goals_internal(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analisi interna degli obiettivi"""
        goals_data = user_data.get("goals", {})
        
        prompt = self.analysis_templates["goal_analysis"].format(
            primary_goal=goals_data.get("primary", "Not specified"),
            context=json.dumps(user_data["basic_info"], indent=2),
            timeline=goals_data.get("timeline", "Not specified"),
            motivations=goals_data.get("motivations", "Not specified")
        )
        
        response = await self.llm_service.generate_completion(
            prompt=prompt,
            model=self.default_model,
            temperature=0.3,
            max_tokens=800
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "goal_clarity": 0.5,
                "goal_feasibility": 0.7,
                "sub_goals": [],
                "success_metrics": [],
                "potential_obstacles": [],
                "motivation_level": 0.6
            }
    
    async def _assess_personality_internal(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Valutazione della personalità per personalizzazione"""
        # Implementazione semplificata - si può espandere con modelli più sofisticati
        preferences = user_data.get("preferences", {})
        
        return {
            "learning_preference": preferences.get("learning_style", "structured"),
            "pace_preference": preferences.get("pace", "medium"),
            "interaction_style": preferences.get("interaction", "guided"),
            "feedback_preference": preferences.get("feedback", "regular"),
            "challenge_tolerance": preferences.get("challenge_level", "moderate")
        }
