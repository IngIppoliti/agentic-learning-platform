"""
Community Models - Posts, Comments, Groups, Social Learning
Richiamato da: community API routes, social features
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from enum import Enum
from app.database import Base

# Association table for many-to-many relationship between users and study groups
user_study_groups = Table(
    'user_study_groups',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE')),
    Column('study_group_id', UUID(as_uuid=True), ForeignKey('study_groups.id', ondelete='CASCADE'))
)

class PostType(str, Enum):
    """Post types enum"""
    ACHIEVEMENT = "achievement"
    QUESTION = "question"
    TIP = "tip"
    DISCUSSION = "discussion"
    STUDY_NOTE = "study_note"
    PROGRESS_UPDATE = "progress_update"

class CommunityPost(Base):
    """
    Model per post della community (achievements, domande, tips)
    """
    __tablename__ = "community_posts"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    study_group_id = Column(UUID(as_uuid=True), ForeignKey("study_groups.id", ondelete="SET NULL"))
    
    # Post content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String(50), default=PostType.DISCUSSION, nullable=False)
    
    # Tags and categorization
    tags = Column(JSONB, default=[])  # List of tags
    topic = Column(String(100))  # Main topic/subject
    difficulty_level = Column(String(20), default="beginner")
    
    # Engagement metrics
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    
    # Content flags
    is_pinned = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    is_answered = Column(Boolean, default=False)  # For questions
    is_hidden = Column(Boolean, default=False)
    is_reported = Column(Boolean, default=False)
    
    # Achievement-specific data
    achievement_data = Column(JSONB, default={})  # For achievement posts
    
    # Media attachments
    attachments = Column(JSONB, default=[])  # URLs to images, files
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    author = relationship("User", back_populates="community_posts")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    study_group = relationship("StudyGroup", back_populates="posts")
    
    def __repr__(self):
        return f"<CommunityPost {self.title[:30]}... by {self.author_id}>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "author_id": str(self.author_id),
            "study_group_id": str(self.study_group_id) if self.study_group_id else None,
            "title": self.title,
            "content": self.content,
            "post_type": self.post_type,
            "tags": self.tags,
            "topic": self.topic,
            "difficulty_level": self.difficulty_level,
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "views_count": self.views_count,
            "shares_count": self.shares_count,
            "is_pinned": self.is_pinned,
            "is_featured": self.is_featured,
            "is_answered": self.is_answered,
            "is_hidden": self.is_hidden,
            "achievement_data": self.achievement_data,
            "attachments": self.attachments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_activity_at": self.last_activity_at.isoformat() if self.last_activity_at else None
        }

class PostComment(Base):
    """
    Model per commenti sui post della community
    """
    __tablename__ = "post_comments"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey("post_comments.id", ondelete="CASCADE"))  # For replies
    
    # Comment content
    content = Column(Text, nullable=False)
    
    # Engagement
    likes_count = Column(Integer, default=0)
    is_answer = Column(Boolean, default=False)  # Marked as answer for questions
    is_hidden = Column(Boolean, default=False)
    is_reported = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User", back_populates="post_comments")
    parent_comment = relationship("PostComment", remote_side=[id])
    replies = relationship("PostComment", back_populates="parent_comment")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PostComment on {self.post_id} by {self.author_id}>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "post_id": str(self.post_id),
            "author_id": str(self.author_id),
            "parent_comment_id": str(self.parent_comment_id) if self.parent_comment_id else None,
            "content": self.content,
            "likes_count": self.likes_count,
            "is_answer": self.is_answer,
            "is_hidden": self.is_hidden,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class StudyGroup(Base):
    """
    Model per gruppi di studio collaborativi
    """
    __tablename__ = "study_groups"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Group info
    name = Column(String(255), nullable=False)
    description = Column(Text)
    topic = Column(String(100), nullable=False)
    
    # Group settings
    is_public = Column(Boolean, default=True)
    max_members = Column(Integer, default=50)
    requires_approval = Column(Boolean, default=False)
    
    # Creator and admin
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Statistics
    members_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    activity_score = Column(Float, default=0.0)
    
    # Group data
    learning_goals = Column(JSONB, default=[])
    resources = Column(JSONB, default=[])  # Shared resources
    schedule = Column(JSONB, default={})   # Study schedule
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_study_groups")
    members = relationship("User", secondary=user_study_groups, back_populates="study_groups")
    posts = relationship("CommunityPost", back_populates="study_group")
    
    def __repr__(self):
        return f"<StudyGroup {self.name} - {self.members_count} members>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "topic": self.topic,
            "is_public": self.is_public,
            "max_members": self.max_members,
            "requires_approval": self.requires_approval,
            "creator_id": str(self.creator_id),
            "members_count": self.members_count,
            "posts_count": self.posts_count,
            "activity_score": self.activity_score,
            "learning_goals": self.learning_goals,
            "resources": self.resources,
            "schedule": self.schedule,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_activity_at": self.last_activity_at.isoformat() if self.last_activity_at else None
        }

class PostLike(Base):
    """
    Model per likes sui post
    """
    __tablename__ = "post_likes"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("CommunityPost", back_populates="likes")
    user = relationship("User", back_populates="post_likes")
    
    # Unique constraint
    __table_args__ = (
        {'extend_existing': True}
    )

class CommentLike(Base):
    """
    Model per likes sui commenti
    """
    __tablename__ = "comment_likes"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    comment_id = Column(UUID(as_uuid=True), ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    comment = relationship("PostComment", back_populates="likes")
    user = relationship("User", back_populates="comment_likes")
