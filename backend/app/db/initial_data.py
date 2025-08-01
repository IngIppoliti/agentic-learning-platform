# CREARE: backend/app/db/initial_data.py
"""
Seed database with initial achievements, default settings
"""

INITIAL_ACHIEVEMENTS = [
    {
        "achievement_id": "first_login",
        "title": "Welcome Aboard!",
        "description": "Complete your first login",
        "category": "milestone",
        "rarity": "common", 
        "xp_reward": 10,
        "badge_icon": "🎉"
    },
    {
        "achievement_id": "first_lesson", 
        "title": "Learning Begins",
        "description": "Complete your first lesson",
        "category": "learning",
        "rarity": "common",
        "xp_reward": 25,
        "badge_icon": "📚"
    }
]
