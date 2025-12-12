"""
Dependency injection container for FastAPI.
Manages shared resources and agent instances.
"""

import logging
from typing import Optional

from src.config.settings import get_settings
from src.services.node_backend import NodeBackendClient
from src.services.cache.memory import MemoryCache
from src.agents.orchestrator.agent import OrchestratorAgent
from src.agents.scraper.agent import RequirementsScraperAgent
from src.agents.matcher.agent import DocumentMatcherAgent
from src.agents.validator.agent import ValidationAgent
from src.agents.pdf_generator.agent import PDFGeneratorAgent


logger = logging.getLogger(__name__)
settings = get_settings()

# Global instances (initialized on startup)
_node_client: Optional[NodeBackendClient] = None
_cache: Optional[MemoryCache] = None
_orchestrator: Optional[OrchestratorAgent] = None
_scraper_agent: Optional[RequirementsScraperAgent] = None
_matcher_agent: Optional[DocumentMatcherAgent] = None
_validator_agent: Optional[ValidationAgent] = None
_pdf_agent: Optional[PDFGeneratorAgent] = None


async def init_dependencies() -> None:
    """Initialize all dependencies on application startup."""
    global _node_client, _cache, _orchestrator
    global _scraper_agent, _matcher_agent, _validator_agent, _pdf_agent

    logger.info("Initializing dependencies...")

    # Initialize Node.js backend client
    _node_client = NodeBackendClient()

    # Initialize cache (using memory cache for simplicity, can swap to Redis)
    _cache = MemoryCache()

    # Initialize agents
    _scraper_agent = RequirementsScraperAgent(cache=_cache)
    _matcher_agent = DocumentMatcherAgent()
    _validator_agent = ValidationAgent()
    _pdf_agent = PDFGeneratorAgent()

    # Initialize orchestrator with all agents
    _orchestrator = OrchestratorAgent(
        scraper_agent=_scraper_agent,
        matcher_agent=_matcher_agent,
        validator_agent=_validator_agent,
        pdf_agent=_pdf_agent,
    )

    logger.info("Dependencies initialized successfully")


async def close_dependencies() -> None:
    """Clean up dependencies on application shutdown."""
    global _node_client

    logger.info("Closing dependencies...")

    if _node_client:
        await _node_client.close()

    logger.info("Dependencies closed successfully")


def get_node_client() -> NodeBackendClient:
    """Get Node.js backend client instance."""
    if _node_client is None:
        raise RuntimeError("Dependencies not initialized")
    return _node_client


def get_cache() -> MemoryCache:
    """Get cache instance."""
    if _cache is None:
        raise RuntimeError("Dependencies not initialized")
    return _cache


def get_orchestrator() -> OrchestratorAgent:
    """Get orchestrator agent instance."""
    if _orchestrator is None:
        raise RuntimeError("Dependencies not initialized")
    return _orchestrator


def get_scraper_agent() -> RequirementsScraperAgent:
    """Get scraper agent instance."""
    if _scraper_agent is None:
        raise RuntimeError("Dependencies not initialized")
    return _scraper_agent


def get_matcher_agent() -> DocumentMatcherAgent:
    """Get matcher agent instance."""
    if _matcher_agent is None:
        raise RuntimeError("Dependencies not initialized")
    return _matcher_agent


def get_validator_agent() -> ValidationAgent:
    """Get validator agent instance."""
    if _validator_agent is None:
        raise RuntimeError("Dependencies not initialized")
    return _validator_agent


def get_pdf_agent() -> PDFGeneratorAgent:
    """Get PDF generator agent instance."""
    if _pdf_agent is None:
        raise RuntimeError("Dependencies not initialized")
    return _pdf_agent
