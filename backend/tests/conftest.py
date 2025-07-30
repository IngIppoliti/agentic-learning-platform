import pytest
import asyncio
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import redis
from unittest.mock import Mock, AsyncMock

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings
from app.models.user import User
from app.models.profile import UserProfile
from app.services.llm_service import LLMService
from app.agents.orchestrator import MasterOrchestrator
from app.agents.profiling_agent import ProfilingAgent
from app.core.security import create_access_token
import uuid

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def db_session():
    """Create test database session"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session):
    """Create test client"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    mock_client = Mock()
    mock_client.ping.return_value = True
    mock_client.get.return_value = None
    mock_client.set.return_value = True
    mock_client.setex.return_value = True
    return mock_client

@pytest.fixture
def mock_llm_service():
    """Mock LLM service"""
    mock_service = AsyncMock(spec=LLMService)
    mock_service.generate_completion.return_value = '{"current_skills": {"python": 0.8}, "learning_readiness": 0.9}'
    return mock_service

@pytest.fixture
def test_user(db_session):
    """Create test user"""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def test_user_profile(db_session, test_user):
    """Create test user profile"""
    profile = UserProfile(
        user_id=test_user.id,
        age_range="25-35",
        education_level="bachelor",
        current_role="developer",
        industry="tech",
        experience_years=3,
        current_skills={"python": 0.7, "javascript": 0.5},
        learning_style={"visual": 0.8, "auditory": 0.3},
        daily_time_commitment=60,
        primary_goal="Learn machine learning"
    )
    db_session.add(profile)
    db_session.commit()
    return profile

@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers"""
    access_token = create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def mock_orchestrator(mock_llm_service, mock_redis, db_session):
    """Create mock orchestrator with agents"""
    orchestrator = MasterOrchestrator(mock_redis)
    
    # Create mock agents
    profiling_agent = ProfilingAgent(mock_llm_service, db_session)
    orchestrator.register_agent(profiling_agent)
    
    return orchestrator

# Test data fixtures
@pytest.fixture
def sample_profile_data():
    """Sample profile analysis data"""
    return {
        "age_range": "25-35",
        "education_level": "bachelor",
        "current_role": "software developer",
        "industry": "technology",
        "experience_years": 3,
        "goals": {
            "primary": "Learn machine learning",
            "timeline": "6 months",
            "motivations": "Career advancement"
        },
        "preferences": {
            "learning_style": "visual",
            "pace": "medium",
            "content_types": ["video", "interactive"]
        },
        "constraints": {
            "daily_minutes": 60,
            "budget_range": "100-300"
        },
        "self_assessment": {
            "python": 0.7,
            "statistics": 0.3,
            "machine_learning": 0.1
        }
    }

@pytest.fixture
def sample_learning_path_request():
    """Sample learning path request"""
    return {
        "goal": "Master Python for Data Science",
        "timeline": "4 months",
        "priority_skills": ["python", "pandas", "scikit-learn"],
        "constraints": {
            "daily_time": 90,
            "budget": 200
        }
    }
