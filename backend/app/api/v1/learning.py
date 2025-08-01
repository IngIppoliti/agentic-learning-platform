"""
Learning API Routes - Paths, content, assessments, progress
Richiamato da: Frontend learning components, agents, main.py router
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.learning_path import LearningPath
from app.models.profile import UserProfile
from app.agents.orchestrator import MasterOrchestrator
from app.agents.learning_path_agent import LearningPathAgent
from app.agents.content_curator import ContentCuratorAgent
from app.agents.assessment_agent import AssessmentAgent
from app.services.llm_service import LLMService
from app.services.vector_service import VectorService
from app.services.gamification import GamificationService

router = APIRouter()

@router.post("/generate-path")
async def generate_learning_path(
    path_request: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized learning path using AI agents
    
    Expected body:
    {
        "goal": "Learn Full Stack Development",
        "timeline": "6 months",
        "daily_commitment": 120,
        "current_skills": ["HTML", "CSS"],
        "preferred_style": "visual",
        "difficulty_level": "beginner"
    }
    """
    try:
        # Initialize services and agents
        llm_service = LLMService()
        vector_service = VectorService()
        orchestrator = MasterOrchestrator(llm_service, db)
        
        # Get user profile for personalization
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        
        # Prepare agent message
        agent_message = {
            "message_type": "generate_learning_path",
            "payload": {
                "user_id": str(current_user.id),
                "goal": path_request.get("goal"),
                "timeline": path_request.get("timeline"),
                "daily_commitment": path_request.get("daily_commitment", 60),
                "current_skills": path_request.get("current_skills", []),
                "preferred_style": path_request.get("preferred_style", "mixed"),
                "difficulty_level": path_request.get("difficulty_level", "beginner"),
                "user_profile": user_profile.to_dict() if user_profile else None
            },
            "context": {
                "source": "api_request",
                "timestamp": datetime.utcnow().isoformat()
            },
            "user_id": str(current_user.id),
            "session_id": f"learning_path_{current_user.id}_{int(datetime.utcnow().timestamp())}"
        }
        
        # Process through Master Orchestrator
        response = await orchestrator.process_message(agent_message)
        
        if response.status == "success":
            # Save learning path to database
            learning_path_data = response.result.get("learning_path")
            if learning_path_data:
                learning_path = LearningPath(
                    user_id=current_user.id,
                    title=learning_path_data.get("title"),
                    description=learning_path_data.get("description"),
                    difficulty_level=path_request.get("difficulty_level", "beginner"),
                    estimated_duration_hours=learning_path_data.get("estimated_duration_hours"),
                    modules=learning_path_data.get("modules", []),
                    learning_objectives=learning_path_data.get("learning_objectives", []),
                    status="active",
                    generated_by_model=response.result.get("model_used", "gpt-4"),
                    confidence_score=response.result.get("confidence_score", 0.8),
                    personalization_factors=path_request
                )
                
                db.add(learning_path)
                db.commit()
                db.refresh(learning_path)
                
                return {
                    "success": True,
                    "learning_path": learning_path.to_dict(),
                    "generation_info": {
                        "model_used": response.result.get("model_used"),
                        "confidence_score": response.result.get("confidence_score"),
                        "processing_time": response.execution_time,
                        "personalization_applied": True
                    },
                    "next_steps": response.result.get("next_steps", [])
                }
        
        raise HTTPException(status_code=500, detail=f"Failed to generate learning path: {response.result.get('error', 'Unknown error')}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating learning path: {str(e)}")

