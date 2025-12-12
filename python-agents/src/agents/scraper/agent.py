"""
Requirements Scraper Agent for fetching visa requirements from embassy websites.
Uses Crawl4AI for intelligent web scraping with LLM extraction.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional, TYPE_CHECKING

from src.agents.base import BaseAgent
from src.agents.state import RequirementInfo
from src.config.settings import get_settings

if TYPE_CHECKING:
    from src.services.cache.memory import MemoryCache


settings = get_settings()


@dataclass
class ScrapeResult:
    """Result of scraping operation."""
    requirements: list[RequirementInfo]
    source_url: str
    from_cache: bool
    scraped_at: str


class RequirementsScraperAgent(BaseAgent[dict, ScrapeResult]):
    """
    Scrapes and structures visa requirements from embassy websites.
    Uses caching to avoid repeated scraping.
    """

    # Embassy URLs for different countries
    EMBASSY_URLS: dict[str, str] = {
        "fr": "https://fr.tlscontact.com/sa/RUH/page.php?pid=requirements",
        "de": "https://riyadh.diplo.de/sa-en/service/visa",
        "gb": "https://www.gov.uk/standard-visitor-visa",
        "us": "https://travel.state.gov/content/travel/en/us-visas.html",
        "es": "https://www.exteriores.gob.es/Consulados/riyadh/en",
        "it": "https://consriyadh.esteri.it/consolato_riad/en",
    }

    # Default requirements when scraping is not available
    DEFAULT_REQUIREMENTS: dict[str, list[RequirementInfo]] = {
        "tourist": [
            {
                "id": "req-passport",
                "description_ar": "جواز سفر ساري المفعول لمدة 6 أشهر على الأقل",
                "description_en": "Valid passport with at least 6 months validity",
                "category": "personal_documents",
                "is_mandatory": True,
                "document_type": "passport",
                "specifications": {"min_validity_months": 6, "min_blank_pages": 2},
            },
            {
                "id": "req-photo",
                "description_ar": "صور شخصية بخلفية بيضاء",
                "description_en": "Passport-sized photos with white background",
                "category": "personal_documents",
                "is_mandatory": True,
                "document_type": "photo",
                "specifications": {"size": "35x45mm", "background": "white", "count": 2},
            },
            {
                "id": "req-application",
                "description_ar": "نموذج طلب التأشيرة مكتمل",
                "description_en": "Completed visa application form",
                "category": "application",
                "is_mandatory": True,
                "document_type": "application_form",
                "specifications": {},
            },
            {
                "id": "req-bank",
                "description_ar": "كشف حساب بنكي لآخر 3 أشهر",
                "description_en": "Bank statement for the last 3 months",
                "category": "financial",
                "is_mandatory": True,
                "document_type": "bank_statement",
                "specifications": {"months": 3, "min_balance": "varies"},
            },
            {
                "id": "req-employment",
                "description_ar": "خطاب تعريف من جهة العمل",
                "description_en": "Employment letter from employer",
                "category": "employment",
                "is_mandatory": True,
                "document_type": "employment_letter",
                "specifications": {},
            },
            {
                "id": "req-travel-insurance",
                "description_ar": "تأمين السفر",
                "description_en": "Travel insurance covering the trip duration",
                "category": "travel",
                "is_mandatory": True,
                "document_type": "travel_insurance",
                "specifications": {"min_coverage": "30000 EUR"},
            },
            {
                "id": "req-itinerary",
                "description_ar": "حجز الطيران (ذهاب وإياب)",
                "description_en": "Flight reservation (round trip)",
                "category": "travel",
                "is_mandatory": True,
                "document_type": "flight_booking",
                "specifications": {},
            },
            {
                "id": "req-accommodation",
                "description_ar": "حجز الفندق أو خطاب دعوة",
                "description_en": "Hotel reservation or invitation letter",
                "category": "accommodation",
                "is_mandatory": True,
                "document_type": "hotel_booking",
                "specifications": {},
            },
        ],
    }

    def __init__(self, cache: "MemoryCache"):
        super().__init__("RequirementsScraperAgent")
        self.cache = cache

    async def execute(
        self,
        country_id: str,
        visa_type: str = "tourist",
    ) -> ScrapeResult:
        """
        Scrape requirements for a country, using cache if available.
        """
        cache_key = f"requirements:{country_id}:{visa_type}"

        # Check cache first
        cached = await self.cache.get(cache_key)
        if cached:
            self.log_info(f"Cache hit for {cache_key}")
            return ScrapeResult(
                requirements=cached["requirements"],
                source_url=cached.get("source_url", ""),
                from_cache=True,
                scraped_at=cached.get("scraped_at", ""),
            )

        # Try to scrape from embassy website
        url = self.EMBASSY_URLS.get(country_id.lower())
        if url:
            try:
                result = await self._scrape_embassy(country_id, visa_type, url)
                # Cache the result
                await self.cache.set(
                    cache_key,
                    {
                        "requirements": result.requirements,
                        "source_url": result.source_url,
                        "scraped_at": result.scraped_at,
                    },
                    ttl=settings.scrape_cache_ttl_days * 86400,
                )
                return result
            except Exception as e:
                self.log_warning(f"Scraping failed for {country_id}: {e}")

        # Fall back to default requirements
        return await self._get_fallback_requirements(country_id, visa_type)

    async def _scrape_embassy(
        self,
        country_id: str,
        visa_type: str,
        url: str,
    ) -> ScrapeResult:
        """Perform actual scraping of embassy website."""
        self.log_info(f"Scraping embassy website: {url}")

        try:
            # Import crawl4ai only when needed
            from crawl4ai import AsyncWebCrawler
            from crawl4ai.extraction_strategy import LLMExtractionStrategy

            extraction_prompt = self._build_extraction_prompt(visa_type)

            async with AsyncWebCrawler(
                headless=True,
                user_agent=settings.scraper_user_agent,
            ) as crawler:
                result = await crawler.arun(
                    url=url,
                    extraction_strategy=LLMExtractionStrategy(
                        provider=settings.llm_provider,
                        instruction=extraction_prompt,
                    ),
                    timeout=settings.scraper_timeout,
                )

            if not result.success:
                raise Exception(f"Scraping failed: {result.error}")

            requirements = self._parse_extraction(result.extracted_content, country_id)

            return ScrapeResult(
                requirements=requirements,
                source_url=url,
                from_cache=False,
                scraped_at=datetime.utcnow().isoformat(),
            )

        except ImportError:
            self.log_warning("Crawl4AI not available, using fallback")
            return await self._get_fallback_requirements(country_id, visa_type)
        except Exception as e:
            self.log_error(f"Scraping error: {e}")
            return await self._get_fallback_requirements(country_id, visa_type)

    def _build_extraction_prompt(self, visa_type: str) -> str:
        """Build LLM extraction prompt."""
        return f"""
        Extract all visa requirements from this embassy page for a {visa_type} visa.

        For each requirement, identify:
        1. Description in Arabic (translate if not available)
        2. Description in English
        3. Category (personal_documents, financial, travel, accommodation, employment, etc.)
        4. Whether it's mandatory
        5. Document type if applicable (passport, photo, bank_statement, etc.)
        6. Any specific specifications (dimensions, validity period, etc.)

        Return as a JSON array of requirements with the following structure:
        {{
            "id": "unique_id",
            "description_ar": "Arabic description",
            "description_en": "English description",
            "category": "category_name",
            "is_mandatory": true/false,
            "document_type": "type_name",
            "specifications": {{}}
        }}
        """

    def _parse_extraction(
        self,
        extracted_content: Any,
        country_id: str,
    ) -> list[RequirementInfo]:
        """Parse the extracted content into RequirementInfo list."""
        requirements: list[RequirementInfo] = []

        if isinstance(extracted_content, list):
            for i, item in enumerate(extracted_content):
                if isinstance(item, dict):
                    req: RequirementInfo = {
                        "id": item.get("id", f"req-{country_id}-{i}"),
                        "description_ar": item.get("description_ar", ""),
                        "description_en": item.get("description_en", ""),
                        "category": item.get("category", "other"),
                        "is_mandatory": item.get("is_mandatory", True),
                        "document_type": item.get("document_type"),
                        "specifications": item.get("specifications", {}),
                    }
                    requirements.append(req)

        return requirements if requirements else self.DEFAULT_REQUIREMENTS.get("tourist", [])

    async def _get_fallback_requirements(
        self,
        country_id: str,
        visa_type: str,
    ) -> ScrapeResult:
        """Return default requirements when scraping fails or is unavailable."""
        self.log_info(f"Using fallback requirements for {country_id}/{visa_type}")

        requirements = self.DEFAULT_REQUIREMENTS.get(
            visa_type, self.DEFAULT_REQUIREMENTS.get("tourist", [])
        )

        # Add country-specific ID prefix
        for req in requirements:
            if not req["id"].startswith(f"req-{country_id}"):
                req["id"] = f"req-{country_id}-{req['id'].replace('req-', '')}"

        return ScrapeResult(
            requirements=requirements,
            source_url="fallback",
            from_cache=False,
            scraped_at=datetime.utcnow().isoformat(),
        )
