"""
Health check endpoints for monitoring and readiness probes.
"""

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    version: str
    service: str


class ReadinessResponse(BaseModel):
    """Readiness check response model."""
    ready: bool
    checks: dict[str, bool]


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        service="absher-visa-agents",
    )


@router.get("/health/ready", response_model=ReadinessResponse)
async def readiness_check() -> ReadinessResponse:
    """
    Readiness probe - checks if all services are ready.
    Used by Kubernetes/container orchestration.
    """
    checks = {
        "api": True,
        # Add more checks as services are implemented
        # "database": await check_database(),
        # "cache": await check_cache(),
        # "llm": await check_llm(),
    }

    return ReadinessResponse(
        ready=all(checks.values()),
        checks=checks,
    )


@router.get("/health/live")
async def liveness_check() -> dict[str, str]:
    """
    Liveness probe - basic check that the service is running.
    Used by Kubernetes/container orchestration.
    """
    return {"status": "alive"}
