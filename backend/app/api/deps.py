from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime
import structlog

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.agents.orchestrator import MasterOrchestrator
from app.services.llm_service import LLMService

logger = structlog.get_logger(__name__)
security = HTTPBearer()

def get_orchestrator(request: Request) -> MasterOrchestrator:
    """Dependency per ottenere orchestrator"""
    return request.app.state.orchestrator

def get_llm_service(request: Request) -> LLMService:
    """Dependency per ottenere LLM service"""
    return request.app.state.llm_service

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Estrae utente corrente dal JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        token_data = {"user_id": user_id}
        
    except JWTError as e:
        logger.warning("jwt_decode_error", error=str(e))
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Aggiorna last_login
    user.last_login = datetime.now()
    db.commit()
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Verifica che l'utente sia attivo
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_verified_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Richiede utente verificato
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user
