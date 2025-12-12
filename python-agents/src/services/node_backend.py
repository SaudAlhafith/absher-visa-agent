"""
HTTP client for communicating with the Node.js Express backend.
Provides typed access to existing API endpoints.
"""

import logging
from typing import Optional, Any

import httpx

from src.config.settings import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()


class NodeBackendClient:
    """HTTP client for Node.js backend integration."""

    def __init__(self):
        self.base_url = str(settings.node_backend_url)
        self.timeout = settings.node_backend_timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"Content-Type": "application/json"},
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> Optional[dict]:
        """Make an HTTP request to the Node.js backend."""
        client = await self._get_client()
        try:
            response = await client.request(method, path, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code} for {path}: {e}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error for {path}: {e}")
            return None

    # Countries
    async def get_countries(self) -> list[dict]:
        """Fetch all countries."""
        result = await self._request("GET", "/api/countries")
        return result if isinstance(result, list) else []

    async def get_country(self, country_id: str) -> Optional[dict]:
        """Fetch country details by ID."""
        return await self._request("GET", f"/api/countries/{country_id}")

    async def get_country_fields(self, country_id: str) -> Optional[dict]:
        """Fetch country-specific dynamic fields."""
        return await self._request("GET", f"/api/countries/{country_id}/fields")

    async def get_country_instructions(self, country_id: str) -> Optional[dict]:
        """Fetch country-specific embassy instructions."""
        return await self._request("GET", f"/api/countries/{country_id}/instructions")

    # Travelers
    async def get_travelers(self, traveler_ids: Optional[list[str]] = None) -> list[dict]:
        """Fetch travelers, optionally filtered by IDs."""
        result = await self._request("GET", "/api/travelers")
        if not isinstance(result, list):
            return []
        if traveler_ids:
            return [t for t in result if t.get("id") in traveler_ids]
        return result

    async def get_traveler_docs(self, traveler_ids: list[str]) -> list[dict]:
        """Fetch document status for travelers."""
        ids_param = ",".join(traveler_ids)
        result = await self._request("GET", f"/api/traveler-docs/{ids_param}")
        return result if isinstance(result, list) else []

    # Visa Requests
    async def get_visa_requests(self) -> list[dict]:
        """Fetch all visa requests."""
        result = await self._request("GET", "/api/requests")
        return result if isinstance(result, list) else []

    async def get_visa_request(self, request_id: str) -> Optional[dict]:
        """Fetch visa request by ID."""
        return await self._request("GET", f"/api/requests/{request_id}")

    async def create_visa_request(self, data: dict) -> Optional[dict]:
        """Create a new visa request."""
        return await self._request("POST", "/api/requests", json=data)

    async def update_visa_request(
        self,
        request_id: str,
        update: dict,
    ) -> Optional[dict]:
        """Update visa request status."""
        return await self._request("PATCH", f"/api/requests/{request_id}", json=update)

    # Requirements
    async def get_requirements(self, country_id: str) -> list[dict]:
        """Fetch visa requirements for a country."""
        result = await self._request("GET", f"/api/requirements/{country_id}")
        return result if isinstance(result, list) else []

    # Embassies
    async def get_embassies(self, country_id: str) -> list[dict]:
        """Fetch embassy details for a country."""
        result = await self._request("GET", f"/api/embassies/{country_id}")
        return result if isinstance(result, list) else []

    # Visa Info (from RapidAPI cache)
    async def get_visa_info(self, destination_code: str) -> Optional[dict]:
        """Fetch detailed visa info from RapidAPI cache."""
        return await self._request("GET", f"/api/visa-info/{destination_code}")

    async def get_visa_map(self) -> Optional[dict]:
        """Fetch visa map data."""
        return await self._request("GET", "/api/visa-map")

    # Visa Types
    async def get_visa_types(self) -> list[dict]:
        """Fetch all visa types."""
        result = await self._request("GET", "/api/visa-types")
        return result if isinstance(result, list) else []
