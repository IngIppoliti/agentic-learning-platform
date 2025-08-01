"""
Community API Routes - Posts, comments, study groups, social learning
Richiamato da: Frontend community components, social features
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.community import CommunityPost, PostComment, StudyGroup, PostLike, CommentLike, PostType
from app.services.gamification import GamificationService

router = APIRouter()

@router.get("/feed")
async def get_community_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    post_type: Optional[str] = Query(None, description="Filter by post type"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get community feed with posts, filtering and pagination
    """
    try:
        offset = (page - 1) * limit
        
        query = db.query(CommunityPost).options(
            joinedload(CommunityPost.author),
            joinedload(CommunityPost.comments).joinedload(PostComment.author)
        ).filter(CommunityPost.is_hidden == False)
        
        if post_type:
            query = query.filter(CommunityPost.post_type == post_type)
        
        if topic:
            query = query.filter(CommunityPost.topic == topic)
        
        # Order by engagement and recency
        posts = query.order_by(
            CommunityPost.is_pinned.desc(),
            CommunityPost.is_featured.desc(),
            CommunityPost.last_activity_at.desc()
        ).offset(offset).limit(limit).all()
        
        # Update view counts
        for post in posts:
            post.views_count += 1
        
        db.commit()
        
        # Get trending topics
        trending_query = db.query(CommunityPost.topic).filter(
            CommunityPost.created_at >= datetime.utcnow() - timedelta(days=7),
            CommunityPost.topic.isnot(None)
        ).group_by(CommunityPost.topic).limit(10)
        
        trending_topics = [topic[0] for topic in trending_query.all()]
        
        return {
            "posts": [
                {
                    **post.to_dict(),
                    "author": {
                        "id": str(post.author.id),
                        "full_name": post.author.full_name,
                        "avatar_url": post.author.avatar_url
                    },
                    "comments_preview": [
                        {
                            **comment.to_dict(),
                            "author": {
                                "id": str(comment.author.id),
                                "full_name": comment.author.full_name,
                                "avatar_url": comment.author.avatar_url
                            }
                        } for comment in post.comments[:3]  # Show first 3 comments
                    ]
                } for post in posts
            ],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_posts": query.count(),
                "has_next": len(posts) == limit
            },
            "trending_topics": trending_topics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching community feed: {str(e)}")

