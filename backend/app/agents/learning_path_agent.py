from typing import Dict, Any, List, Optional, Tuple
import json
from datetime import datetime, timedelta
import structlog
from .base_agent import BaseAgent, AgentMessage, AgentResponse, AgentStatus
from app.services.llm_service import LLMService
from app.models.profile import UserProfile
from app.models.learning_path import LearningPath
from sqlalchemy.orm import Session
import asyncio
import uuid

logger = structlog.get_logger(__name__)

class LearningPathAgent(BaseAgent):
    """
    Learning Path Agent - Genera percorsi di apprendimento personalizzati
    """
    
    def __init__(self, llm_service: LLMService, db_session: Session):
        super().__init__("learning_path_agent", "1.0.0")
        self.llm_service = llm_service
        self.db_session = db_session
        
        self.capabilities = [
            "generate_learning_path",
            "adapt_learning_path",
            "optimize_sequence",
            "milestone_definition",
            "prerequisite_analysis",
            "difficulty_calibration"
        ]
        
        # Template per generazione percorsi
        self.path_templates = {
            "comprehensive_path": """
Crea un percorso di apprendimento personalizzato per:

PROFILO UTENTE:
{user_profile}

OBIETTIVO: {primary_goal}
TIMELINE: {timeline}
TEMPO DISPONIBILE: {time_commitment} minuti/giorno
LIVELLO ATTUALE: {current_level}
COMPETENZE ESISTENTI: {current_skills}
STILE DI APPRENDIMENTO: {learning_style}
PREFERENZE CONTENUTO: {content_preferences}

Genera un percorso strutturato in formato JSON con:

1. "path_metadata": {
   "title": "titolo accattivante del percorso",
   "description": "descrizione completa",
   "difficulty_level": "beginner|intermediate|advanced",
   "estimated_duration_hours": numero_ore_totali,
   "learning_outcomes": ["outcome1", "outcome2", ...]
}

2. "modules": [
   {
     "module_id": "uuid",
     "title": "titolo modulo",
     "description": "descrizione dettagliata",
     "duration_hours": ore_stimate,
     "learning_objectives": ["obiettivo1", "obiettivo2"],
     "prerequisites": ["prerequisito1", "prerequisito2"],
     "difficulty_level": "beginner|intermediate|advanced",
     "content_types": ["video", "text", "practice", "project"],
     "assessments": [
       {
         "type": "quiz|project|peer_review",
         "title": "titolo assessment",
         "description": "descrizione",
         "weight": peso_percentuale
       }
     ],
     "resources": [
       {
         "type": "video|article|course|book|tool",
         "title": "titolo risorsa",
         "source": "piattaforma/autore",
         "url": "link_se_disponibile",
         "duration_minutes": durata,
         "difficulty": "beginner|intermediate|advanced",
         "free": true|false
       }
     ],
     "practical_exercises": [
       {
         "title": "titolo esercizio",
         "description": "descrizione dettagliata",
         "estimated_time_hours": ore_stimate,
         "deliverable": "cosa deve produrre lo studente"
       }
     ]
   }
]

3. "milestones": [
   {
     "milestone_id": "uuid",
     "title": "titolo milestone",
     "description": "cosa avrà raggiunto",
     "target_week": settimana_target,
     "success_criteria": ["criterio1", "criterio2"],
     "validation_method": "come verificare il raggiungimento"
   }
]

4. "adaptation_triggers": {
   "struggling_student": "criteri per identificare difficoltà",
   "advanced_student": "criteri per identificare accelerazione",
   "motivation_drop": "segnali di calo motivazione",
   "time_constraint": "gestione vincoli temporali"
}

5. "personalization_factors": {
   "learning_style_adaptations": "adattamenti per stile apprendimento",
   "pace_adjustments": "come adattare il ritmo",
   "content_preferences": "priorità sui tipi di contenuto",
   "assessment_preferences": "modalità di valutazione preferite"
}

Assicurati che il percorso sia:
- Progressivo e logicamente sequenziato
- Bilanciato tra teoria e pratica
- Adatto al tempo disponibile
- Allineato con obiettivi di carriera
- Motivante e coinvolgente
            """,
            
            "adaptation_analysis": """
Analizza il percorso esistente e proponi adattamenti:

PERCORSO ATTUALE:
{current_path}

DATI PROGRESSO:
{progress_data}

FEEDBACK UTENTE:
{user_feedback}

PERFORMANCE METRICS:
{performance_metrics}

Fornisci analisi in JSON:
1. "adaptation_needed": true|false
2. "adaptation_type": "pace|difficulty|content|sequence|motivation"
3. "specific_changes": [
   {
     "module_id": "id_modulo",
     "change_type": "add|remove|modify|reorder",
     "description": "descrizione modifica",
     "rationale": "perché questa modifica"
   }
]
4. "new_timeline": "timeline aggiornata"
5. "confidence_score": 0.0-1.0
            """
        }
        
        # Database delle competenze e prerequisiti
        self.skill_graph = {
            "programming": {
                "python": {
                    "prerequisites": ["basic_programming_concepts"],
                    "enables": ["data_science", "web_development", "ai_ml"],
                    "difficulty": "beginner"
                },
                "javascript": {
                    "prerequisites": ["basic_programming_concepts", "html_css"],
                    "enables": ["frontend_development", "node_js", "react"],
                    "difficulty": "beginner"
                },
                "data_science": {
                    "prerequisites": ["python", "statistics", "mathematics"],
                    "enables": ["machine_learning", "data_analysis"],
                    "difficulty": "intermediate"
                }
            },
            "design": {
                "ui_ux": {
                    "prerequisites": ["design_principles", "user_research"],
                    "enables": ["product_design", "design_systems"],
                    "difficulty": "intermediate"
                }
            }
        }
    
    async def process(self, message: AgentMessage) -> AgentResponse:
        """Processo principale del Learning Path Agent"""
        try:
            start_time = datetime.now()
            
            if not await self.validate_input(message):
                return AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error="Invalid input message"
                )
            
            message = await self.pre_process(message)
            
            if message.message_type == "generate_learning_path":
                result = await self._generate_learning_path(message.payload)
            elif message.message_type == "adapt_learning_path":
                result = await self._adapt_learning_path(message.payload)
            elif message.message_type == "optimize_sequence":
                result = await self._optimize_sequence(message.payload)
            else:
                return AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error=f"Unknown message type: {message.message_type}"
                )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            response = AgentResponse(
                agent_name=self.name,
                status=AgentStatus.COMPLETED,
                result=result,
                execution_time=execution_time,
                next_actions=["curate_content", "setup_tracking"]
            )
            
            return await self.post_process(response)
            
        except Exception as e:
            return await self.handle_error(e, message.context)
    
    async def validate_input(self, message: AgentMessage) -> bool:
        """Valida input del messaggio"""
        required_fields = {
            "generate_learning_path": ["user_id", "goal"],
            "adapt_learning_path": ["user_id", "path_id", "adaptation_reason"],
            "optimize_sequence": ["path_data"]
        }
        
        required = required_fields.get(message.message_type, [])
        return all(field in message.payload for field in required)
    
    async def _generate_learning_path(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Genera un nuovo percorso di apprendimento"""
        user_id = payload["user_id"]
        primary_goal = payload["goal"]
        
        # Recupera profilo utente
        profile = self.db_session.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if not profile:
            raise ValueError(f"User profile not found: {user_id}")
        
        # Prepara dati per LLM
        user_context = {
            "current_skills": profile.current_skills or {},
            "learning_style": profile.learning_style or {},
            "time_commitment": profile.daily_time_commitment or 60,
            "experience_level": profile.experience_years or 0,
            "preferred_content": profile.preferred_content_types or ["video", "text"],
            "budget_range": profile.budget_range or "50-200"
        }
        
        # Determina livello di partenza
        current_level = self._determine_starting_level(user_context, primary_goal)
        
        # Genera percorso con LLM
        path_data = await self._generate_path_with_llm(
            user_context, primary_goal, current_level
        )
        
        # Ottimizza sequenza moduli
        optimized_path = await self._optimize_module_sequence(path_data)
        
        # Crea record nel database
        learning_path = LearningPath(
            user_id=user_id,
            title=optimized_path["path_metadata"]["title"],
            description=optimized_path["path_metadata"]["description"],
            difficulty_level=optimized_path["path_metadata"]["difficulty_level"],
            estimated_duration_hours=optimized_path["path_metadata"]["estimated_duration_hours"],
            modules=optimized_path["modules"],
            learning_objectives=optimized_path["path_metadata"]["learning_outcomes"],
            generated_by_model="gpt-4-turbo",
            confidence_score=optimized_path.get("confidence_score", 0.8),
            personalization_factors=optimized_path.get("personalization_factors", {})
        )
        
        self.db_session.add(learning_path)
        self.db_session.commit()
        
        return {
            "path_generated": True,
            "path_id": str(learning_path.id),
            "path_data": optimized_path,
            "estimated_completion_date": self._calculate_completion_date(
                learning_path.estimated_duration_hours,
                user_context["time_commitment"]
            ),
            "next_steps": [
                "Content curation needed for modules",
                "Setup progress tracking",
                "Schedule first milestone check"
            ]
        }
    
    async def _generate_path_with_llm(self, user_context: Dict, goal: str, level: str) -> Dict[str, Any]:
        """Genera percorso usando LLM"""
        prompt = self.path_templates["comprehensive_path"].format(
            user_profile=json.dumps(user_context, indent=2),
            primary_goal=goal,
            timeline=user_context.get("target_timeline", "6 months"),
            time_commitment=user_context["time_commitment"],
            current_level=level,
            current_skills=json.dumps(user_context["current_skills"], indent=2),
            learning_style=json.dumps(user_context["learning_style"], indent=2),
            content_preferences=json.dumps(user_context["preferred_content"], indent=2)
        )
        
        response = await self.llm_service.generate_completion(
            prompt=prompt,
            model="claude-3-5-sonnet-20241022",  # Claude è migliore per reasoning strutturato
            temperature=0.4,
            max_tokens=4000
        )
        
        try:
            path_data = json.loads(response)
            
            # Aggiungi UUID ai moduli se mancanti
            for module in path_data.get("modules", []):
                if "module_id" not in module:
                    module["module_id"] = str(uuid.uuid4())
            
            # Aggiungi UUID ai milestone se mancanti
            for milestone in path_data.get("milestones", []):
                if "milestone_id" not in milestone:
                    milestone["milestone_id"] = str(uuid.uuid4())
            
            return path_data
            
        except json.JSONDecodeError as e:
            logger.error("llm_json_parse_error", error=str(e), response_preview=response[:200])
            # Fallback: genera percorso basic
            return self._generate_fallback_path(user_context, goal, level)
    
    async def _optimize_module_sequence(self, path_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ottimizza la sequenza dei moduli basandosi sui prerequisiti"""
        modules = path_data.get("modules", [])
        
        # Crea grafo delle dipendenze
        dependency_graph = {}
        for module in modules:
            module_id = module["module_id"]
            prerequisites = module.get("prerequisites", [])
            dependency_graph[module_id] = {
                "module": module,
                "prerequisites": prerequisites,
                "dependencies": []
            }
        
        # Risolvi dipendenze
        for module_id, data in dependency_graph.items():
            for prereq in data["prerequisites"]:
                # Trova moduli che soddisfano il prerequisito
                for other_id, other_data in dependency_graph.items():
                    if other_id != module_id:
                        module_objectives = other_data["module"].get("learning_objectives", [])
                        if any(prereq.lower() in obj.lower() for obj in module_objectives):
                            data["dependencies"].append(other_id)
        
        # Ordina topologicamente
        ordered_modules = self._topological_sort(dependency_graph)
        
        # Aggiorna path_data con moduli ordinati
        path_data["modules"] = ordered_modules
        
        # Ricalcola milestone basandosi sulla nuova sequenza
        path_data["milestones"] = self._recalculate_milestones(ordered_modules)
        
        return path_data
    
    def _topological_sort(self, graph: Dict[str, Dict]) -> List[Dict[str, Any]]:
        """Ordinamento topologico dei moduli"""
        in_degree = {node: 0 for node in graph}
        
        # Calcola in-degree
        for node in graph:
            for dep in graph[node]["dependencies"]:
                if dep in in_degree:
                    in_degree[node] += 1
        
        # Queue per nodi senza dipendenze
        queue = [node for node, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            current = queue.pop(0)
            result.append(graph[current]["module"])
            
            # Rimuovi current dalle dipendenze
            for node in graph:
                if current in graph[node]["dependencies"]:
                    in_degree[node] -= 1
                    if in_degree[node] == 0:
                        queue.append(node)
        
        return result
    
    def _determine_starting_level(self, user_context: Dict, goal: str) -> str:
        """Determina il livello di partenza basandosi su competenze esistenti"""
        current_skills = user_context.get("current_skills", {})
        experience_years = user_context.get("experience_level", 0)
        
        # Analisi euristica del livello
        if not current_skills and experience_years < 1:
            return "beginner"
        elif experience_years > 5 or any(score > 0.7 for score in current_skills.values()):
            return "advanced"
        else:
            return "intermediate"
    
    def _calculate_completion_date(self, total_hours: int, daily_minutes: int) -> str:
        """Calcola data di completamento stimata"""
        daily_hours = daily_minutes / 60
        days_needed = total_hours / daily_hours
        completion_date = datetime.now() + timedelta(days=days_needed)
        return completion_date.strftime("%Y-%m-%d")
    
    def _generate_fallback_path(self, user_context: Dict, goal: str, level: str) -> Dict[str, Any]:
        """Genera percorso di fallback se LLM fallisce"""
        return {
            "path_metadata": {
                "title": f"Percorso verso {goal}",
                "description": f"Percorso personalizzato per raggiungere {goal}",
                "difficulty_level": level,
                "estimated_duration_hours": 120,
                "learning_outcomes": [f"Master {goal}", "Apply knowledge practically"]
            },
            "modules": [
                {
                    "module_id": str(uuid.uuid4()),
                    "title": "Fondamentali",
                    "description": "Concetti base e fondamentali",
                    "duration_hours": 40,
                    "learning_objectives": ["Understand basics", "Build foundation"],
                    "prerequisites": [],
                    "difficulty_level": "beginner"
                },
                {
                    "module_id": str(uuid.uuid4()),
                    "title": "Applicazione Pratica",
                    "description": "Progetti e esercizi pratici",
                    "duration_hours": 80,
                    "learning_objectives": ["Apply knowledge", "Build portfolio"],
                    "prerequisites": ["Fondamentali"],
                    "difficulty_level": level
                }
            ],
            "milestones": [
                {
                    "milestone_id": str(uuid.uuid4()),
                    "title": "Fondamentali Completati",
                    "target_week": 6,
                    "success_criteria": ["Complete all basic modules"]
                }
            ]
        }
    
    def _recalculate_milestones(self, modules: List[Dict]) -> List[Dict]:
        """Ricalcola milestone basandosi sui moduli ordinati"""
        milestones = []
        cumulative_hours = 0
        
        for i, module in enumerate(modules):
            cumulative_hours += module.get("duration_hours", 20)
            
            # Crea milestone ogni 40 ore circa
            if cumulative_hours >= 40 * (len(milestones) + 1):
                milestone = {
                    "milestone_id": str(uuid.uuid4()),
                    "title": f"Completamento {module['title']}",
                    "description": f"Modulo {module['title']} completato con successo",
                    "target_week": int(cumulative_hours / 10),  # Stima 10 ore/settimana
                    "success_criteria": [
                        f"Complete {module['title']} module",
                        "Pass module assessment",
                        "Complete practical exercises"
                    ],
                    "validation_method": "Module completion + assessment score >= 80%"
                }
                milestones.append(milestone)
        
        return milestones
