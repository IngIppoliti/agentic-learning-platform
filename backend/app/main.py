from fastapi import FastAPI, Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.core.logging import configure_logging, RequestLoggingMiddleware
from app.core.database import engine, Base
from app.api.v1 import auth, users, agents,dashboard, learning, community
from app.agents.orchestrator import MasterOrchestrator
from app.agents.profiling_agent import ProfilingAgent
from app.agents.learning_path_agent import LearningPathAgent
from app.services.llm_service import LLMService
from app.core.database import get_redis
import redis

# Configure logging
configure_logging()
logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestione lifecycle dell'applicazione"""
    logger.info("application_startup", version=settings.VERSION)
    
    # Crea tabelle database
    Base.metadata.create_all(bind=engine)
    
    # Inizializza servizi
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    llm_service = LLMService()
    
    # Inizializza orchestrator e agenti
    orchestrator = MasterOrchestrator(redis_client)
    
    # Registra agenti (in production useremmo dependency injection)
    from app.core.database import SessionLocal
    db_session = SessionLocal()
    
    profiling_agent = ProfilingAgent(llm_service, db_session)
    learning_path_agent = LearningPathAgent(llm_service, db_session)
    
    orchestrator.register_agent(profiling_agent)
    orchestrator.register_agent(learning_path_agent)
    
    # Rendi servizi disponibili globalmente
    app.state.orchestrator = orchestrator
    app.state.llm_service = llm_service
    app.state.redis_client = redis_client
    
    logger.info("application_ready")
    
    yield
    
    # Cleanup
    logger.info("application_shutdown")
    db_session.close()

# Crea app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Agentic Learning AI Platform - Sistema di apprendimento personalizzato multi-agent",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
)

app.add_middleware(RequestLoggingMiddleware)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(agents.router, prefix=f"{settings.API_V1_PREFIX}/agents", tags=["agents"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["dashboard"])
app.include_router(learning.router, prefix=f"{settings.API_V1_PREFIX}/learning", tags=["learning"])
app.include_router(community.router, prefix=f"{settings.API_V1_PREFIX}/community", tags=["community"])

@app.get("/")
async def root():
    """Root endpoint con informazioni sistema"""
    return {
        "message": "Agentic Learning AI Platform",
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs" if settings.DEBUG else "Documentation not available in production"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database
        from app.core.database import get_db
        db = next(get_db())
        db.execute("SELECT 1")
        db.close()
        
        # Test Redis
        redis_client = app.state.redis_client
        redis_client.ping()
        
        # Test orchestrator
        orchestrator_status = await app.state.orchestrator.get_system_status()
        
        return {
            "status": "healthy",
            "timestamp": "2024-01-15T10:00:00Z",
            "services": {
                "database": "healthy",
                "redis": "healthy",
                "orchestrator": "healthy",
                "agents": len(orchestrator_status["agents"])
            }
        }
    except Exception as e:
        logger.error("health_check_failed", error=str(e))
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(
        "unhandled_exception",
        error=str(exc),
        error_type=type(exc).__name__,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "Si è verificato un errore interno. Il team è stato notificato."
        }
    )
