from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.core.database import get_db
from app.core.security import verify_token, get_password_hash
from app.models.user import User
from app.models.profile import UserProfile
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserProfileResponse,
    UserProfileUpdate,
    UserStatsResponse
)
from app.services.gamification import GamificationService
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()
security = HTTPBearer()

async def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency per ottenere utente corrente dal token
    """
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utente non trovato"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_current_user_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticazione fallita"
        )

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Ottieni profilo utente completo
    """
    try:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not profile:
            # Crea profilo di default se non esiste
            profile = UserProfile(
                user_id=current_user.id,
                current_skills={},
                learning_style={},
                daily_time_commitment=60,
                preferred_content_types=["video", "text"]
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        
        return UserProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            current_skills=profile.current_skills,
            learning_style=profile.learning_style,
            primary_goal=profile.primary_goal,
            secondary_goals=profile.secondary_goals or [],
            experience_years=profile.experience_years,
            daily_time_commitment=profile.daily_time_commitment,
            preferred_content_types=profile.preferred_content_types,
            personality_insights=profile.personality_insights,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
        
    except Exception as e:
        logger.error("get_profile_failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Errore recupero profilo utente"
        )

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    profile_in: UserProfileUpdate
) -> Any:
    """
    Aggiorna profilo utente
    """
    try:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Profilo utente non trovato"
            )
        
        # Aggiorna campi forniti
        update_data = profile_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        db.commit()
        db.refresh(profile)
        
        logger.info("profile_updated", user_id=str(current_user.id))
        
        return UserProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            current_skills=profile.current_skills,
            learning_style=profile.learning_style,
            primary_goal=profile.primary_goal,
            secondary_goals=profile.secondary_goals or [],
            experience_years=profile.experience_years,
            daily_time_commitment=profile.daily_time_commitment,
            preferred_content_types=profile.preferred_content_types,
            personality_insights=profile.personality_insights,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_profile_failed", user_id=str(current_user.id), error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Errore aggiornamento profilo"
        )

@router.put("/", response_model=UserResponse)
async def update_user(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_in: UserUpdate
) -> Any:
    """
    Aggiorna informazioni utente base
    """
    try:
        # Aggiorna campi forniti
        update_data = user_in.dict(exclude_unset=True)
        
        # Hash password se fornita
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        logger.info("user_updated", user_id=str(current_user.id))
        
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at
        )
        
    except Exception as e:
        logger.error("update_user_failed", user_id=str(current_user.id), error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Errore aggiornamento utente"
        )

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Ottieni statistiche utente (XP, achievements, progress)
    """
    try:
        # Usa GamificationService per ottenere stats
        gamification_service = GamificationService(db)
        
        # Ottieni stats gamification
        xp_data = await gamification_service.get_user_xp(str(current_user.id))
        achievements = await gamification_service.get_user_achievements(str(current_user.id))
        progress = await gamification_service.get_user_progress(str(current_user.id))
        
        return UserStatsResponse(
            user_id=str(current_user.id),
            current_xp=xp_data.get("current_xp", 0),
            level=xp_data.get("level", 1),
            total_xp_earned=xp_data.get("total_xp_earned", 0),
            current_streak=progress.get("current_streak", 0),
            longest_streak=progress.get("longest_streak", 0),
            weekly_xp=xp_data.get("weekly_xp", 0),
            monthly_xp=xp_data.get("monthly_xp", 0),
            achievements_count=len(achievements.get("unlocked", [])),
            total_achievements=achievements.get("total_available", 0),
            completion_rate=progress.get("completion_rate", 0.0),
            learning_paths_completed=progress.get("paths_completed", 0),
            total_study_time_minutes=progress.get("total_study_time", 0)
        )
        
    except Exception as e:
        logger.error("get_user_stats_failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Errore recupero statistiche utente"
        )

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_account(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Elimina account utente (soft delete)
    """
    try:
        # Soft delete: disattiva account invece di eliminare
        current_user.is_active = False
        db.commit()
        
        logger.info("user_account_deleted", user_id=str(current_user.id))
        
        return None
        
    except Exception as e:
        logger.error("delete_account_failed", user_id=str(current_user.id), error=str(e))
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Errore eliminazione account"
        )

@router.get("/search", response_model=List[UserResponse])
async def search_users(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    q: Optional[str] = None,
    limit: int = 20
) -> Any:
    """
    Cerca utenti (per community features)
    """
    try:
        query = db.query(User).filter(User.is_active == True)
        
        if q:
            query = query.filter(
                User.full_name.ilike(f"%{q}%") |
                User.email.ilike(f"%{q}%")
            )
        
        users = query.limit(limit).all()
        
        return [
            UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                created_at=user.created_at
            )
            for user in users
        ]
        
    except Exception as e:
        logger.error("search_users_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Errore ricerca utenti"
        )