@router.get("/paths")
async def get_learning_paths(
    status: Optional[str] = Query(None, description="Filter by status: active, completed, paused"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's learning paths with progress
    """
    try:
        query = db.query(LearningPath).filter(LearningPath.user_id == current_user.id)
        
        if status:
            query = query.filter(LearningPath.status == status)
        
        learning_paths = query.order_by(LearningPath.created_at.desc()).all()
        
        return {
            "learning_paths": [path.to_dict() for path in learning_paths],
            "total_count": len(learning_paths),
            "active_count": len([p for p in learning_paths if p.status == "active"]),
            "completed_count": len([p for p in learning_paths if p.status == "completed"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching learning paths: {str(e)}")

@router.get("/paths/{path_id}")
async def get_learning_path_details(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed learning path with modules and progress
    """
    try:
        learning_path = db.query(LearningPath).filter(
            LearningPath.id == path_id,
            LearningPath.user_id == current_user.id
        ).first()
        
        if not learning_path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        return {
            "learning_path": learning_path.to_dict(),
            "progress_details": {
                "total_modules": len(learning_path.modules),
                "completed_modules": len([m for m in learning_path.modules if m.get("completed", False)]),
                "current_module": next((m for m in learning_path.modules if not m.get("completed", False)), None),
                "estimated_completion_date": None  # Calculate based on progress and daily commitment
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching learning path details: {str(e)}")

@router.get("/recommendations")
async def get_content_recommendations(
    topic: Optional[str] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized content recommendations
    """
    try:
        # Initialize services
        llm_service = LLMService()
        vector_service = VectorService()
        content_curator = ContentCuratorAgent(llm_service, vector_service, db)
        
        # Get user profile and current learning context
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        active_paths = db.query(LearningPath).filter(
            LearningPath.user_id == current_user.id,
            LearningPath.status == "active"
        ).all()
        
        # Prepare recommendation request
        recommendation_request = {
            "user_id": str(current_user.id),
            "user_profile": user_profile.to_dict() if user_profile else {},
            "active_learning_paths": [path.to_dict() for path in active_paths],
            "filters": {
                "topic": topic,
                "difficulty": difficulty,
                "content_type": content_type
            },
            "limit": limit
        }
        
        # Get recommendations from Content Curator Agent
        recommendations = await content_curator.get_personalized_recommendations(recommendation_request)
        
        return {
            "recommendations": recommendations.get("content", []),
            "personalization_factors": recommendations.get("personalization_factors", {}),
            "trending_topics": recommendations.get("trending_topics", []),
            "similar_users_content": recommendations.get("similar_users_content", [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")

@router.post("/assessments/generate")
async def generate_assessment(
    assessment_request: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate adaptive assessment/quiz
    
    Expected body:
    {
        "topic": "JavaScript Fundamentals",
        "difficulty": "intermediate",
        "question_count": 10,
        "question_types": ["multiple_choice", "code_completion"],
        "learning_path_id": "optional_path_id"
    }
    """
    try:
        # Initialize Assessment Agent
        llm_service = LLMService()
        assessment_agent = AssessmentAgent(llm_service, db)
        
        # Prepare assessment generation request
        agent_message = {
            "message_type": "generate_assessment",
            "payload": {
                "user_id": str(current_user.id),
                "topic": assessment_request.get("topic"),
                "difficulty": assessment_request.get("difficulty", "beginner"),
                "question_count": assessment_request.get("question_count", 10),
                "question_types": assessment_request.get("question_types", ["multiple_choice"]),
                "learning_path_id": assessment_request.get("learning_path_id"),
                "adaptive": assessment_request.get("adaptive", True)
            },
            "context": {
                "source": "api_request",
                "timestamp": datetime.utcnow().isoformat()
            },
            "user_id": str(current_user.id),
            "session_id": f"assessment_{current_user.id}_{int(datetime.utcnow().timestamp())}"
        }
        
        # Generate assessment
        response = await assessment_agent.process(agent_message)
        
        if response.status == "success":
            return {
                "success": True,
                "assessment": response.result.get("assessment"),
                "session_id": agent_message["session_id"],
                "metadata": {
                    "generated_by": "assessment_agent",
                    "model_used": response.result.get("model_used"),
                    "difficulty_level": assessment_request.get("difficulty"),
                    "adaptive_enabled": assessment_request.get("adaptive", True)
                }
            }
        
        raise HTTPException(status_code=500, detail=f"Failed to generate assessment: {response.result.get('error')}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating assessment: {str(e)}")

@router.post("/assessments/submit")
async def submit_assessment(
    submission: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit assessment answers for evaluation
    
    Expected body:
    {
        "session_id": "assessment_session_id",
        "answers": [
            {"question_id": "q1", "answer": "option_a", "time_spent": 30},
            {"question_id": "q2", "answer": "console.log('hello')", "time_spent": 45}
        ]
    }
    """
    try:
        # Initialize services
        llm_service = LLMService()
        assessment_agent = AssessmentAgent(llm_service, db)
        gamification = GamificationService(db)
        
        # Prepare submission for evaluation
        evaluation_request = {
            "message_type": "evaluate_assessment",
            "payload": {
                "user_id": str(current_user.id),
                "session_id": submission.get("session_id"),
                "answers": submission.get("answers", [])
            },
            "context": {
                "source": "api_request",
                "timestamp": datetime.utcnow().isoformat()
            },
            "user_id": str(current_user.id),
            "session_id": submission.get("session_id")
        }
        
        # Evaluate assessment
        response = await assessment_agent.process(evaluation_request)
        
        if response.status == "success":
            results = response.result
            
            # Award XP based on performance
            if results.get("score", 0) > 0:
                xp_earned = int(results.get("score", 0) * 25)  # Base XP calculation
                
                # Add bonus for perfect scores
                if results.get("score", 0) >= 100:
                    xp_earned = int(xp_earned * 1.5)
                
                # Award XP through gamification system
                await gamification.award_xp(
                    user_id=current_user.id,
                    xp_amount=xp_earned,
                    source="assessment_completion",
                    metadata={
                        "assessment_topic": results.get("topic"),
                        "score": results.get("score"),
                        "session_id": submission.get("session_id")
                    }
                )
                
                results["xp_earned"] = xp_earned
            
            return {
                "success": True,
                "results": results,
                "next_recommendations": results.get("next_recommendations", [])
            }
        
        raise HTTPException(status_code=500, detail=f"Failed to evaluate assessment: {response.result.get('error')}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting assessment: {str(e)}")

@router.post("/paths/{path_id}/update-progress")
async def update_learning_path_progress(
    path_id: str,
    progress_update: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update progress on a learning path module
    
    Expected body:
    {
        "module_id": "module_1",
        "completed": true,
        "time_spent_minutes": 45,
        "notes": "Great lesson on React hooks"
    }
    """
    try:
        learning_path = db.query(LearningPath).filter(
            LearningPath.id == path_id,
            LearningPath.user_id == current_user.id
        ).first()
        
        if not learning_path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        # Update module progress
        module_id = progress_update.get("module_id")
        modules = learning_path.modules or []
        
        for module in modules:
            if module.get("id") == module_id:
                module["completed"] = progress_update.get("completed", False)
                module["time_spent_minutes"] = progress_update.get("time_spent_minutes", 0)
                module["completion_date"] = datetime.utcnow().isoformat() if progress_update.get("completed") else None
                module["notes"] = progress_update.get("notes", "")
                break
        
        learning_path.modules = modules
        
        # Recalculate overall progress
        completed_modules = len([m for m in modules if m.get("completed", False)])
        total_modules = len(modules)
        learning_path.progress_percentage = (completed_modules / total_modules * 100) if total_modules > 0 else 0
        
        # Check if path is completed
        if learning_path.progress_percentage >= 100:
            learning_path.status = "completed"
        
        db.commit()
        
        # Award XP for module completion
        if progress_update.get("completed"):
            gamification = GamificationService(db)
            xp_amount = 50  # Base XP for module completion
            
            await gamification.award_xp(
                user_id=current_user.id,
                xp_amount=xp_amount,
                source="module_completion",
                metadata={
                    "learning_path_id": path_id,
                    "module_id": module_id,
                    "time_spent": progress_update.get("time_spent_minutes", 0)
                }
            )
        
        return {
            "success": True,
            "updated_progress": learning_path.progress_percentage,
            "path_status": learning_path.status,
            "xp_earned": 50 if progress_update.get("completed") else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating learning path progress: {str(e)}")
