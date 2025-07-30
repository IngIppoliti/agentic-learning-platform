from sqlalchemy import Column, String, Integer, JSON, Text, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid

class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Path metadata
    title = Column(String(200), nullable=False)
    description = Column(Text)
    difficulty_level = Column(String(20))  # "beginner", "intermediate", "advanced"
    estimated_duration_hours = Column(Integer)
    
    # Path structure
    modules = Column(JSON)  # Structured path data
    prerequisites = Column(JSON)
    learning_objectives = Column(JSON)
    
    # Progress
    current_module = Column(Integer, default=0)
    progress_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    
    # Adaptation data
    adaptation_history = Column(JSON)  # Track how path was adapted
    difficulty_adjustments = Column(JSON)
    pace_adjustments = Column(JSON)
    
    # AI metadata
    generated_by_model = Column(String(50))
    confidence_score = Column(Float)
    personalization_factors = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="learning_paths")
    
    def __repr__(self):
        return f"<LearningPath(title='{self.title}', progress={self.progress_percentage}%)>"
