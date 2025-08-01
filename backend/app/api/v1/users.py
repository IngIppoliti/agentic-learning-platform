Copyfrom fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_token,
    get_password_hash,
    verify_password
)
from app.models.user import User
from app.models.profile import UserProfile
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    Token,
    UserResponse,
    RefreshTokenRequest
)
from app.schemas.user import UserProfileCreate
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Registrazione nuovo utente
    """
    try:
        # Verifica se l'utente esiste già
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="Un utente con questa email esiste già nel sistema."
            )
        
        # Crea nuovo utente
        user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Crea profilo utente di default
        profile = UserProfile(
            user_id=user.id,
            current_skills={},
            learning_style={},
            daily_time_commitment=60,
            preferred_content_types=["video", "text"]
        )
        db.add(profile)
        db.commit()
        
        logger.info("user_registered", user_id=str(user.id), email=user.email)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at
        )
        
    except Exception as e:
        logger.error("registration_failed", error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Errore durante la registrazione utente"
        )

@router.post("/login", response_model=Token)
async def login_for_access_token(
    *,
    db: Session = Depends(get_db),
    user_credentials: UserLogin
) -> Any:
    """
    Login utente con email e password
    """
    try:
        # Verifica credenziali
        user = db.query(User).filter(User.email == user_credentials.email).first()
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o password non corretti",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account utente disattivato"
            )
        
        # Crea tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)},
            expires_delta=refresh_token_expires
        )
        
        logger.info("user_logged_in", user_id=str(user.id), email=user.email)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "is_verified": user.is_verified
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("login_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Errore durante il login"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    *,
    db: Session = Depends(get_db),
    refresh_data: RefreshTokenRequest
) -> Any:
    """
    Refresh access token usando refresh token
    """
    try:
        # Verifica refresh token
        payload = verify_token(refresh_data.refresh_token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verifica utente esiste e attivo
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utente non trovato o disattivato"
            )
        
        # Crea nuovo access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_data.refresh_token,  # Riusa stesso refresh token
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "is_verified": user.is_verified
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("token_refresh_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh fallito"
        )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Any:
    """
    Logout utente (in futuro: blacklist token)
    """
    try:
        # Per ora solo response di conferma
        # In produzione: aggiungere token a blacklist
        logger.info("user_logged_out")
        
        return {"message": "Logout eseguito con successo"}
        
    except Exception as e:
        logger.error("logout_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Errore durante il logout"
        )

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    *,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Any:
    """
    Ottieni informazioni utente corrente
    """
    try:
        # Verifica token
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido"
            )
        
        # Ottieni utente
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utente non trovato"
            )
        
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_current_user_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Errore recupero informazioni utente"
        )
