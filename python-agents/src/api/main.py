"""
FastAPI application factory with dependency injection.
Main entry point for the Python AI agents API.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import health, visa_workflow, documents
from src.api.middleware import LoggingMiddleware, RequestIDMiddleware
from src.api.dependencies import init_dependencies, close_dependencies
from src.config.settings import get_settings
from src.config.logging_config import setup_logging


settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown."""
    # Startup
    setup_logging(settings.log_level)
    logger.info(f"Starting {settings.app_name} in {settings.app_env} mode")

    await init_dependencies()

    yield

    # Shutdown
    logger.info("Shutting down application")
    await close_dependencies()


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="AI-powered visa application assistant agents for Absher",
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
        openapi_url=f"{settings.api_prefix}/openapi.json",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom middleware
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(LoggingMiddleware)

    # Register routes
    app.include_router(
        health.router,
        prefix=settings.api_prefix,
        tags=["Health"],
    )
    app.include_router(
        visa_workflow.router,
        prefix=f"{settings.api_prefix}/workflow",
        tags=["Workflow"],
    )
    app.include_router(
        documents.router,
        prefix=f"{settings.api_prefix}/documents",
        tags=["Documents"],
    )

    return app


# Application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
