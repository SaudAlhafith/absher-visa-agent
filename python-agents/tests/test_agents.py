"""
Tests for AI agents.
"""

import pytest
from src.agents.state import create_initial_state
from src.agents.matcher.agent import DocumentMatcherAgent
from src.agents.scraper.agent import RequirementsScraperAgent
from src.services.cache.memory import MemoryCache


class TestWorkflowState:
    """Tests for workflow state creation."""

    def test_create_initial_state(
        self,
        sample_travelers: list[dict],
        sample_documents: list[dict],
    ):
        """Test creating initial workflow state."""
        state = create_initial_state(
            request_id="test-123",
            country_id="fr",
            country_name_ar="فرنسا",
            visa_type="tourist",
            travelers=sample_travelers,
            documents=sample_documents,
        )

        assert state["request_id"] == "test-123"
        assert state["country_id"] == "fr"
        assert state["current_step"] == "initialized"
        assert len(state["travelers"]) == 2
        assert len(state["documents"]) == 1
        assert state["requirements"] == []
        assert state["match_results"] == []


class TestDocumentMatcherAgent:
    """Tests for DocumentMatcherAgent."""

    @pytest.mark.asyncio
    async def test_match_by_type(
        self,
        sample_requirements: list[dict],
        sample_documents: list[dict],
        sample_travelers: list[dict],
    ):
        """Test document matching by type."""
        agent = DocumentMatcherAgent()

        result = await agent.execute(
            requirements=sample_requirements,
            documents=sample_documents,
            travelers=sample_travelers,
        )

        assert result.coverage_score > 0
        assert len(result.matches) == 2
        # Passport should match
        passport_match = next(
            m for m in result.matches if m["requirement_id"] == "req-1"
        )
        assert passport_match["status"] == "matched"


class TestRequirementsScraperAgent:
    """Tests for RequirementsScraperAgent."""

    @pytest.mark.asyncio
    async def test_fallback_requirements(self, memory_cache: MemoryCache):
        """Test fallback to default requirements."""
        agent = RequirementsScraperAgent(cache=memory_cache)

        result = await agent.execute(
            country_id="xx",  # Unknown country
            visa_type="tourist",
        )

        assert len(result.requirements) > 0
        assert result.source_url == "fallback"
        assert result.from_cache is False

    @pytest.mark.asyncio
    async def test_cache_hit(self, memory_cache: MemoryCache):
        """Test cache hit for requirements."""
        agent = RequirementsScraperAgent(cache=memory_cache)

        # First call - should miss cache
        result1 = await agent.execute(country_id="fr", visa_type="tourist")

        # Second call - should hit cache
        result2 = await agent.execute(country_id="fr", visa_type="tourist")

        assert result2.from_cache is True
        assert result2.requirements == result1.requirements


class TestMemoryCache:
    """Tests for MemoryCache."""

    @pytest.mark.asyncio
    async def test_set_get(self, memory_cache: MemoryCache):
        """Test basic set and get."""
        await memory_cache.set("key1", {"value": 123})
        result = await memory_cache.get("key1")

        assert result == {"value": 123}

    @pytest.mark.asyncio
    async def test_cache_miss(self, memory_cache: MemoryCache):
        """Test cache miss returns None."""
        result = await memory_cache.get("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete(self, memory_cache: MemoryCache):
        """Test delete."""
        await memory_cache.set("key1", "value")
        assert await memory_cache.exists("key1")

        await memory_cache.delete("key1")
        assert not await memory_cache.exists("key1")
