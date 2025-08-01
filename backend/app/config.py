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
    app_name: str = Field(default="LearnAI Platform", description="Nome dell'applicazione")
    version: str = Field(default="1.0.0", description="Versione dell'applicazione")
    api_v1_prefix: str = Field(default="/api/v1", description="Prefisso API v1")
    environment: Environment = Field(default=Environment.PRODUCTION, description="Ambiente di esecuzione")
    debug: bool = Field(default=False, description="Modalità debug")

    # =============================================================================
    # SERVER SETTINGS
    # =============================================================================
    host: str = Field(default="0.0.0.0", description="Host del server")
    port: int = Field(default=8000, description="Porta del server")
    workers: int = Field(default=4, description="Numero di worker")
    reload: bool = Field(default=False, description="Auto-reload del server")

    # =============================================================================
    # SECURITY SETTINGS
    # =============================================================================
    jwt_secret_key: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Chiave segreta per JWT"
    )
    jwt_algorithm: str = Field(default="HS256", description="Algoritmo JWT")
    access_token_expire_minutes: int = Field(default=30, description="Scadenza access token (minuti)")
    refresh_token_expire_days: int = Field(default=7, description="Scadenza refresh token (giorni)")
    password_min_length: int = Field(default=8, description="Lunghezza minima password")
    
    # =============================================================================
    # DATABASE SETTINGS
    # =============================================================================
    database_url: str = Field(..., description="URL del database PostgreSQL")
    database_pool_size: int = Field(default=20, description="Dimensione pool connessioni")
    database_max_overflow: int = Field(default=30, description="Max overflow pool")
    database_pool_timeout: int = Field(default=30, description="Timeout pool (secondi)")
    database_echo: bool = Field(default=False, description="Log delle query SQL")

    # =============================================================================
    # REDIS SETTINGS
    # =============================================================================
    redis_url: str = Field(default="redis://localhost:6379/0", description="URL Redis")
    redis_max_connections: int = Field(default=20, description="Max connessioni Redis")
    redis_timeout: int = Field(default=5, description="Timeout Redis (secondi)")
    cache_ttl_seconds: int = Field(default=3600, description="TTL cache (secondi)")

    # =============================================================================
    # AI/LLM SETTINGS
    # =============================================================================
    openai_api_key: str = Field(..., description="Chiave API OpenAI")
    anthropic_api_key: str = Field(..., description="Chiave API Anthropic")
    
    # Model configurations
    openai_model: str = Field(default="gpt-4", description="Modello OpenAI predefinito")
    anthropic_model: str = Field(default="claude-3-sonnet-20240229", description="Modello Anthropic predefinito")
    openai_embedding_model: str = Field(default="text-embedding-ada-002", description="Modello embedding OpenAI")
    
    # API limits
    llm_max_tokens: int = Field(default=4000, description="Massimo numero di token per richiesta")
    llm_temperature: float = Field(default=0.7, description="Temperatura per generazione")
    llm_timeout: int = Field(default=60, description="Timeout chiamate LLM (secondi)")

    # =============================================================================
    # VECTOR DATABASE SETTINGS (Pinecone)
    # =============================================================================
    pinecone_api_key: Optional[str] = Field(default=None, description="Chiave API Pinecone")
    pinecone_environment: Optional[str] = Field(default=None, description="Environment Pinecone")
    pinecone_index_name: str = Field(default="learnai-vectors", description="Nome indice Pinecone")
    vector_search_top_k: int = Field(default=10, description="Top K per ricerca vettoriale")
    vector_rerank_enabled: bool = Field(default=True, description="Abilita re-ranking dei risultati")

    # =============================================================================
    # GAMIFICATION SETTINGS
    # =============================================================================
    xp_base_lesson: int = Field(default=10, description="XP base per lezione completata")
    xp_base_quiz: int = Field(default=15, description="XP base per quiz completato")
    xp_multiplier_streak: float = Field(default=1.2, description="Moltiplicatore XP per streak")
    xp_multiplier_perfect_score: float = Field(default=1.5, description="Moltiplicatore XP per punteggio perfetto")
    
    # Achievement thresholds
    streak_achievement_days: List[int] = Field(default=[3, 7, 14, 30], description="Soglie achievement streak")
    xp_achievement_levels: List[int] = Field(default=[100, 500, 1000, 5000], description="Soglie achievement XP")

    # =============================================================================
    # RATE LIMITING
    # =============================================================================
    rate_limit_requests: int = Field(default=100, description="Richieste per finestra temporale")
    rate_limit_period: int = Field(default=60, description="Finestra temporale (secondi)")
    rate_limit_burst: int = Field(default=20, description="Burst rate limit")

    # =============================================================================
    # CORS SETTINGS
    # =============================================================================
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://127.0.0.1:3000"
        ],
        description="Origini CORS consentite"
    )
    cors_credentials: bool = Field(default=True, description="Consenti credenziali CORS")
    cors_methods: List[str] = Field(default=["GET", "POST", "PUT", "DELETE", "OPTIONS"], description="Metodi CORS")
    cors_headers: List[str] = Field(default=["*"], description="Header CORS")

    # =============================================================================
    # FILE UPLOAD SETTINGS
    # =============================================================================
    max_file_size: int = Field(default=10 * 1024 * 1024, description="Dimensione max file (bytes)")
    upload_folder: str = Field(default="uploads", description="Cartella upload")
    allowed_file_types: List[str] = Field(
        default=["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt", "mp3", "mp4"],
        description="Tipi di file consentiti"
    )

    # =============================================================================
    # LOGGING SETTINGS
    # =============================================================================
    log_level: str = Field(default="INFO", description="Livello di logging")
    log_format: str = Field(default="json", description="Formato log (json/text)")
    log_file: Optional[str] = Field(default=None, description="File di log")
    log_rotation: str = Field(default="1 day", description="Rotazione log")
    log_retention: str = Field(default="30 days", description="Ritenzione log")

    # =============================================================================
    # EMAIL SETTINGS
    # =============================================================================
    smtp_server: Optional[str] = Field(default=None, description="Server SMTP")
    smtp_port: int = Field(default=587, description="Porta SMTP")
    smtp_username: Optional[str] = Field(default=None, description="Username SMTP")
    smtp_password: Optional[str] = Field(default=None, description="Password SMTP")
    smtp_use_tls: bool = Field(default=True, description="Usa TLS per SMTP")
    email_from: Optional[str] = Field(default=None, description="Email mittente")

    # =============================================================================
    # MONITORING & METRICS
    # =============================================================================
    enable_metrics: bool = Field(default=True, description="Abilita metriche")
    metrics_port: int = Field(default=9090, description="Porta server metriche")
    health_check_interval: int = Field(default=30, description="Intervallo health check (secondi)")

    # =============================================================================
    # FEATURE FLAGS
    # =============================================================================
    enable_user_registration: bool = Field(default=True, description="Abilita registrazione utenti")
    enable_social_login: bool = Field(default=False, description="Abilita login social")
    enable_email_verification: bool = Field(default=True, description="Abilita verifica email")
    enable_password_reset: bool = Field(default=True, description="Abilita reset password")
    maintenance_mode: bool = Field(default=False, description="Modalità manutenzione")

    # =============================================================================
    # VALIDATORS
    # =============================================================================
    @validator('environment')
    def validate_environment(cls, v):
        if isinstance(v, str):
            return Environment(v.lower())
        return v

    @validator('cors_origins')
    def validate_cors_origins(cls, v):
        # Rimuovi trailing slashes
        return [origin.rstrip('/') for origin in v]

    @validator('log_level')
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
        case_sensitive = False
        # Consenti campi extra per flessibilità futura
        extra = "ignore"

    # =============================================================================
    # COMPUTED PROPERTIES
    # =============================================================================
    @property
    def is_development(self) -> bool:
        """Verifica se siamo in ambiente di sviluppo"""
        return self.environment == Environment.DEVELOPMENT

    @property
    def is_production(self) -> bool:
        """Verifica se siamo in ambiente di produzione"""
        return self.environment == Environment.PRODUCTION

    @property
    def is_debug_enabled(self) -> bool:
        """Verifica se il debug è abilitato"""
        return self.debug or self.is_development

    @property
    def cors_config(self) -> Dict[str, Any]:
        """Configurazione CORS per FastAPI"""
        return {
            "allow_origins": self.cors_origins,
            "allow_credentials": self.cors_credentials,
            "allow_methods": self.cors_methods,
            "allow_headers": self.cors_headers,
        }

    @property
    def database_config(self) -> Dict[str, Any]:
        """Configurazione database"""
        return {
            "url": self.database_url,
            "pool_size": self.database_pool_size,
            "max_overflow": self.database_max_overflow,
            "pool_timeout": self.database_pool_timeout,
            "echo": self.database_echo,
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
    return settings.database_url

def get_redis_url() -> str:
    """Ottieni URL Redis formattato"""
    return settings.redis_url

def is_feature_enabled(feature_name: str) -> bool:
    """Verifica se una feature è abilitata"""
    return getattr(settings, f"enable_{feature_name}", False)

def get_upload_path(filename: str) -> str:
    """Ottieni path completo per upload"""
    os.makedirs(settings.upload_folder, exist_ok=True)
    return os.path.join(settings.upload_folder, filename)

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
                "formatter": settings.log_format,
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": settings.log_level,
            "handlers": ["default"],
        },
    }
    
    # Aggiungi file handler se specificato
    if settings.log_file:
        config["handlers"]["file"] = {
            "formatter": settings.log_format,
            "class": "logging.handlers.RotatingFileHandler",
            "filename": settings.log_file,
            "maxBytes": 10 * 1024 * 1024,  # 10MB
            "backupCount": 5,
        }
        config["root"]["handlers"].append("file")
    
    return config

# =============================================================================
# ENVIRONMENT SPECIFIC OVERRIDES
# =============================================================================
def apply_environment_overrides():
    """Applica override specifici per ambiente"""
    if settings.is_development:
        # Override per sviluppo
        settings.database_echo = True
        settings.cors_origins.extend([
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000"
        ])
        settings.log_level = "DEBUG"
        
    elif settings.is_production:
        # Override per produzione
        settings.debug = False
        settings.database_echo = False
        # Limita CORS origins in produzione
        settings.cors_origins = [
            origin for origin in settings.cors_origins 
            if not origin.startswith("http://localhost")
        ]

# Applica override all'avvio
apply_environment_overrides()
