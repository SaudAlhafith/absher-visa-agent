"""
Tests for API endpoints.
"""

import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    @pytest.mark.asyncio
    async def test_health_check(self, async_client: AsyncClient):
        """Test basic health check."""
        response = await async_client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "absher-visa-agents"

    @pytest.mark.asyncio
    async def test_liveness_check(self, async_client: AsyncClient):
        """Test liveness probe."""
        response = await async_client.get("/api/v1/health/live")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"

    @pytest.mark.asyncio
    async def test_readiness_check(self, async_client: AsyncClient):
        """Test readiness probe."""
        response = await async_client.get("/api/v1/health/ready")

        assert response.status_code == 200
        data = response.json()
        assert "ready" in data
        assert "checks" in data


class TestWorkflowEndpoints:
    """Tests for workflow endpoints."""

    @pytest.mark.asyncio
    async def test_workflow_status_not_found(self, async_client: AsyncClient):
        """Test getting status for non-existent workflow."""
        response = await async_client.get("/api/v1/workflow/status/nonexistent")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_workflow_result_not_found(self, async_client: AsyncClient):
        """Test getting result for non-existent workflow."""
        response = await async_client.get("/api/v1/workflow/result/nonexistent")

        assert response.status_code == 404


class TestDocumentEndpoints:
    """Tests for document endpoints."""

    @pytest.mark.asyncio
    async def test_get_pdf_invalid_type(self, async_client: AsyncClient):
        """Test getting PDF with invalid type."""
        response = await async_client.get("/api/v1/documents/pdf/test-123/invalid")

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_get_pdf_not_found(self, async_client: AsyncClient):
        """Test getting PDF that doesn't exist."""
        response = await async_client.get(
            "/api/v1/documents/pdf/nonexistent/application"
        )

        assert response.status_code == 404
