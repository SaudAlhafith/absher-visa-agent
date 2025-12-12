"""
Base agent class providing common functionality for all agents.
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar
import logging

import structlog


InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")


class BaseAgent(ABC, Generic[InputT, OutputT]):
    """
    Abstract base class for all agents in the system.

    Provides:
    - Structured logging
    - Error handling patterns
    - Common utilities
    """

    def __init__(self, name: str | None = None):
        self.name = name or self.__class__.__name__
        self.logger = structlog.get_logger(self.name)
        self._python_logger = logging.getLogger(self.name)

    @abstractmethod
    async def execute(self, *args: Any, **kwargs: Any) -> OutputT:
        """
        Execute the agent's main task.
        Must be implemented by subclasses.
        """
        pass

    async def __call__(self, *args: Any, **kwargs: Any) -> OutputT:
        """Allow agents to be called directly."""
        return await self.execute(*args, **kwargs)

    def log_info(self, message: str, **kwargs: Any) -> None:
        """Log info message with context."""
        self.logger.info(message, agent=self.name, **kwargs)

    def log_error(self, message: str, **kwargs: Any) -> None:
        """Log error message with context."""
        self.logger.error(message, agent=self.name, **kwargs)

    def log_warning(self, message: str, **kwargs: Any) -> None:
        """Log warning message with context."""
        self.logger.warning(message, agent=self.name, **kwargs)

    def log_debug(self, message: str, **kwargs: Any) -> None:
        """Log debug message with context."""
        self.logger.debug(message, agent=self.name, **kwargs)
