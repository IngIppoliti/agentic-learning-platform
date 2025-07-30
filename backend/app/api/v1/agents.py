from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel
import structlog
from datetime import datetime
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user, get_orchestrator
from app.models.user import User
from app.agents.base_agent import AgentMessage, AgentContext
from app.agents.orchestrator import MasterOrchestrator

logger = structlog.get_logger(__name__)
router = APIRouter()

# Pydantic models per richieste
class ProfileAnalysisRequest(BaseModel):
    age_range: str
    education_level: str
    current_role: str
    industry: str
    experience_years: int
    goals: Dict[str, Any]
    preferences: Dict[str, Any]
    constraints: Dict[str, Any]
    self_assessment: Dict[str, Any]

class LearningPathRequest(BaseModel):
    goal: str
    timeline: str = "6 months"
    priority_skills: List[str] = []
    constraints: Dict[str, Any] = {}

class AgentResponse(BaseModel):
    success: bool
    agent_name: str
    execution_time: float
    result: Dict[str, Any]
    request_id: str
    timestamp: str

@router.post("/profile/analyze", response_model=AgentResponse)
async def analyze_profile(
    request: ProfileAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    orchestrator: MasterOrchestrator = Depends(get_orchestrator),
    db: Session = Depends(get_db)
):
    """
    Analizza il profilo utente usando il Profiling Agent
    """
    try:
        request_id = str(uuid.uuid4())
        
        logger.info(
            "profile_analysis_requested",
            user_id=str(current_user.id),
            request_id=request_id
        )
        
        # Crea context
        context = AgentContext(
            user_id=str(current_user.id),
            session_id=str(uuid.uuid4()),
            request_id=request_id
        )
        
        # Crea messaggio per agent
        message = AgentMessage(
            from_agent="api",
            to_agent="profiling_agent",
            message_type="profile_analysis",
            payload={
                "user_id": str(current_user.id),
                **request.dict()
            },
            context=context
        )
        
        # Invia ad orchestrator
        start_time = datetime.now()
        agent_response = await orchestrator.route_message(message)
        execution_time = (datetime.now() - start_time).total_seconds()
        
        if agent_response.status.value == "error":
            raise HTTPException(
                status_code=500,
                detail=f"Agent error: {agent_response.error}"
            )
        
        logger.info(
            "profile_analysis_completed",
            user_id=str(current_user.id),
            request_id=request_id,
            execution_time=execution_time
        )
        
        return AgentResponse(
            success=True,
            agent_name=agent_response.agent_name,
            execution_time=execution_time,
            result=agent_response.result,
            request_id=request_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(
            "profile_analysis_error",
            user_id=str(current_user.id),
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/learning-path/generate", response_model=AgentResponse)
async def generate_learning_path(
    request: LearningPathRequest,
    current_user: User = Depends(get_current_user),
    orchestrator: MasterOrchestrator = Depends(get_orchestrator),
    db: Session = Depends(get_db)
):
    """
    Genera un percorso di apprendimento personalizzato
    """
    try:
        request_id = str(uuid.uuid4())
        
        logger.info(
            "learning_path_generation_requested",
            user_id=str(current_user.id),
            goal=request.goal,
            request_id=request_id
        )
        
        context = AgentContext(
            user_id=str(current_user.id),
            session_id=str(uuid.uuid4()),
            request_id=request_id
        )
        
        message = AgentMessage(
            from_agent="api",
            to_agent="learning_path_agent",
            message_type="generate_learning_path",
            payload={
                "user_id": str(current_user.id),
                **request.dict()
            },
            context=context
        )
        
        start_time = datetime.now()
        agent_response = await orchestrator.route_message(message)
        execution_time = (datetime.now() - start_time).total_seconds()
        
        if agent_response.status.value == "error":
            raise HTTPException(
                status_code=500,
                detail=f"Agent error: {agent_response.error}"
            )
        
        logger.info(
            "learning_path_generation_completed",
            user_id=str(current_user.id),
            request_id=request_id,
            execution_time=execution_time,
            path_modules=len(agent_response.result.get("path_data", {}).get("modules", []))
        )
        
        return AgentResponse(
            success=True,
            agent_name=agent_response.agent_name,
            execution_time=execution_time,
            result=agent_response.result,
            request_id=request_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(
            "learning_path_generation_error",
            user_id=str(current_user.id),
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflow/new-user-onboarding")
async def execute_new_user_workflow(
    profile_data: ProfileAnalysisRequest,
    learning_goal: str,
    current_user: User = Depends(get_current_user),
    orchestrator: MasterOrchestrator = Depends(get_orchestrator)
):
    """
    Esegue il workflow completo per un nuovo utente
    """
    try:
        request_id = str(uuid.uuid4())
        
        logger.info(
            "new_user_workflow_started",
            user_id=str(current_user.id),
            request_id=request_id
        )
        
        context = AgentContext(
            user_id=str(current_user.id),
            session_id=str(uuid.uuid4()),
            request_id=request_id
        )
        
        # Dati iniziali per workflow
        initial_data = {
            "user_id": str(current_user.id),
            "goal": learning_goal,
            **profile_data.dict()
        }
        
        # Esegui workflow
        start_time = datetime.now()
        workflow_responses = await orchestrator.execute_workflow(
            "new_user_onboarding",
            context,
            initial_data
        )
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Verifica successo
        successful_steps = [r for r in workflow_responses if r.status.value == "completed"]
        
        logger.info(
            "new_user_workflow_completed",
            user_id=str(current_user.id),
            request_id=request_id,
            total_steps=len(workflow_responses),
            successful_steps=len(successful_steps),
            execution_time=execution_time
        )
        
        return {
            "success": len(successful_steps) == len(workflow_responses),
            "total_steps": len(workflow_responses),
            "successful_steps": len(successful_steps),
            "execution_time": execution_time,
            "results": [
                {
                    "agent": r.agent_name,
                    "status": r.status.value,
                    "result": r.result,
                    "error": r.error
                }
                for r in workflow_responses
            ],
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(
            "new_user_workflow_error",
            user_id=str(current_user.id),
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/status")
async def get_system_status(
    orchestrator: MasterOrchestrator = Depends(get_orchestrator),
    current_user: User = Depends(get_current_user)
):
    """
    Ottieni status del sistema di agenti
    """
    try:
        status = await orchestrator.get_system_status()
        
        return {
            "system_status": status,
            "timestamp": datetime.now().isoformat(),
            "request_by": str(current_user.id)
        }
        
    except Exception as e:
        logger.error("system_status_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agents/{agent_name}/health")
async def get_agent_health(
    agent_name: str,
    orchestrator: MasterOrchestrator = Depends(get_orchestrator),
    current_user: User = Depends(get_current_user)
):
    """
    Ottieni health status di uno specifico agente
    """
    try:
        if agent_name not in orchestrator.agents:
            raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")
        
        agent = orchestrator.agents[agent_name]
        health_status = agent.get_health_status()
        
        return {
            "agent_health": health_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("agent_health_error", agent=agent_name, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
