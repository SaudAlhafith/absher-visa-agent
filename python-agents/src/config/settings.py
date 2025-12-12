"""
Application settings using Pydantic Settings for type-safe configuration.
Loads from environment variables with .env file support.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn, AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Main application settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Absher Visa AI Agents"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5000"]

    # Node.js Backend Integration
    node_backend_url: AnyHttpUrl = Field(default="http://localhost:5000")
    node_backend_timeout: int = 30

    # Database
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/absher_visa"
    )
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Redis Cache
    redis_url: RedisDsn = Field(default="redis://localhost:6379/0")
    cache_ttl_seconds: int = 86400  # 24 hours
    scrape_cache_ttl_days: int = 7

    # LLM Configuration
    llm_provider: Literal["ollama", "openai", "anthropic"] = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-haiku-20240307"
    llm_temperature: float = 0.1
    llm_max_tokens: int = 4096

    # Embeddings
    embedding_provider: Literal["bge-m3", "openai"] = "bge-m3"
    embedding_model: str = "BAAI/bge-m3"
    embedding_dimension: int = 1024

    # OCR
    ocr_lang: str = "ar,en"
    ocr_use_gpu: bool = False

    # Storage
    storage_provider: Literal["s3", "local"] = "local"
    storage_local_path: str = "./uploads"
    s3_bucket: str = ""
    s3_endpoint: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""

    # Scraping
    scraper_user_agent: str = "AbsherVisaBot/1.0"
    scraper_timeout: int = 30
    scraper_max_retries: int = 3


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
