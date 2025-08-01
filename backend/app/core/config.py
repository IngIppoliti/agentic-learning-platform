"""
Configurazione unificata per LearnAI Platform
Combina funzionalità avanzate con sicurezza e semplicità
"""
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional, List, Dict, Any
import secrets
import os
from functools import lru_cache
from enum import Enum

class Environment(str, Enum):
    """Environment types"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class Settings(BaseSettings):
    """Configurazione unificata dell'applicazione"""

    # =============================================================================
    # APPLICATION SETTINGS
    # =============================================================================
    APP_NAME: str = Field(default="LearnAI Platform", description="Nome dell'applicazione")
    VERSION: str = Field(default="1.0.0", description="Versione dell'applicazione")
    API_V1_PREFIX: str = Field(default="/api/v1", description="Prefisso API v1")
    ENVIRONMENT: Environment = Field(default=Environment.PRODUCTION, description="Ambiente di esecuzione")
    DEBUG: bool = Field(default=False, description="Modalità debug")

    # =============================================================================
    # SERVER SETTINGS
    # =============================================================================
    HOST: str = Field(default="0.0.0.0", description="Host del server")
    PORT: int = Field(default=8000, description="Porta del server")
    WORKERS: int = Field(default=4, description="Numero di worker")
    RELOAD: bool = Field(default=False, description="Auto-reload del server")

    # =============================================================================
    # SECURITY SETTINGS
    # =============================================================================
    JWT_SECRET_KEY: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Chiave segreta per JWT"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="Algoritmo JWT")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Scadenza access token (minuti)")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Scadenza refresh token (giorni)")
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="Lunghezza minima password")
    
    # =============================================================================
    # DATABASE SETTINGS
    # =============================================================================
    DATABASE_URL: str = Field(..., description="URL del database PostgreSQL")
    DATABASE_POOL_SIZE: int = Field(default=20, description="Dimensione pool connessioni")
    DATABASE_MAX_OVERFLOW: int = Field(default=30, description="Max overflow pool")
    DATABASE_POOL_TIMEOUT: int = Field(default=30, description="Timeout pool (secondi)")
    DATABASE_ECHO: bool = Field(default=False, description="Log delle query SQL")

    # =============================================================================
    # REDIS SETTINGS
    # =============================================================================
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="URL Redis")
    REDIS_MAX_CONNECTIONS: int = Field(default=20, description="Max connessioni Redis")
    REDIS_TIMEOUT: int = Field(default=5, description="Timeout Redis (secondi)")
    CACHE_TTL_SECONDS: int = Field(default=3600, description="TTL cache (secondi)")

    # =============================================================================
    # AI/LLM SETTINGS
    # =============================================================================
    OPENAI_API_KEY: str = Field(..., description="Chiave API OpenAI")
    ANTHROPIC_API_KEY: str = Field(..., description="Chiave API Anthropic")
    
    # Model configurations
    OPENAI_MODEL: str = Field(default="gpt-4", description="Modello OpenAI predefinito")
    ANTHROPIC_MODEL: str = Field(default="claude-3-sonnet-20240229", description="Modello Anthropic predefinito")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-ada-002", description="Modello embedding OpenAI")
    
    # API limits
    LLM_MAX_TOKENS: int = Field(default=4000, description="Massimo numero di token per richiesta")
    LLM_TEMPERATURE: float = Field(default=0.7, description="Temperatura per generazione")
    LLM_TIMEOUT: int = Field(default=60, description="Timeout chiamate LLM (secondi)")

    # =============================================================================
    # VECTOR DATABASE SETTINGS (Pinecone)
    # =============================================================================
    PINECONE_API_KEY: Optional[str] = Field(default=None, description="Chiave API Pinecone")
    PINECONE_ENVIRONMENT: Optional[str] = Field(default=None, description="Environment Pinecone")
    PINECONE_INDEX_NAME: str = Field(default="learnai-vectors", description="Nome indice Pinecone")
    VECTOR_SEARCH_TOP_K: int = Field(default=10, description="Top K per ricerca vettoriale")
    VECTOR_RERANK_ENABLED: bool = Field(default=True, description="Abilita re-ranking dei risultati")

    # =============================================================================
    # GAMIFICATION SETTINGS
    # =============================================================================
    XP_BASE_LESSON: int = Field(default=10, description="XP base per lezione completata")
    XP_BASE_QUIZ: int = Field(default=15, description="XP base per quiz completato")
    XP_MULTIPLIER_STREAK: float = Field(default=1.2, description="Moltiplicatore XP per streak")
    XP_MULTIPLIER_PERFECT_SCORE: float = Field(default=1.5, description="Moltiplicatore XP per punteggio perfetto")
    
    # Achievement thresholds
    STREAK_ACHIEVEMENT_DAYS: List[int] = Field(default=[3, 7, 14, 30], description="Soglie achievement streak")
    XP_ACHIEVEMENT_LEVELS: List[int] = Field(default=[100, 500, 1000, 5000], description="Soglie achievement XP")

    # =============================================================================
    # RATE LIMITING
    # =============================================================================
    RATE_LIMIT_REQUESTS: int = Field(default=100, description="Richieste per finestra temporale")
    RATE_LIMIT_PERIOD: int = Field(default=60, description="Finestra temporale (secondi)")
    RATE_LIMIT_BURST: int = Field(default=20, description="Burst rate limit")

    # =============================================================================
    # CORS SETTINGS
    # =============================================================================
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://127.0.0.1:3000"
        ],
        description="Origini CORS consentite"
    )
    CORS_CREDENTIALS: bool = Field(default=True, description="Consenti credenziali CORS")
    CORS_METHODS: List[str] = Field(default=["GET", "POST", "PUT", "DELETE", "OPTIONS"], description="Metodi CORS")
    CORS_HEADERS: List[str] = Field(default=["*"], description="Header CORS")

    # =============================================================================
    # FILE UPLOAD SETTINGS
    # =============================================================================
    MAX_FILE_SIZE: int = Field(default=10 * 1024 * 1024, description="Dimensione max file (bytes)")
    UPLOAD_FOLDER: str = Field(default="uploads", description="Cartella upload")
    ALLOWED_FILE_TYPES: List[str] = Field(
        default=["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt", "mp3", "mp4"],
        description="Tipi di file consentiti"
    )

    # =============================================================================
    # LOGGING SETTINGS
    # =============================================================================
    LOG_LEVEL: str = Field(default="INFO", description="Livello di logging")
    LOG_FORMAT: str = Field(default="json", description="Formato log (json/text)")
    LOG_FILE: Optional[str] = Field(default=None, description="File di log")
    LOG_ROTATION: str = Field(default="1 day", description="Rotazione log")
    LOG_RETENTION: str = Field(default="30 days", description="Ritenzione log")

    # =============================================================================
    # EMAIL SETTINGS
    # =============================================================================
    SMTP_SERVER: Optional[str] = Field(default=None, description="Server SMTP")
    SMTP_PORT: int = Field(default=587, description="Porta SMTP")
    SMTP_USERNAME: Optional[str] = Field(default=None, description="Username SMTP")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="Password SMTP")
    SMTP_USE_TLS: bool = Field(default=True, description="Usa TLS per SMTP")
    EMAIL_FROM: Optional[str] = Field(default=None, description="Email mittente")

    # =============================================================================
    # MONITORING & METRICS
    # =============================================================================
    ENABLE_METRICS: bool = Field(default=True, description="Abilita metriche")
    METRICS_PORT: int = Field(default=9090, description="Porta server metriche")
    HEALTH_CHECK_INTERVAL: int = Field(default=30, description="Intervallo health check (secondi)")

    # =============================================================================
    # FEATURE FLAGS
    # =============================================================================
    ENABLE_USER_REGISTRATION: bool = Field(default=True, description="Abilita registrazione utenti")
    ENABLE_SOCIAL_LOGIN: bool = Field(default=False, description="Abilita login social")
    ENABLE_EMAIL_VERIFICATION: bool = Field(default=True, description="Abilita verifica email")
    ENABLE_PASSWORD_RESET: bool = Field(default=True, description="Abilita reset password")
    MAINTENANCE_MODE: bool = Field(default=False, description="Modalità manutenzione")

    # =============================================================================
    # VALIDATORS
    # =============================================================================
    @validator('ENVIRONMENT')
    def validate_environment(cls, v):
        if isinstance(v, str):
            return Environment(v.lower())
        return v

    @validator('CORS_ORIGINS')
    def validate_cors_origins(cls, v):
        # Rimuovi trailing slashes
        return [origin.rstrip('/') for origin in v]

    @validator('LOG_LEVEL')
    def validate_log_level(cls, v):
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'Log level must be one of: {valid_levels}')
        return v.upper()

    # =============================================================================
    # CONFIGURATION
    # =============================================================================
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True  # Cambiato a True per mantenere le maiuscole
        # Consenti campi extra per flessibilità futura
        extra = "ignore"

    # =============================================================================
    # COMPUTED PROPERTIES
    # =============================================================================
    @property
    def is_development(self) -> bool:
        """Verifica se siamo in ambiente di sviluppo"""
        return self.ENVIRONMENT == Environment.DEVELOPMENT

    @property
    def is_production(self) -> bool:
        """Verifica se siamo in ambiente di produzione"""
        return self.ENVIRONMENT == Environment.PRODUCTION

    @property
    def is_debug_enabled(self) -> bool:
        """Verifica se il debug è abilitato"""
        return self.DEBUG or self.is_development

    @property
    def cors_config(self) -> Dict[str, Any]:
        """Configurazione CORS per FastAPI"""
        return {
            "allow_origins": self.CORS_ORIGINS,
            "allow_credentials": self.CORS_CREDENTIALS,
            "allow_methods": self.CORS_METHODS,
            "allow_headers": self.CORS_HEADERS,
        }

    @property
    def database_config(self) -> Dict[str, Any]:
        """Configurazione database"""
        return {
            "url": self.DATABASE_URL,
            "pool_size": self.DATABASE_POOL_SIZE,
            "max_overflow": self.DATABASE_MAX_OVERFLOW,
            "pool_timeout": self.DATABASE_POOL_TIMEOUT,
            "echo": self.DATABASE_ECHO,
        }

    @property
    def redis_config(self) -> Dict[str, Any]:
        """Configurazione Redis"""
        return {
            "url": self.REDIS_URL,
            "max_connections": self.REDIS_MAX_CONNECTIONS,
            "socket_timeout": self.REDIS_TIMEOUT,
            "socket_connect_timeout": self.REDIS_TIMEOUT,
        }

    @property
    def llm_config(self) -> Dict[str, Any]:
        """Configurazione LLM"""
        return {
            "openai": {
                "api_key": self.OPENAI_API_KEY,
                "model": self.OPENAI_MODEL,
                "embedding_model": self.OPENAI_EMBEDDING_MODEL,
            },
            "anthropic": {
                "api_key": self.ANTHROPIC_API_KEY,
                "model": self.ANTHROPIC_MODEL,
            },
            "defaults": {
                "max_tokens": self.LLM_MAX_TOKENS,
                "temperature": self.LLM_TEMPERATURE,
                "timeout": self.LLM_TIMEOUT,
            }
        }

    @property
    def email_config(self) -> Dict[str, Any]:
        """Configurazione email"""
        return {
            "smtp_server": self.SMTP_SERVER,
            "smtp_port": self.SMTP_PORT,
            "smtp_username": self.SMTP_USERNAME,
            "smtp_password": self.SMTP_PASSWORD,
            "use_tls": self.SMTP_USE_TLS,
            "from_email": self.EMAIL_FROM,
        }

