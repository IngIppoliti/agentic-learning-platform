from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime
import structlog
from .base_agent import BaseAgent, AgentMessage, AgentResponse, AgentContext, AgentStatus
from app.core.config import settings
import redis
import json

logger = structlog.get_logger(__name__)

class MasterOrchestrator:
    """
    Master Orchestrator - Coordina tutti gli agenti del sistema
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.name = "master_orchestrator"
        self.version = "1.0.0"
        self.agents: Dict[str, BaseAgent] = {}
        self.redis_client = redis_client
        self.logger = structlog.get_logger(f"orchestrator.{self.name}")
        
        # Routing rules per messaggi
        self.routing_rules = {
            "profile_analysis": "profiling_agent",
            "generate_learning_path": "learning_path_agent",
            "curate_content": "content_curator_agent",
            "track_progress": "progress_tracker_agent",
            "motivational_support": "motivation_coach_agent",
            "assess_skills": "assessment_agent",
            "industry_insights": "industry_intelligence_agent"
        }
        
        # Workflow predefiniti
        self.workflows = {
            "new_user_onboarding": [
                "profile_analysis",
                "generate_learning_path",
                "curate_content"
            ],
            "progress_check": [
                "track_progress",
                "assess_skills",
                "motivational_support"
            ],
            "path_adaptation": [
                "track_progress",
                "profile_analysis",
                "generate_learning_path"
            ]
        }
    
    def register_agent(self, agent: BaseAgent) -> None:
        """Registra un agente nel sistema"""
        self.agents[agent.name] = agent
        self.logger.info(
            "agent_registered",
            agent_name=agent.name,
            agent_version=agent.version,
            capabilities=agent.capabilities
        )
    
    def unregister_agent(self, agent_name: str) -> None:
        """Rimuove un agente dal sistema"""
        if agent_name in self.agents:
            del self.agents[agent_name]
            self.logger.info("agent_unregistered", agent_name=agent_name)
    
    async def route_message(self, message: AgentMessage) -> AgentResponse:
        """
        Routing intelligente dei messaggi agli agenti appropriati
        """
        try:
            # Determina l'agente target
            target_agent_name = self._determine_target_agent(message)
            
            if not target_agent_name:
                return AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error=f"No agent found for message type: {message.message_type}"
                )
            
            target_agent = self.agents.get(target_agent_name)
            if not target_agent:
                return AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error=f"Target agent not available: {target_agent_name}"
                )
            
            # Verifica se l'agente può gestire il messaggio
            if not await target_agent.can_handle(message.message_type):
                return AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error=f"Agent {target_agent_name} cannot handle {message.message_type}"
                )
            
            # Log routing
            self.logger.info(
                "message_routed",
                from_agent=message.from_agent,
                to_agent=target_agent_name,
                message_type=message.message_type,
                request_id=message.context.request_id
            )
            
            # Invia messaggio all'agente
            start_time = datetime.now()
            response = await target_agent.process(message)
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Aggiorna response con timing
            response.execution_time = execution_time
            
            # Cache della risposta se richiesto
            await self._cache_response(message, response)
            
            return response
            
        except Exception as e:
            self.logger.error(
                "routing_error",
                error=str(e),
                message_type=message.message_type,
                request_id=message.context.request_id
            )
            return AgentResponse(
                agent_name=self.name,
                status=AgentStatus.ERROR,
                error=f"Routing error: {str(e)}"
            )
    
    async def execute_workflow(self, workflow_name: str, context: AgentContext, 
                             initial_data: Dict[str, Any]) -> List[AgentResponse]:
        """
        Esecuzione di workflow predefiniti
        """
        if workflow_name not in self.workflows:
            raise ValueError(f"Unknown workflow: {workflow_name}")
        
        workflow_steps = self.workflows[workflow_name]
        responses = []
        current_data = initial_data.copy()
        
        self.logger.info(
            "workflow_started",
            workflow=workflow_name,
            steps=workflow_steps,
            request_id=context.request_id
        )
        
        for step in workflow_steps:
            try:
                # Crea messaggio per il passo corrente
                message = AgentMessage(
                    from_agent=self.name,
                    to_agent="auto_route",
                    message_type=step,
                    payload=current_data,
                    context=context
                )
                
                # Esegui passo
                response = await self.route_message(message)
                responses.append(response)
                
                # Se c'è errore, interrompi workflow
                if response.status == AgentStatus.ERROR:
                    self.logger.error(
                        "workflow_step_failed",
                        workflow=workflow_name,
                        step=step,
                        error=response.error,
                        request_id=context.request_id
                    )
                    break
                
                # Aggiorna dati per prossimo step
                if response.result:
                    current_data.update(response.result)
                
                self.logger.info(
                    "workflow_step_completed",
                    workflow=workflow_name,
                    step=step,
                    status=response.status.value,
                    request_id=context.request_id
                )
                
            except Exception as e:
                self.logger.error(
                    "workflow_step_error",
                    workflow=workflow_name,
                    step=step,
                    error=str(e),
                    request_id=context.request_id
                )
                
                error_response = AgentResponse(
                    agent_name=self.name,
                    status=AgentStatus.ERROR,
                    error=f"Workflow step error: {str(e)}"
                )
                responses.append(error_response)
                break
        
        self.logger.info(
            "workflow_completed",
            workflow=workflow_name,
            total_steps=len(responses),
            successful_steps=len([r for r in responses if r.status == AgentStatus.COMPLETED]),
            request_id=context.request_id
        )
        
        return responses
    
    def _determine_target_agent(self, message: AgentMessage) -> Optional[str]:
        """Determina l'agente target basandosi sul tipo di messaggio"""
        return self.routing_rules.get(message.message_type)
    
    async def _cache_response(self, message: AgentMessage, response: AgentResponse) -> None:
        """Cache delle risposte per ottimizzazione"""
        if response.status == AgentStatus.COMPLETED and response.result:
            cache_key = f"response:{message.message_type}:{hash(str(message.payload))}"
            cache_data = {
                "response": response.result,
                "timestamp": datetime.now().isoformat(),
                "agent": response.agent_name
            }
            
            try:
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.redis_client.setex(
                        cache_key,
                        settings.CACHE_TTL_SECONDS,
                        json.dumps(cache_data)
                    )
                )
            except Exception as e:
                self.logger.warning("cache_error", error=str(e))
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Status completo del sistema"""
        agent_statuses = {}
        for name, agent in self.agents.items():
            agent_statuses[name] = agent.get_health_status()
        
        return {
            "orchestrator": {
                "name": self.name,
                "version": self.version,
                "registered_agents": len(self.agents),
                "available_workflows": list(self.workflows.keys()),
                "timestamp": datetime.now().isoformat()
            },
            "agents": agent_statuses
        }
