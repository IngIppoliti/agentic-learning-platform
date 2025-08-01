"""
Dashboard API Routes - Overview, XP, achievements, weekly stats
Richiamato da: Frontend dashboard components, main.py router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.progress import UserProgress
from app.models.achievement import Achievement
from app.models.learning_path import LearningPath
from app.services.gamification import GamificationService
from app.agents.progress_tracker import ProgressTrackerAgent
from app.services.llm_service import LLMService

router = APIRouter()

@router.get("/overview")
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard overview with user stats, XP, achievements, insights
    """
    try:
        # Get user progress
        progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
        if not progress:
            # Create default progress if doesn't exist
            progress = UserProgress(user_id=current_user.id)
            db.add(progress)
            db.commit()
            db.refresh(progress)
        
        # Get recent achievements (last 30 days)
        recent_achievements = db.query(Achievement).filter(
            Achievement.user_id == current_user.id,
            Achievement.is_unlocked == True,
            Achievement.unlocked_at >= datetime.utcnow() - timedelta(days=30)
        ).order_by(Achievement.unlocked_at.desc()).limit(5).all()
        
        # Get active learning paths
        active_paths = db.query(LearningPath).filter(
            LearningPath.user_id == current_user.id,
            LearningPath.status == "active"
        ).all()
        
        # Calculate weekly stats
        week_start = datetime.utcnow() - timedelta(days=7)
        weekly_stats = {
            "xp_gained": progress.weekly_xp,
            "lessons_completed": progress.weekly_lessons,
            "quizzes_completed": progress.weekly_quizzes,
            "learning_time_minutes": progress.weekly_learning_time,
            "streak_maintained": progress.current_streak >= 7
        }
        
        # Get AI insights from Progress Tracker Agent
        llm_service = LLMService()
        progress_agent = ProgressTrackerAgent(llm_service, db)
        
        ai_insights = await progress_agent.generate_insights({
            "user_id": str(current_user.id),
            "progress_data": progress.to_dict(),
            "recent_activity": weekly_stats
        })
        
        return {
            "user": {
                "id": str(current_user.id),
                "full_name": current_user.full_name,
                "email": current_user.email,
                "avatar_url": current_user.avatar_url
            },
            "progress": progress.to_dict(),
            "recent_achievements": [achievement.to_dict() for achievement in recent_achievements],
            "active_learning_paths": [path.to_dict() for path in active_paths],
            "weekly_stats": weekly_stats,
            "ai_insights": ai_insights.get("insights", []),
            "recommendations": ai_insights.get("recommendations", []),
            "next_milestones": ai_insights.get("next_milestones", [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard overview: {str(e)}")

@router.get("/xp-details")
async def get_xp_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed XP breakdown with multipliers, recent gains, level progress
    """
    try:
        progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
        if not progress:
            raise HTTPException(status_code=404, detail="User progress not found")
        
        gamification = GamificationService(db)
        
        # Get XP multipliers
        multipliers = await gamification.get_active_multipliers(current_user.id)
        
        # Calculate daily/weekly/monthly goals progress
        goals_progress = {
            "daily": {
                "current": progress.daily_xp,
                "target": progress.daily_goal_xp,
                "percentage": min((progress.daily_xp / progress.daily_goal_xp) * 100, 100) if progress.daily_goal_xp > 0 else 0
            },
            "weekly": {
                "current": progress.weekly_xp,
                "target": progress.weekly_goal_xp,
                "percentage": min((progress.weekly_xp / progress.weekly_goal_xp) * 100, 100) if progress.weekly_goal_xp > 0 else 0
            },
            "monthly": {
                "current": progress.monthly_xp,
                "target": progress.monthly_goal_xp,
                "percentage": min((progress.monthly_xp / progress.monthly_goal_xp) * 100, 100) if progress.monthly_goal_xp > 0 else 0
            }
        }
        
        # XP breakdown by source (last 7 days)
        xp_sources = {
            "lessons": progress.weekly_lessons * 10,  # Assuming 10 XP per lesson
            "quizzes": progress.weekly_quizzes * 25,   # Assuming 25 XP per quiz
            "streak_bonus": max(0, progress.current_streak - 1) * 5,  # Streak bonus
            "achievements": sum([a.xp_reward for a in recent_achievements[:10]])  # Recent achievement rewards
        }
        
        return {
            "current_xp": progress.current_xp,
            "total_xp_earned": progress.total_xp_earned,
            "level": progress.level,
            "xp_to_next_level": progress.xp_to_next_level,
            "level_progress_percentage": progress.level_progress_percentage,
            "multipliers": multipliers,
            "goals_progress": goals_progress,
            "xp_sources": xp_sources,
            "recent_gains": {
                "daily": progress.daily_xp,
                "weekly": progress.weekly_xp,
                "monthly": progress.monthly_xp
            },
            "learning_velocity": progress.learning_velocity,
            "consistency_score": progress.consistency_score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching XP details: {str(e)}")

@router.get("/achievements")
async def get_achievements(
    show_locked: bool = Query(True, description="Include locked achievements"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user achievements with progress, unlocked and locked achievements
    """
    try:
        query = db.query(Achievement).filter(Achievement.user_id == current_user.id)
        
        if category:
            query = query.filter(Achievement.category == category)
        
        if not show_locked:
            query = query.filter(Achievement.is_unlocked == True)
        
        achievements = query.order_by(
            Achievement.is_unlocked.desc(),
            Achievement.unlocked_at.desc(),
            Achievement.rarity.desc()
        ).all()
        
        # Group achievements by status
        unlocked = [a.to_dict() for a in achievements if a.is_unlocked]
        locked = [a.to_dict() for a in achievements if not a.is_unlocked and not a.is_hidden]
        in_progress = [a.to_dict() for a in achievements if not a.is_unlocked and a.progress_current > 0]
        
        # Calculate stats
        total_achievements = len([a for a in achievements if not a.is_hidden])
        unlocked_count = len(unlocked)
        completion_percentage = (unlocked_count / total_achievements * 100) if total_achievements > 0 else 0
        
        # Calculate points from achievements
        total_achievement_xp = sum([a.xp_reward for a in achievements if a.is_unlocked])
        
        return {
            "unlocked": unlocked,
            "locked": locked,
            "in_progress": in_progress,
            "stats": {
                "total_achievements": total_achievements,
                "unlocked_count": unlocked_count,
                "completion_percentage": completion_percentage,
                "total_achievement_xp": total_achievement_xp
            },
            "categories": list(set([a.category for a in achievements])),
            "rarities": {
                "common": len([a for a in unlocked if a["rarity"] == "common"]),
                "rare": len([a for a in unlocked if a["rarity"] == "rare"]),
                "epic": len([a for a in unlocked if a["rarity"] == "epic"]),
                "legendary": len([a for a in unlocked if a["rarity"] == "legendary"])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching achievements: {str(e)}")

@router.get("/weekly-stats")
async def get_weekly_stats(
    weeks_back: int = Query(4, ge=1, le=12, description="Number of weeks to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weekly learning statistics for charts and trends
    """
    try:
        progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
        if not progress:
            raise HTTPException(status_code=404, detail="User progress not found")
        
        # This would typically query a weekly_stats table or calculate from activity logs
        # For now, we'll return the current week data as a template
        current_week_stats = {
            "week_start": (datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())).isoformat(),
            "xp_gained": progress.weekly_xp,
            "lessons_completed": progress.weekly_lessons,
            "quizzes_completed": progress.weekly_quizzes,
            "learning_time_minutes": progress.weekly_learning_time,
            "days_active": min(progress.current_streak, 7),
            "average_session_time": progress.weekly_learning_time / max(progress.weekly_lessons, 1) if progress.weekly_lessons > 0 else 0
        }
        
        # Generate sample data for previous weeks (in real implementation, query from database)
        weekly_data = []
        for i in range(weeks_back):
            week_start = datetime.utcnow() - timedelta(weeks=i+1, days=datetime.utcnow().weekday())
            weekly_data.append({
                "week_start": week_start.isoformat(),
                "xp_gained": max(0, progress.weekly_xp - (i * 50)),  # Sample declining data
                "lessons_completed": max(0, progress.weekly_lessons - i),
                "quizzes_completed": max(0, progress.weekly_quizzes - i),
                "learning_time_minutes": max(0, progress.weekly_learning_time - (i * 30)),
                "days_active": max(0, 7 - i),
                "average_session_time": max(0, 30 - (i * 5))
            })
        
        weekly_data.insert(0, current_week_stats)  # Add current week at the beginning
        
        # Calculate trends
        if len(weekly_data) >= 2:
            xp_trend = weekly_data[0]["xp_gained"] - weekly_data[1]["xp_gained"]
            time_trend = weekly_data[0]["learning_time_minutes"] - weekly_data[1]["learning_time_minutes"]
        else:
            xp_trend = 0
            time_trend = 0
        
        return {
            "weekly_data": weekly_data,
            "trends": {
                "xp_change": xp_trend,
                "time_change": time_trend,
                "consistency_score": progress.consistency_score
            },
            "summary": {
                "total_weeks_tracked": len(weekly_data),
                "average_weekly_xp": sum([w["xp_gained"] for w in weekly_data]) / len(weekly_data),
                "average_weekly_time": sum([w["learning_time_minutes"] for w in weekly_data]) / len(weekly_data),
                "best_week_xp": max([w["xp_gained"] for w in weekly_data]),
                "most_consistent_week": max([w["days_active"] for w in weekly_data])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weekly stats: {str(e)}")

@router.post("/update-goals")
async def update_learning_goals(
    daily_xp_goal: int = Query(..., ge=10, le=500),
    weekly_xp_goal: int = Query(..., ge=50, le=3000),
    monthly_xp_goal: int = Query(..., ge=200, le=10000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's learning goals
    """
    try:
        progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
        if not progress:
            raise HTTPException(status_code=404, detail="User progress not found")
        
        progress.daily_goal_xp = daily_xp_goal
        progress.weekly_goal_xp = weekly_xp_goal
        progress.monthly_goal_xp = monthly_xp_goal
        
        db.commit()
        
        return {
            "message": "Learning goals updated successfully",
            "goals": {
                "daily_xp_goal": daily_xp_goal,
                "weekly_xp_goal": weekly_xp_goal,
                "monthly_xp_goal": monthly_xp_goal
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating goals: {str(e)}")
