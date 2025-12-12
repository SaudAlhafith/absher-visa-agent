"""
In-memory cache implementation.
Simple cache for development, can be swapped with Redis in production.
"""

import time
from typing import Any, Optional
from dataclasses import dataclass


@dataclass
class CacheEntry:
    """Cache entry with expiration."""
    value: Any
    expires_at: float


class MemoryCache:
    """
    Simple in-memory cache with TTL support.
    For production, use Redis instead.
    """

    def __init__(self):
        self._cache: dict[str, CacheEntry] = {}

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        entry = self._cache.get(key)
        if entry is None:
            return None

        if time.time() > entry.expires_at:
            # Expired, remove and return None
            del self._cache[key]
            return None

        return entry.value

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 3600,
    ) -> None:
        """Set value in cache with TTL (in seconds)."""
        expires_at = time.time() + ttl
        self._cache[key] = CacheEntry(value=value, expires_at=expires_at)

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    async def exists(self, key: str) -> bool:
        """Check if key exists and is not expired."""
        return await self.get(key) is not None

    async def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()

    async def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        now = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now > entry.expires_at
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)

    def size(self) -> int:
        """Get number of entries in cache."""
        return len(self._cache)
