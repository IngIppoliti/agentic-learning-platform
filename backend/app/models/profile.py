from sqlalchemy import Column, String, Integer, JSON, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    
    # Basic demographics
    age_range = Column(String(20))  # "18-25", "26-35", etc.
    education_level = Column(String(50))
    current_role = Column(String(100))
    industry = Column(String(100))
    experience_years = Column(Integer)
    
    # Learning preferences
    learning_style = Column(JSON)  # {"visual": 0.7, "auditory": 0.3, "kinesthetic": 0.5}
    preferred_pace = Column(String(20))  # "slow", "medium", "fast"
    daily_time_commitment = Column(Integer)  # minutes per day
    weekly_time_commitment = Column(Integer)  # hours per week
    
    # Skills and interests
    current_skills = Column(JSON)  # {"python": 0.8, "javascript": 0.6, ...}
    target_skills = Column(JSON)  # skills they want to learn
    interests = Column(JSON)  # areas of interest
    
    # Constraints
    budget_range = Column(String(20))  # "0-50", "50-200", "200+"
    preferred_content_types = Column(JSON)  # ["video", "text", "interactive", "project"]
    languages = Column(JSON)  # ["en", "it", "fr"]
    
    # AI-generated insights
    personality_insights = Column(JSON)
    learning_obstacles = Column(JSON)
    motivation_triggers = Column(JSON)
    
    # Goals
    primary_goal = Column(Text)
    secondary_goals = Column(JSON)
    target_timeline = Column(String(50))  # "3 months", "6 months", "1 year"
    
    # Progress tracking
    engagement_score = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile(user_id='{self.user_id}', primary_goal='{self.primary_goal}')>"
