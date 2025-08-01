"""
Gamification Service - 

XP, Badges, Leaderboards - Sistema completo per:

⚡ XP System con multipliers e level calculation
🏆 Badge System (Common, Rare, Epic, Legendary)
🎯 Achievement System con prerequisiti
📊 Leaderboards multipli (weekly, monthly, total)
🔥 Streak Bonuses psychology-based
🎮 Challenge Creation per community engagement

"""
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import logging
import json
import math

logger = logging.getLogger(__name__)

class BadgeRarity(Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"

class AchievementType(Enum):
    LEARNING = "learning"
    STREAK = "streak"
    SOCIAL = "social"
    SKILL = "skill"
    MILESTONE = "milestone"

class LeaderboardType(Enum):
    WEEKLY_XP = "weekly_xp"
    MONTHLY_XP = "monthly_xp"
    TOTAL_XP = "total_xp"
    STREAK = "streak"
    LESSONS_COMPLETED = "lessons_completed"

@dataclass
class Badge:
    id: str
    name: str
    description: str
    icon: str
    rarity: BadgeRarity
    xp_reward: int
    requirements: Dict[str, Any]
    category: str

@dataclass
class Achievement:
    id: str
    title: str
    description: str
    badge_id: str
    type: AchievementType
    requirements: Dict[str, Any]
    reward_xp: int
    reward_items: List[str] = field(default_factory=list)
    is_hidden: bool = False
    prerequisite_achievements: List[str] = field(default_factory=list)

@dataclass  
class UserProgress:
    user_id: str
    current_xp: int
    level: int
    total_xp_earned: int
    current_streak: int
    longest_streak: int
    badges_earned: List[str]
    achievements_unlocked: List[str]
    last_activity: datetime
    weekly_xp: int
    monthly_xp: int

@dataclass
class XPEvent:
    user_id: str
    event_type: str
    xp_amount: int
    multiplier: float
    description: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class LeaderboardEntry:
    user_id: str
    username: str
    avatar: str
    score: int
    rank: int
    level: int
    badges_count: int

class GamificationService:
    """Service per gestione gamification: XP, badges, leaderboards"""

    def __init__(self):
        self.xp_multipliers = {
            "lesson_complete": settings.XP_MULTIPLIER_LESSON,    # ← USA CONFIG!
            "quiz_perfect": settings.XP_MULTIPLIER_QUIZ,         # ← USA CONFIG!
            "daily_goal": 1.2,
            "streak_bonus": settings.XP_MULTIPLIER_STREAK,       # ← USA CONFIG!
            "first_try": 1.3
        }

        self.level_thresholds = self._calculate_level_thresholds()
        self.badges = self._initialize_badges()
        self.achievements = self._initialize_achievements()

    def _calculate_level_thresholds(self) -> Dict[int, int]:
        """Calcola soglie XP per ogni level"""
        thresholds = {}
        base_xp = 100

        for level in range(1, 101):  # Fino al level 100
            if level == 1:
                thresholds[level] = base_xp
            else:
                # Formula: XP needed = base_xp * level^1.5
                thresholds[level] = thresholds[level-1] + int(base_xp * (level ** 1.5))

        return thresholds

    def _initialize_badges(self) -> Dict[str, Badge]:
        """Inizializza tutti i badges disponibili"""
        badges = {}

        # Learning Badges
        learning_badges = [
            Badge("first_lesson", "First Steps", "Complete your first lesson", "🎯", 
                  BadgeRarity.COMMON, 50, {"lessons_completed": 1}, "learning"),
            Badge("fast_learner", "Fast Learner", "Complete 10 lessons in one day", "⚡", 
                  BadgeRarity.RARE, 200, {"lessons_per_day": 10}, "learning"),
            Badge("knowledge_seeker", "Knowledge Seeker", "Complete 100 lessons", "📚", 
                  BadgeRarity.EPIC, 500, {"lessons_completed": 100}, "learning"),
            Badge("master_student", "Master Student", "Complete 500 lessons", "🎓", 
                  BadgeRarity.LEGENDARY, 1000, {"lessons_completed": 500}, "learning"),
        ]

        # Streak Badges  
        streak_badges = [
            Badge("consistent", "Consistent Learner", "Maintain a 7-day streak", "🔥", 
                  BadgeRarity.COMMON, 100, {"streak_days": 7}, "streak"),
            Badge("dedicated", "Dedicated Student", "Maintain a 30-day streak", "💪", 
                  BadgeRarity.RARE, 300, {"streak_days": 30}, "streak"),
            Badge("unstoppable", "Unstoppable", "Maintain a 100-day streak", "🚀", 
                  BadgeRarity.EPIC, 800, {"streak_days": 100}, "streak"),
            Badge("legendary_streak", "Legendary Streak", "Maintain a 365-day streak", "👑", 
                  BadgeRarity.LEGENDARY, 2000, {"streak_days": 365}, "streak"),
        ]

        # Skill Badges
        skill_badges = [
            Badge("js_novice", "JavaScript Novice", "Complete JavaScript basics", "📘", 
                  BadgeRarity.COMMON, 150, {"skill_level": {"javascript": 3}}, "skill"),
            Badge("python_expert", "Python Expert", "Master Python programming", "🐍", 
                  BadgeRarity.EPIC, 600, {"skill_level": {"python": 8}}, "skill"),
            Badge("ai_pioneer", "AI Pioneer", "Complete AI/ML specialization", "🤖", 
                  BadgeRarity.LEGENDARY, 1200, {"skill_level": {"ai_ml": 10}}, "skill"),
        ]

        # Social Badges
        social_badges = [
            Badge("helpful", "Helpful Community Member", "Help 10 other students", "🤝", 
                  BadgeRarity.RARE, 250, {"help_count": 10}, "social"),
            Badge("mentor", "Mentor", "Become a top contributor", "🌟", 
                  BadgeRarity.EPIC, 500, {"mentor_status": True}, "social"),
        ]

        all_badges = learning_badges + streak_badges + skill_badges + social_badges

        for badge in all_badges:
            badges[badge.id] = badge

        return badges

    def _initialize_achievements(self) -> Dict[str, Achievement]:
        """Inizializza tutti gli achievements"""
        achievements = {}

        # Learning Achievements
        learning_achievements = [
            Achievement("welcome", "Welcome to LearnAI", "Complete your profile setup", 
                       "first_lesson", AchievementType.MILESTONE, {"profile_complete": True}, 25),
            Achievement("first_week", "First Week Complete", "Study for 7 consecutive days", 
                       "consistent", AchievementType.STREAK, {"streak_days": 7}, 100),
            Achievement("century_club", "Century Club", "Earn 10,000 total XP", 
                       "knowledge_seeker", AchievementType.MILESTONE, {"total_xp": 10000}, 300),
        ]

        # Skill Achievements
        skill_achievements = [
            Achievement("polyglot", "Programming Polyglot", "Learn 3 different languages", 
                       "js_novice", AchievementType.SKILL, {"languages_learned": 3}, 400),
            Achievement("full_stack", "Full Stack Developer", "Complete frontend and backend tracks", 
                       "python_expert", AchievementType.SKILL, {"tracks_completed": ["frontend", "backend"]}, 600),
        ]

        all_achievements = learning_achievements + skill_achievements

        for achievement in all_achievements:
            achievements[achievement.id] = achievement

        return achievements

    async def award_xp(
        self, 
        user_id: str, 
        base_xp: int, 
        event_type: str, 
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> XPEvent:
        """Assegna XP a un utente con multipliers"""
        try:
            # Calcola multiplier
            multiplier = self.xp_multipliers.get(event_type, 1.0)

            # XP finale
            final_xp = int(base_xp * multiplier)

            # Crea evento XP
            xp_event = XPEvent(
                user_id=user_id,
                event_type=event_type,
                xp_amount=final_xp,
                multiplier=multiplier,
                description=description,
                timestamp=datetime.utcnow(),
                metadata=metadata or {}
            )

            logger.info(f"XP awarded: {final_xp} to user {user_id} for {event_type}")
            return xp_event

        except Exception as e:
            logger.error(f"Failed to award XP: {e}")
            raise

    def calculate_level(self, total_xp: int) -> Tuple[int, int, int]:
        """Calcola level corrente, XP needed per next level, progress"""
        current_level = 1

        for level, threshold in self.level_thresholds.items():
            if total_xp >= threshold:
                current_level = level
            else:
                break

        # XP per prossimo level
        next_level_xp = self.level_thresholds.get(current_level + 1, float('inf'))
        current_level_xp = self.level_thresholds.get(current_level, 0)

        xp_for_next = next_level_xp - total_xp
        level_progress = total_xp - current_level_xp

        return current_level, xp_for_next, level_progress

    async def check_badge_eligibility(
        self, 
        user_progress: UserProgress,
        recent_activity: Dict[str, Any]
    ) -> List[Badge]:
        """Controlla quali badges l'utente ha sbloccato"""
        newly_earned = []

        try:
            for badge_id, badge in self.badges.items():
                if badge_id in user_progress.badges_earned:
                    continue  # Già posseduto

                # Controlla requirements
                eligible = True

                for requirement, threshold in badge.requirements.items():
                    if requirement == "lessons_completed":
                        if recent_activity.get("total_lessons", 0) < threshold:
                            eligible = False
                            break
                    elif requirement == "streak_days":
                        if user_progress.current_streak < threshold:
                            eligible = False
                            break
                    elif requirement == "lessons_per_day":
                        if recent_activity.get("lessons_today", 0) < threshold:
                            eligible = False
                            break
                    elif requirement == "skill_level":
                        skill_levels = recent_activity.get("skill_levels", {})
                        for skill, required_level in threshold.items():
                            if skill_levels.get(skill, 0) < required_level:
                                eligible = False
                                break
                        if not eligible:
                            break

                if eligible:
                    newly_earned.append(badge)
                    logger.info(f"Badge earned: {badge.name} by user {user_progress.user_id}")

            return newly_earned

        except Exception as e:
            logger.error(f"Failed to check badge eligibility: {e}")
            return []

    async def check_achievement_eligibility(
        self,
        user_progress: UserProgress,
        recent_activity: Dict[str, Any]
    ) -> List[Achievement]:
        """Controlla quali achievements l'utente ha sbloccato"""
        newly_unlocked = []

        try:
            for achievement_id, achievement in self.achievements.items():
                if achievement_id in user_progress.achievements_unlocked:
                    continue  # Già posseduto

                # Controlla prerequisiti
                if achievement.prerequisite_achievements:
                    prerequisites_met = all(
                        prereq in user_progress.achievements_unlocked 
                        for prereq in achievement.prerequisite_achievements
                    )
                    if not prerequisites_met:
                        continue

                # Controlla requirements
                eligible = True

                for requirement, threshold in achievement.requirements.items():
                    if requirement == "profile_complete":
                        if not recent_activity.get("profile_complete", False):
                            eligible = False
                            break
                    elif requirement == "streak_days":
                        if user_progress.current_streak < threshold:
                            eligible = False
                            break
                    elif requirement == "total_xp":
                        if user_progress.total_xp_earned < threshold:
                            eligible = False
                            break
                    elif requirement == "languages_learned":
                        learned_languages = recent_activity.get("languages_learned", [])
                        if len(learned_languages) < threshold:
                            eligible = False
                            break
                    elif requirement == "tracks_completed":
                        completed_tracks = recent_activity.get("completed_tracks", [])
                        if not all(track in completed_tracks for track in threshold):
                            eligible = False
                            break

                if eligible:
                    newly_unlocked.append(achievement)
                    logger.info(f"Achievement unlocked: {achievement.title} by user {user_progress.user_id}")

            return newly_unlocked

        except Exception as e:
            logger.error(f"Failed to check achievement eligibility: {e}")
            return []

    async def calculate_streak_bonus(self, current_streak: int) -> float:
        """Calcola bonus multiplier basato su streak"""
        if current_streak < 3:
            return 1.0
        elif current_streak < 7:
            return 1.1
        elif current_streak < 14:
            return 1.2
        elif current_streak < 30:
            return 1.3
        elif current_streak < 60:
            return 1.5
        else:
            return 2.0  # Max bonus per streak molto lunghi

    async def get_leaderboard(
        self,
        leaderboard_type: LeaderboardType,
        limit: int = 50,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Recupera leaderboard con ranking"""
        try:
            # Mock data per esempio - in realtà si recupererebbe dal database
            mock_entries = []

            for i in range(limit):
                entry = LeaderboardEntry(
                    user_id=f"user_{i+1}",
                    username=f"User{i+1}",
                    avatar=f"👤",
                    score=10000 - (i * 100),  # Score decrescente
                    rank=i + 1,
                    level=max(1, 50 - i),
                    badges_count=max(0, 20 - i)
                )
                mock_entries.append(entry)

            # Se user_id specificato, trova la sua posizione
            user_rank = None
            if user_id:
                for entry in mock_entries:
                    if entry.user_id == user_id:
                        user_rank = entry.rank
                        break

            return {
                "type": leaderboard_type.value,
                "entries": [
                    {
                        "user_id": entry.user_id,
                        "username": entry.username,
                        "avatar": entry.avatar,
                        "score": entry.score,
                        "rank": entry.rank,
                        "level": entry.level,
                        "badges_count": entry.badges_count
                    } for entry in mock_entries
                ],
                "user_rank": user_rank,
                "total_participants": len(mock_entries) * 10,  # Simula più partecipanti
                "last_updated": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to get leaderboard: {e}")
            raise

    async def create_challenge(
        self,
        title: str,
        description: str,
        requirements: Dict[str, Any],
        reward_xp: int,
        duration_days: int,
        max_participants: Optional[int] = None
    ) -> Dict[str, Any]:
        """Crea una sfida di gamification"""
        try:
            challenge = {
                "id": f"challenge_{int(datetime.utcnow().timestamp())}",
                "title": title,
                "description": description,
                "requirements": requirements,
                "reward_xp": reward_xp,
                "start_date": datetime.utcnow().isoformat(),
                "end_date": (datetime.utcnow() + timedelta(days=duration_days)).isoformat(),
                "max_participants": max_participants,
                "participants": [],
                "status": "active"
            }

            logger.info(f"Challenge created: {title}")
            return challenge

        except Exception as e:
            logger.error(f"Failed to create challenge: {e}")
            raise

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Recupera statistiche complete dell'utente"""
        try:
            # Mock data - in realtà dal database
            stats = {
                "user_id": user_id,
                "level": 12,
                "current_xp": 8750,
                "next_level_xp": 10000,
                "total_xp": 45000,
                "current_streak": 15,
                "longest_streak": 28,
                "badges_earned": 8,
                "achievements_unlocked": 12,
                "lessons_completed": 234,
                "courses_completed": 5,
                "weekly_xp": 2400,
                "monthly_xp": 8750,
                "rank_weekly": 45,
                "rank_overall": 128,
                "favorite_subjects": ["JavaScript", "Python", "AI/ML"],
                "study_time_minutes": 15420,
                "perfect_scores": 89,
                "help_given": 23
            }

            return stats

        except Exception as e:
            logger.error(f"Failed to get user stats: {e}")
            raise
