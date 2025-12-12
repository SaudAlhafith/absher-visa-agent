"""
Pytest fixtures and configuration for the test suite.
"""

import pytest
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport

from src.api.main import app
from src.services.cache.memory import MemoryCache


@pytest.fixture
def memory_cache() -> MemoryCache:
    """Provide a fresh memory cache for tests."""
    return MemoryCache()


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client for API tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


@pytest.fixture
def sample_workflow_request() -> dict:
    """Sample workflow start request."""
    return {
        "request_id": "test-req-123",
        "country_id": "fr",
        "visa_type": "tourist",
        "traveler_ids": ["t1", "t2"],
        "documents": [
            {
                "id": "doc-1",
                "type": "passport",
                "file_path": "/uploads/passport.pdf",
            }
        ],
    }


@pytest.fixture
def sample_requirements() -> list[dict]:
    """Sample visa requirements."""
    return [
        {
            "id": "req-1",
            "description_ar": "جواز سفر ساري المفعول",
            "description_en": "Valid passport",
            "category": "personal_documents",
            "is_mandatory": True,
            "document_type": "passport",
            "specifications": {"min_validity_months": 6},
        },
        {
            "id": "req-2",
            "description_ar": "صور شخصية",
            "description_en": "Passport photos",
            "category": "personal_documents",
            "is_mandatory": True,
            "document_type": "photo",
            "specifications": {"size": "35x45mm"},
        },
    ]


@pytest.fixture
def sample_documents() -> list[dict]:
    """Sample documents."""
    return [
        {
            "id": "doc-1",
            "type": "passport",
            "file_path": "/uploads/passport.pdf",
            "traveler_id": None,
            "extracted_text": None,
            "validation_status": "pending",
            "validation_errors": [],
        },
    ]


@pytest.fixture
def sample_travelers() -> list[dict]:
    """Sample travelers."""
    return [
        {
            "id": "t1",
            "name": "Mohammed Ahmed",
            "name_ar": "محمد أحمد",
            "relationship": "self",
            "relationship_ar": "صاحب الطلب",
            "id_number": "1234567890",
            "passport_expiry": "2028-05-01",
        },
        {
            "id": "t2",
            "name": "Sara Ahmed",
            "name_ar": "سارة أحمد",
            "relationship": "spouse",
            "relationship_ar": "زوجة",
            "id_number": "0987654321",
            "passport_expiry": "2027-03-15",
        },
    ]
