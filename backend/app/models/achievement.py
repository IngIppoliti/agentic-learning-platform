"""
Achievement Model - Sistema gamification con badges e rewards
Richiamato da: gamification.py, dashboard API, users.py
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Achievement(Base):
    """
    Model per achievements e badges del sistema di gamification
    """
    __tablename__ = "achievements"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Achievement data
    achievement_id = Column(String(100), nullable=False, index=True)  # Unique identifier
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(50), default="general")  # learning, social, streak, etc.
    
    # Badge properties
    badge_icon = Column(String(10), default="🏆")
    badge_color = Column(String(7), default="#FFD700")  # Hex color
    rarity = Column(String(50), default="common")  # common, rare, epic, legendary
    
    # Rewards
    xp_reward = Column(Integer, default=0)
    bonus_multiplier = Column(Integer, default=1)
    
    # Progress tracking
    progress_current = Column(Integer, default=0)
    progress_required = Column(Integer, default=1)
    is_unlocked = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)  # Secret achievements
    
    # Metadata
    unlock_criteria = Column(JSONB, default={})  # Criteria for unlocking
    progress_data = Column(JSONB, default={})    # Additional progress data
    unlock_message = Column(Text)  # Custom message when unlocked
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    unlocked_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="achievements")
    
    def __repr__(self):
        return f"<Achievement {self.title} - User {self.user_id}>"
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage"""
        if self.progress_required == 0:
            return 100.0
        return min((self.progress_current / self.progress_required) * 100, 100.0)
    
    @property
    def is_completed(self) -> bool:
        """Check if achievement is completed"""
        return self.progress_current >= self.progress_required
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "achievement_id": self.achievement_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "badge_icon": self.badge_icon,
            "badge_color": self.badge_color,
            "rarity": self.rarity,
            "xp_reward": self.xp_reward,
            "bonus_multiplier": self.bonus_multiplier,
            "progress_current": self.progress_current,
            "progress_required": self.progress_required,
            "progress_percentage": self.progress_percentage,
            "is_unlocked": self.is_unlocked,
            "is_hidden": self.is_hidden,
            "is_completed": self.is_completed,
            "unlock_criteria": self.unlock_criteria,
            "progress_data": self.progress_data,
            "unlock_message": self.unlock_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# Achievement categories enum
class AchievementCategory:
    LEARNING = "learning"
    SOCIAL = "social"
    STREAK = "streak"
    MILESTONE = "milestone"
    SPECIAL = "special"
    COMMUNITY = "community"

# Achievement rarity enum
class AchievementRarity:
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"
