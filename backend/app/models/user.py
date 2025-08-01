from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile info
    first_name = Column(String(100))
    last_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    learning_paths = relationship("LearningPath", back_populates="user")
    achievements = relationship("Achievement", back_populates="user")
    progress = relationship("UserProgress", back_populates="user", uselist=False)
    community_posts = relationship("CommunityPost", back_populates="author")
    post_comments = relationship("PostComment", back_populates="author")
    post_likes = relationship("PostLike", back_populates="user")
    comment_likes = relationship("CommentLike", back_populates="user")
    created_study_groups = relationship("StudyGroup", back_populates="creator")
    study_groups = relationship("StudyGroup", secondary=user_study_groups, back_populates="members")
    
    def __repr__(self):
        return f"<User(email='{self.email}', username='{self.username}')>"