# =============================================================================
# SETTINGS INSTANCE
# =============================================================================
@lru_cache()
def get_settings() -> Settings:
    """Ottieni istanza cached delle impostazioni"""
    return Settings()

# Istanza globale delle impostazioni
settings = get_settings()

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================
def get_database_url() -> str:
    """Ottieni URL database formattato"""
    return settings.DATABASE_URL

def get_redis_url() -> str:
    """Ottieni URL Redis formattato"""
    return settings.REDIS_URL

def is_feature_enabled(feature_name: str) -> bool:
    """Verifica se una feature è abilitata"""
    return getattr(settings, f"ENABLE_{feature_name.upper()}", False)

def get_upload_path(filename: str) -> str:
    """Ottieni path completo per upload"""
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    return os.path.join(settings.UPLOAD_FOLDER, filename)

def get_log_config() -> Dict[str, Any]:
    """Configurazione logging"""
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            },
            "json": {
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
                "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
            },
        },
        "handlers": {
            "default": {
                "formatter": settings.LOG_FORMAT,
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": settings.LOG_LEVEL,
            "handlers": ["default"],
        },
    }
    
    # Aggiungi file handler se specificato
    if settings.LOG_FILE:
        config["handlers"]["file"] = {
            "formatter": settings.LOG_FORMAT,
            "class": "logging.handlers.RotatingFileHandler",
            "filename": settings.LOG_FILE,
            "maxBytes": 10 * 1024 * 1024,  # 10MB
            "backupCount": 5,
        }
        config["root"]["handlers"].append("file")
    
    return config

