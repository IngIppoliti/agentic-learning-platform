"""
Configuration management usando Pydantic Settings
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional, List
import os
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings con environment variables"""

    # App Settings
    app_name: str = Field(default="LearnAI Platform", description="Application name")
    debug: bool = Field(default=False, description="Debug mode")
    version: str = Field(default="1.0.0", description="Application version")

    # Server Settings
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=1, description="Number of workers")

    # Security Settings
    secret_key: str = Field(..., description="Secret key for JWT")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiry")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token expiry")

    # Database Settings
    database_url: str = Field(..., description="PostgreSQL database URL")
    database_pool_size: int = Field(default=20, description="Database connection pool size")
    database_max_overflow: int = Field(default=30, description="Database max overflow")
    database_pool_timeout: int = Field(default=30, description="Database pool timeout")

    # Redis Settings
    redis_url: str = Field(default="redis://localhost:6379", description="Redis URL")
    redis_max_connections: int = Field(default=20, description="Redis max connections")
    redis_timeout: int = Field(default=5, description="Redis timeout")

    # LLM API Settings
    openai_api_key: str = Field(..., description="OpenAI API key")
    anthropic_api_key: str = Field(..., description="Anthropic API key")
    openai_model: str = Field(default="gpt-4", description="Default OpenAI model")
    anthropic_model: str = Field(default="claude-3-sonnet-20240229", description="Default Anthropic model")

    # LLM Model Settings  
    OPENAI_MODEL: str = Field(default="gpt-4", description="Default OpenAI model")
    ANTHROPIC_MODEL: str = Field(default="claude-3-sonnet-20240229", description="Default Anthropic model")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-ada-002", description="OpenAI embedding model")
    
    # Gamification Settings
    XP_MULTIPLIER_LESSON: float = Field(default=1.0, description="XP multiplier for lessons")
    XP_MULTIPLIER_QUIZ: float = Field(default=1.5, description="XP multiplier for quizzes")
    XP_MULTIPLIER_STREAK: float = Field(default=2.0, description="XP multiplier for streaks")
    
    # Vector Search Settings
    VECTOR_SEARCH_TOP_K: int = Field(default=10, description="Default top K for vector search")
    VECTOR_RERANK_ENABLED: bool = Field(default=True, description="Enable vector result reranking")

    # Pinecone Settings
    pinecone_api_key: str = Field(..., description="Pinecone API key")
    pinecone_environment: str = Field(..., description="Pinecone environment")
    pinecone_index_name: str = Field(default="learnai-vectors", description="Pinecone index name")

    # CORS Settings
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"], 
        description="CORS allowed origins"
    )
    cors_credentials: bool = Field(default=True, description="CORS allow credentials")
    cors_methods: List[str] = Field(default=["*"], description="CORS allowed methods")
    cors_headers: List[str] = Field(default=["*"], description="CORS allowed headers")

    # Logging Settings
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )
    log_file: Optional[str] = Field(default=None, description="Log file path")

    # Email Settings (per notifications)
    smtp_server: Optional[str] = Field(default=None, description="SMTP server")
    smtp_port: int = Field(default=587, description="SMTP port")
    smtp_username: Optional[str] = Field(default=None, description="SMTP username")
    smtp_password: Optional[str] = Field(default=None, description="SMTP password")

    # File Upload Settings
    max_file_size: int = Field(default=10 * 1024 * 1024, description="Max file size (10MB)")
    upload_folder: str = Field(default="uploads", description="Upload folder path")
    allowed_extensions: List[str] = Field(
        default=["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
        description="Allowed file extensions"
    )

    # Rate Limiting
    rate_limit_requests: int = Field(default=100, description="Rate limit requests per minute")
    rate_limit_per: int = Field(default=60, description="Rate limit time window (seconds)")

    # Monitoring
    enable_metrics: bool = Field(default=True, description="Enable metrics collection")
    metrics_port: int = Field(default=9090, description="Metrics server port")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Global settings instance
settings = get_settings()

# Environment helpers
def is_development() -> bool:
    """Check if running in development mode"""
    return settings.debug

def is_production() -> bool:
    """Check if running in production mode"""
    return not settings.debug

def get_database_url() -> str:
    """Get database URL with proper formatting"""
    return settings.database_url

def get_cors_settings() -> dict:
    """Get CORS configuration"""
    return {
        "allow_origins": settings.cors_origins,
        "allow_credentials": settings.cors_credentials,
        "allow_methods": settings.cors_methods,
        "allow_headers": settings.cors_headers,
    }
