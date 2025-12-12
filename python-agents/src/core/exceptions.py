"""
Custom exception hierarchy for the application.
"""

from typing import Any


class BaseAppError(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        """Convert exception to dictionary for API responses."""
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "details": self.details,
        }


class AgentError(BaseAppError):
    """Base exception for agent-related errors."""
    pass


class ScraperError(AgentError):
    """Error during web scraping operations."""
    pass


class MatcherError(AgentError):
    """Error during document matching operations."""
    pass


class ValidatorError(AgentError):
    """Error during document validation operations."""
    pass


class PDFGeneratorError(AgentError):
    """Error during PDF generation operations."""
    pass


class WorkflowError(BaseAppError):
    """Error in the orchestration workflow."""
    pass


class NodeBackendError(BaseAppError):
    """Error communicating with Node.js backend."""
    pass


class CacheError(BaseAppError):
    """Error with cache operations."""
    pass


class StorageError(BaseAppError):
    """Error with file storage operations."""
    pass


class LLMError(BaseAppError):
    """Error with LLM operations."""
    pass


class EmbeddingError(BaseAppError):
    """Error with embedding operations."""
    pass


class OCRError(BaseAppError):
    """Error with OCR operations."""
    pass