def get_server_config() -> Dict[str, Any]:
    """Configurazione server"""
    return {
        "host": settings.HOST,
        "port": settings.PORT,
        "workers": settings.WORKERS,
        "reload": settings.RELOAD and settings.is_development,
        "debug": settings.is_debug_enabled,
    }

def get_security_config() -> Dict[str, Any]:
    """Configurazione sicurezza"""
    return {
        "jwt_secret_key": settings.JWT_SECRET_KEY,
        "jwt_algorithm": settings.JWT_ALGORITHM,
        "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "refresh_token_expire_days": settings.REFRESH_TOKEN_EXPIRE_DAYS,
        "password_min_length": settings.PASSWORD_MIN_LENGTH,
    }

def get_rate_limit_config() -> Dict[str, Any]:
    """Configurazione rate limiting"""
    return {
        "requests": settings.RATE_LIMIT_REQUESTS,
        "period": settings.RATE_LIMIT_PERIOD,
        "burst": settings.RATE_LIMIT_BURST,
    }

def get_gamification_config() -> Dict[str, Any]:
    """Configurazione gamification"""
    return {
        "xp_base": {
            "lesson": settings.XP_BASE_LESSON,
            "quiz": settings.XP_BASE_QUIZ,
        },
        "multipliers": {
            "streak": settings.XP_MULTIPLIER_STREAK,
            "perfect_score": settings.XP_MULTIPLIER_PERFECT_SCORE,
        },
        "achievements": {
            "streak_days": settings.STREAK_ACHIEVEMENT_DAYS,
            "xp_levels": settings.XP_ACHIEVEMENT_LEVELS,
        }
    }