@router.post("/posts")
async def create_post(
    post_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new community post
    
    Expected body:
    {
        "title": "Post title",
        "content": "Post content",
        "post_type": "discussion",
        "topic": "JavaScript",
        "tags": ["beginner", "tutorial"],
        "study_group_id": "optional_group_id"
    }
    """
    try:
        post = CommunityPost(
            author_id=current_user.id,
            title=post_data.get("title"),
            content=post_data.get("content"),
            post_type=post_data.get("post_type", PostType.DISCUSSION),
            topic=post_data.get("topic"),
            tags=post_data.get("tags", []),
            study_group_id=post_data.get("study_group_id"),
            achievement_data=post_data.get("achievement_data", {}),
            attachments=post_data.get("attachments", [])
        )
        
        db.add(post)
        db.commit()
        db.refresh(post)
        
        # Award XP for community participation
        gamification = GamificationService(db)
        await gamification.award_xp(
            user_id=current_user.id,
            xp_amount=15,  # Base XP for creating a post
            source="community_post",
            metadata={
                "post_id": str(post.id),
                "post_type": post.post_type,
                "topic": post.topic
            }
        )
        
        return {
            "success": True,
            "post": {
                **post.to_dict(),
                "author": {
                    "id": str(current_user.id),
                    "full_name": current_user.full_name,
                    "avatar_url": current_user.avatar_url
                }
            },
            "xp_earned": 15
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating post: {str(e)}")

@router.get("/posts/{post_id}")
async def get_post_details(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed post with all comments
    """
    try:
        post = db.query(CommunityPost).options(
            joinedload(CommunityPost.author),
            joinedload(CommunityPost.comments).joinedload(PostComment.author)
        ).filter(CommunityPost.id == post_id).first()
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Increment view count
        post.views_count += 1
        db.commit()
        
        # Check if current user has liked the post
        user_liked = db.query(PostLike).filter(
            PostLike.post_id == post.id,
            PostLike.user_id == current_user.id
        ).first() is not None
        
        return {
            "post": {
                **post.to_dict(),
                "author": {
                    "id": str(post.author.id),
                    "full_name": post.author.full_name,
                    "avatar_url": post.author.avatar_url
                },
                "user_liked": user_liked
            },
            "comments": [
                {
                    **comment.to_dict(),
                    "author": {
                        "id": str(comment.author.id),
                        "full_name": comment.author.full_name,
                        "avatar_url": comment.author.avatar_url
                    },
                    "user_liked": db.query(CommentLike).filter(
                        CommentLike.comment_id == comment.id,
                        CommentLike.user_id == current_user.id
                    ).first() is not None
                } for comment in post.comments
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching post details: {str(e)}")

@router.post("/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    comment_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add comment to a post
    
    Expected body:
    {
        "content": "Comment content",
        "parent_comment_id": "optional_parent_id"
    }
    """
    try:
        # Verify post exists
        post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        comment = PostComment(
            post_id=post_id,
            author_id=current_user.id,
            content=comment_data.get("content"),
            parent_comment_id=comment_data.get("parent_comment_id")
        )
        
        db.add(comment)
        
        # Update post comment count and last activity
        post.comments_count += 1
        post.last_activity_at = datetime.utcnow()
        
        db.commit()
        db.refresh(comment)
        
        # Award XP for community engagement
        gamification = GamificationService(db)
        await gamification.award_xp(
            user_id=current_user.id,
            xp_amount=5,  # Base XP for commenting
            source="community_comment",
            metadata={
                "post_id": post_id,
                "comment_id": str(comment.id)
            }
        )
        
        return {
            "success": True,
            "comment": {
                **comment.to_dict(),
                "author": {
                    "id": str(current_user.id),
                    "full_name": current_user.full_name,
                    "avatar_url": current_user.avatar_url
                }
            },
            "xp_earned": 5
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding comment: {str(e)}")

@router.post("/posts/{post_id}/like")
async def toggle_post_like(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle like on a post
    """
    try:
        post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        existing_like = db.query(PostLike).filter(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.id
        ).first()
        
        if existing_like:
            # Unlike
            db.delete(existing_like)
            post.likes_count -= 1
            liked = False
        else:
            # Like
            like = PostLike(post_id=post_id, user_id=current_user.id)
            db.add(like)
            post.likes_count += 1
            liked = True
            
            # Award XP for first like on this post
            gamification = GamificationService(db)
            await gamification.award_xp(
                user_id=current_user.id,
                xp_amount=2,
                source="community_like",
                metadata={"post_id": post_id}
            )
        
        db.commit()
        
        return {
            "success": True,
            "liked": liked,
            "likes_count": post.likes_count,
            "xp_earned": 2 if liked else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling post like: {str(e)}")

@router.get("/study-groups")
async def get_study_groups(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    topic: Optional[str] = Query(None),
    is_public: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get study groups with filtering and pagination
    """
    try:
        offset = (page - 1) * limit
        
        query = db.query(StudyGroup).options(joinedload(StudyGroup.creator))
        
        if is_public:
            query = query.filter(StudyGroup.is_public == True)
        
        if topic:
            query = query.filter(StudyGroup.topic == topic)
        
        study_groups = query.order_by(
            StudyGroup.activity_score.desc(),
            StudyGroup.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return {
            "study_groups": [
                {
                    **group.to_dict(),
                    "creator": {
                        "id": str(group.creator.id),
                        "full_name": group.creator.full_name,
                        "avatar_url": group.creator.avatar_url
                    },
                    "is_member": current_user in group.members
                } for group in study_groups
            ],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_groups": query.count(),
                "has_next": len(study_groups) == limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching study groups: {str(e)}")

@router.post("/study-groups")
async def create_study_group(
    group_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new study group
    
    Expected body:
    {
        "name": "Group name",
        "description": "Group description",
        "topic": "JavaScript",
        "is_public": true,
        "max_members": 25,
        "learning_goals": ["Learn React", "Build projects"]
    }
    """
    try:
        study_group = StudyGroup(
            name=group_data.get("name"),
            description=group_data.get("description"),
            topic=group_data.get("topic"),
            is_public=group_data.get("is_public", True),
            max_members=group_data.get("max_members", 50),
            requires_approval=group_data.get("requires_approval", False),
            creator_id=current_user.id,
            learning_goals=group_data.get("learning_goals", []),
            resources=group_data.get("resources", []),
            schedule=group_data.get("schedule", {})
        )
        
        db.add(study_group)
        db.commit()
        db.refresh(study_group)
        
        # Creator automatically joins the group
        study_group.members.append(current_user)
        study_group.members_count = 1
        db.commit()
        
        # Award XP for creating study group
        gamification = GamificationService(db)
        await gamification.award_xp(
            user_id=current_user.id,
            xp_amount=25,
            source="study_group_creation",
            metadata={"group_id": str(study_group.id)}
        )
        
        return {
            "success": True,
            "study_group": {
                **study_group.to_dict(),
                "creator": {
                    "id": str(current_user.id),
                    "full_name": current_user.full_name,
                    "avatar_url": current_user.avatar_url
                }
            },
            "xp_earned": 25
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating study group: {str(e)}")

@router.post("/study-groups/{group_id}/join")
async def join_study_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Join a study group
    """
    try:
        study_group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
        if not study_group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        if current_user in study_group.members:
            raise HTTPException(status_code=400, detail="Already a member of this group")
        
        if study_group.members_count >= study_group.max_members:
            raise HTTPException(status_code=400, detail="Study group is full")
        
        # Add user to group
        study_group.members.append(current_user)
        study_group.members_count += 1
        study_group.last_activity_at = datetime.utcnow()
        
        db.commit()
        
        # Award XP for joining study group
        gamification = GamificationService(db)
        await gamification.award_xp(
            user_id=current_user.id,
            xp_amount=10,
            source="study_group_join",
            metadata={"group_id": group_id}
        )
        
        return {
            "success": True,
            "message": "Successfully joined study group",
            "xp_earned": 10
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error joining study group: {str(e)}")
