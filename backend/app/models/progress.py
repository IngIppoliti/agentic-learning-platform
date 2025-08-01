"""
User Progress Model - Tracking XP, levels, streaks, statistics
Richiamato da: gamification.py, progress_tracker.py, dashboard API
"""
from sqlalchemy import Column, String, Integer, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta
from app.database import Base

class UserProgress(Base):
    """
    Model per tracking del progresso utente (XP, livelli, streaks)
    """
    __tablename__ = "user_progress"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # XP and Level System
    current_xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    total_xp_earned = Column(Integer, default=0, nullable=False)
    xp_to_next_level = Column(Integer, default=100, nullable=False)
    
    # Time-based XP tracking
    daily_xp = Column(Integer, default=0)
    weekly_xp = Column(Integer, default=0)
    monthly_xp = Column(Integer, default=0)
    yearly_xp = Column(Integer, default=0)
    
    # Streak System
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    streak_freeze_count = Column(Integer, default=0)  # Streak protection uses
    last_activity_date = Column(DateTime(timezone=True))
    
    # Learning Statistics
    total_lessons_completed = Column(Integer, default=0)
    total_quizzes_completed = Column(Integer, default=0)
    total_assessments_completed = Column(Integer, default=0)
    total_learning_time_minutes = Column(Integer, default=0)
    
    # Performance Metrics
    average_quiz_score = Column(Float, default=0.0)
    total_correct_answers = Column(Integer, default=0)
    total_questions_answered = Column(Integer, default=0)
    improvement_rate = Column(Float, default=0.0)  # Learning curve slope
    
    # Weekly Statistics (rolling)
    weekly_lessons = Column(Integer, default=0)
    weekly_quizzes = Column(Integer, default=0)
    weekly_learning_time = Column(Integer, default=0)
    week_start_date = Column(DateTime(timezone=True))
    
    # Monthly Statistics (rolling)
    monthly_lessons = Column(Integer, default=0)
    monthly_quizzes = Column(Integer, default=0)
    monthly_learning_time = Column(Integer, default=0)
    month_start_date = Column(DateTime(timezone=True))
    
    # Goal Tracking
    daily_goal_xp = Column(Integer, default=50)
    weekly_goal_xp = Column(Integer, default=350)
    monthly_goal_xp = Column(Integer, default=1500)
    daily_goal_streak = Column(Integer, default=7)
    
    # Advanced Analytics
    learning_velocity = Column(Float, default=0.0)  # XP per day trend
    consistency_score = Column(Float, default=0.0)  # Activity regularity
    difficulty_preference = Column(String(20), default="medium")
    
    # Metadata and Custom Data
    preferences = Column(JSONB, default={})  # User learning preferences
    analytics_data = Column(JSONB, default={})  # Extended analytics
    milestone_data = Column(JSONB, default={})  # Milestone achievements
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_xp_gain = Column(DateTime(timezone=True))
    last_level_up = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="progress")
    
    def __repr__(self):
        return f"<UserProgress Level {self.level} - {self.current_xp} XP - User {self.user_id}>"
    
    @property
    def level_progress_percentage(self) -> float:
        """Calculate progress to next level"""
        if self.xp_to_next_level == 0:
            return 100.0
        current_level_xp = self.current_xp - self.get_xp_for_level(self.level)
        return min((current_level_xp / (self.xp_to_next_level - self.get_xp_for_level(self.level))) * 100, 100.0)
    
    @property
    def accuracy_percentage(self) -> float:
        """Calculate overall accuracy"""
        if self.total_questions_answered == 0:
            return 0.0
        return (self.total_correct_answers / self.total_questions_answered) * 100
    
    @property
    def is_streak_active(self) -> bool:
        """Check if streak is currently active"""
        if not self.last_activity_date:
            return False
        days_since_activity = (datetime.utcnow() - self.last_activity_date).days
        return days_since_activity <= 1
    
    @staticmethod
    def get_xp_for_level(level: int) -> int:
        """Calculate total XP required for a specific level"""
        if level <= 1:
            return 0
        # Progressive XP formula: level^1.5 * 100
        return int((level - 1) ** 1.5 * 100)
    
    @staticmethod
    def get_level_from_xp(total_xp: int) -> int:
        """Calculate level from total XP"""
        level = 1
        while UserProgress.get_xp_for_level(level + 1) <= total_xp:
            level += 1
        return level
    
    def update_level(self):
        """Update level based on current XP"""
        new_level = self.get_level_from_xp(self.total_xp_earned)
        if new_level > self.level:
            self.last_level_up = datetime.utcnow()
            self.level = new_level
        self.xp_to_next_level = self.get_xp_for_level(self.level + 1)
        self.current_xp = self.total_xp_earned - self.get_xp_for_level(self.level)
    
    def add_xp(self, xp_amount: int) -> dict:
        """Add XP and return level up info"""
        old_level = self.level
        self.total_xp_earned += xp_amount
        self.last_xp_gain = datetime.utcnow()
        
        # Update time-based XP
        now = datetime.utcnow()
        if self.last_updated and now.date() == self.last_updated.date():
            self.daily_xp += xp_amount
        else:
            self.daily_xp = xp_amount
            
        self.weekly_xp += xp_amount
        self.monthly_xp += xp_amount
        self.yearly_xp += xp_amount
        
        # Update level
        self.update_level()
        
        return {
            "xp_gained": xp_amount,
            "level_up": self.level > old_level,
            "old_level": old_level,
            "new_level": self.level,
            "total_xp": self.total_xp_earned
        }
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "current_xp": self.current_xp,
            "level": self.level,
            "total_xp_earned": self.total_xp_earned,
            "xp_to_next_level": self.xp_to_next_level,
            "level_progress_percentage": self.level_progress_percentage,
            "daily_xp": self.daily_xp,
            "weekly_xp": self.weekly_xp,
            "monthly_xp": self.monthly_xp,
            "current_streak": self.current_streak,
            "longest_streak": self.longest_streak,
            "is_streak_active": self.is_streak_active,
            "total_lessons_completed": self.total_lessons_completed,
            "total_quizzes_completed": self.total_quizzes_completed,
            "total_assessments_completed": self.total_assessments_completed,
            "total_learning_time_minutes": self.total_learning_time_minutes,
            "average_quiz_score": self.average_quiz_score,
            "accuracy_percentage": self.accuracy_percentage,
            "total_correct_answers": self.total_correct_answers,
            "total_questions_answered": self.total_questions_answered,
            "improvement_rate": self.improvement_rate,
            "learning_velocity": self.learning_velocity,
            "consistency_score": self.consistency_score,
            "weekly_lessons": self.weekly_lessons,
            "weekly_quizzes": self.weekly_quizzes,
            "weekly_learning_time": self.weekly_learning_time,
            "monthly_lessons": self.monthly_lessons,
            "monthly_quizzes": self.monthly_quizzes,
            "monthly_learning_time": self.monthly_learning_time,
            "daily_goal_xp": self.daily_goal_xp,
            "weekly_goal_xp": self.weekly_goal_xp,
            "monthly_goal_xp": self.monthly_goal_xp,
            "preferences": self.preferences,
            "analytics_data": self.analytics_data,
            "milestone_data": self.milestone_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "last_activity_date": self.last_activity_date.isoformat() if self.last_activity_date else None,
            "last_xp_gain": self.last_xp_gain.isoformat() if self.last_xp_gain else None,
            "last_level_up": self.last_level_up.isoformat() if self.last_level_up else None
        }