def get_upload_config() -> Dict[str, Any]:
    """Configurazione upload"""
    return {
        "max_file_size": settings.MAX_FILE_SIZE,
        "upload_folder": settings.UPLOAD_FOLDER,
        "allowed_types": settings.ALLOWED_FILE_TYPES,
    }

# =============================================================================
# ENVIRONMENT SPECIFIC OVERRIDES
# =============================================================================
def apply_environment_overrides():
    """Applica override specifici per ambiente"""
    if settings.is_development:
        # Override per sviluppo
        settings.DATABASE_ECHO = True
        settings.CORS_ORIGINS.extend([
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000"
        ])
        settings.LOG_LEVEL = "DEBUG"
        settings.RELOAD = True
        
    elif settings.is_production:
        # Override per produzione
        settings.DEBUG = False
        settings.DATABASE_ECHO = False
        settings.RELOAD = False
        # Limita CORS origins in produzione
        settings.CORS_ORIGINS = [
            origin for origin in settings.CORS_ORIGINS 
            if not origin.startswith("http://localhost")
        ]

# Applica override all'avvio
apply_environment_overrides()

# =============================================================================
# VALIDATION HELPERS
# =============================================================================
def validate_required_settings():
    """Valida che tutte le impostazioni richieste siano presenti"""
    required_settings = [
        "DATABASE_URL",
        "OPENAI_API_KEY", 
        "ANTHROPIC_API_KEY",
    ]
    
    missing_settings = []
    for setting in required_settings:
        if not getattr(settings, setting, None):
            missing_settings.append(setting)
    
    if missing_settings:
        raise ValueError(f"Missing required settings: {', '.join(missing_settings)}")

def print_current_config():
    """Stampa la configurazione corrente (senza dati sensibili)"""
    config_info = {
        "App Name": settings.APP_NAME,
        "Version": settings.VERSION,
        "Environment": settings.ENVIRONMENT.value,
        "Debug": settings.DEBUG,
        "Host": settings.HOST,
        "Port": settings.PORT,
        "Database Pool Size": settings.DATABASE_POOL_SIZE,
        "Redis URL": settings.REDIS_URL.split('@')[-1] if '@' in settings.REDIS_URL else settings.REDIS_URL,
        "Log Level": settings.LOG_LEVEL,
        "CORS Origins": settings.CORS_ORIGINS,
        "Features Enabled": {
            "User Registration": settings.ENABLE_USER_REGISTRATION,
            "Email Verification": settings.ENABLE_EMAIL_VERIFICATION,
            "Social Login": settings.ENABLE_SOCIAL_LOGIN,
            "Metrics": settings.ENABLE_METRICS,
        }
    }
    
    print("=== CONFIGURAZIONE CORRENTE ===")
    for key, value in config_info.items():
        print(f"{key}: {value}")
    print("=" * 35)

# Valida le impostazioni all'avvio se non in modalità test
if not os.getenv("TESTING"):
    try:
        validate_required_settings()
        if settings.is_development:
            print_current_config()
    except ValueError as e:
        print(f"ERRORE CONFIGURAZIONE: {e}")
        print("Assicurati che tutte le variabili d'ambiente richieste siano impostate nel file .env")
