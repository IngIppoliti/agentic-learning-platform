from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
import structlog
import uuid
from enum import Enum

logger = structlog.get_logger(__name__)

class AgentStatus(Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"
    WAITING = "waiting"

@dataclass
class AgentContext:
    """Context condiviso tra agenti"""
    user_id: str
    session_id: str
    request_id: str
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AgentMessage:
    """Messaggio tra agenti"""
    from_agent: str
    to_agent: str
    message_type: str
    payload: Dict[str, Any]
    context: AgentContext
    timestamp: datetime = field(default_factory=datetime.now)
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))

@dataclass
class AgentResponse:
    """Risposta dell'agente"""
    agent_name: str
    status: AgentStatus
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    next_actions: List[str] = field(default_factory=list)

class BaseAgent(ABC):
    """Classe base per tutti gli agenti specializzati"""
    
    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.status = AgentStatus.IDLE
        self.logger = structlog.get_logger(f"agent.{name}")
        self.capabilities: List[str] = []
        self.dependencies: List[str] = []
        
    @abstractmethod
    async def process(self, message: AgentMessage) -> AgentResponse:
        """Processo principale dell'agente"""
        pass
    
    @abstractmethod
    async def validate_input(self, message: AgentMessage) -> bool:
        """Valida l'input ricevuto"""
        pass
    
    async def can_handle(self, message_type: str) -> bool:
        """Verifica se l'agente può gestire il tipo di messaggio"""
        return message_type in self.capabilities
    
    async def pre_process(self, message: AgentMessage) -> AgentMessage:
        """Pre-processing hook"""
        self.logger.info(
            "agent_pre_process",
            agent=self.name,
            message_type=message.message_type,
            request_id=message.context.request_id
        )
        return message
    
    async def post_process(self, response: AgentResponse) -> AgentResponse:
        """Post-processing hook"""
        self.logger.info(
            "agent_post_process",
            agent=self.name,
            status=response.status.value,
            execution_time=response.execution_time
        )
        return response
    
    async def handle_error(self, error: Exception, context: AgentContext) -> AgentResponse:
        """Gestione errori centralizzata"""
        self.logger.error(
            "agent_error",
            agent=self.name,
            error=str(error),
            error_type=type(error).__name__,
            request_id=context.request_id
        )
        
        return AgentResponse(
            agent_name=self.name,
            status=AgentStatus.ERROR,
            error=str(error),
            metadata={"error_type": type(error).__name__}
        )
    
    def get_health_status(self) -> Dict[str, Any]:
        """Status di salute dell'agente"""
        return {
            "name": self.name,
            "version": self.version,
            "status": self.status.value,
            "capabilities": self.capabilities,
            "dependencies": self.dependencies,
            "timestamp": datetime.now().isoformat()
        }
