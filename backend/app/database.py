"""
Database setup e session management con SQLAlchemy
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy import create_engine, text, pool
from sqlalchemy.ext.asyncio import (
    AsyncSession, 
    async_sessionmaker, 
    create_async_engine,
    AsyncEngine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Base class per tutti i models
Base = declarative_base()

class DatabaseManager:
    """Database manager per connessioni async e sync"""

    def __init__(self):
        self.async_engine: Optional[AsyncEngine] = None
        self.async_session_factory: Optional[async_sessionmaker] = None
        self.sync_engine = None
        self.sync_session_factory = None

    async def initialize(self):
        """Inizializza connессioni database"""
        try:
            # Async Engine
            self.async_engine = create_async_engine(
                settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
                poolclass=QueuePool,
                pool_size=settings.database_pool_size,
                max_overflow=settings.database_max_overflow,
                pool_timeout=settings.database_pool_timeout,
                pool_pre_ping=True,
                echo=settings.debug,
                future=True
            )

            # Async Session Factory
            self.async_session_factory = async_sessionmaker(
                bind=self.async_engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False
            )

            # Sync Engine (per migrations e admin tasks)
            self.sync_engine = create_engine(
                settings.database_url,
                poolclass=QueuePool,
                pool_size=settings.database_pool_size,
                max_overflow=settings.database_max_overflow,
                pool_timeout=settings.database_pool_timeout,
                pool_pre_ping=True,
                echo=settings.debug
            )

            # Sync Session Factory
            self.sync_session_factory = sessionmaker(
                bind=self.sync_engine,
                autoflush=True,
                autocommit=False
            )

            logger.info("Database connections initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    async def create_tables(self):
        """Crea tutte le tabelle (solo per development)"""
        try:
            if not self.async_engine:
                await self.initialize()

            async with self.async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            logger.info("Database tables created successfully")

        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            raise

    async def health_check(self) -> bool:
        """Controlla health della connessione database"""
        try:
            if not self.async_engine:
                return False

            async with self.async_engine.begin() as conn:
                result = await conn.execute(text("SELECT 1"))
                row = result.fetchone()
                return row[0] == 1

        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

    async def close(self):
        """Chiude tutte le connessioni"""
        try:
            if self.async_engine:
                await self.async_engine.dispose()
                logger.info("Async database connections closed")

            if self.sync_engine:
                self.sync_engine.dispose()
                logger.info("Sync database connections closed")

        except Exception as e:
            logger.error(f"Error closing database connections: {e}")

# Global database manager instance
db_manager = DatabaseManager()

@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager per database sessions"""
    if not db_manager.async_session_factory:
        await db_manager.initialize()

    session = db_manager.async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        await session.close()

async def get_session() -> AsyncSession:
    """Dependency per FastAPI per ottenere database session"""
    if not db_manager.async_session_factory:
        await db_manager.initialize()

    session = db_manager.async_session_factory()
    try:
        yield session
    except Exception as e:
        await session.rollback()
        raise
    finally:
        await session.close()

def get_sync_session() -> Session:
    """Get sync session per tasks che richiedono sync operations"""
    if not db_manager.sync_session_factory:
        raise RuntimeError("Database not initialized")

    return db_manager.sync_session_factory()

# Database connection utilities
async def init_database():
    """Initialize database on startup"""
    try:
        await db_manager.initialize()

        # Test connection
        health = await db_manager.health_check()
        if not health:
            raise RuntimeError("Database health check failed")

        logger.info("Database initialized and healthy")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

async def close_database():
    """Close database on shutdown"""
    await db_manager.close()

# Transaction helpers
@asynccontextmanager
async def transaction():
    """Context manager per transactions"""
    async with get_async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Query helpers
async def execute_query(query: str, params: dict = None) -> list:
    """Execute raw SQL query"""
    async with get_async_session() as session:
        result = await session.execute(text(query), params or {})
        return result.fetchall()

async def execute_scalar(query: str, params: dict = None):
    """Execute scalar query"""
    async with get_async_session() as session:
        result = await session.execute(text(query), params or {})
        return result.scalar()

# Migration helpers (per Alembic integration)
def get_sync_engine():
    """Get sync engine per Alembic migrations"""
    return db_manager.sync_engine

def get_alembic_config():
    """Get Alembic configuration"""
    from alembic.config import Config
    from alembic import command

    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", settings.database_url)
    return config

async def run_migrations():
    """Run database migrations"""
    try:
        config = get_alembic_config()
        from alembic import command
        command.upgrade(config, "head")
        logger.info("Database migrations completed")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise
