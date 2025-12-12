"""
Document Matcher Agent using semantic similarity for multilingual matching.
Matches user documents against embassy requirements.
"""

from dataclasses import dataclass
from typing import Optional

import numpy as np

from src.agents.base import BaseAgent
from src.agents.state import RequirementInfo, DocumentInfo, MatchResult, TravelerInfo
from src.config.settings import get_settings


settings = get_settings()


@dataclass
class MatchingResult:
    """Result of document matching."""
    matches: list[MatchResult]
    missing: list[str]
    coverage_score: float


class DocumentMatcherAgent(BaseAgent[dict, MatchingResult]):
    """
    Matches user documents against embassy requirements using semantic search.
    Supports Arabic/English with multilingual embeddings.
    """

    # Confidence thresholds
    HIGH_CONFIDENCE = 0.85
    MEDIUM_CONFIDENCE = 0.65
    MIN_CONFIDENCE = 0.45

    # Document type mappings for exact matching
    TYPE_MAPPINGS: dict[str, list[str]] = {
        "passport": ["passport", "جواز سفر", "جواز"],
        "photo": ["photo", "صورة", "صور شخصية"],
        "bank_statement": ["bank", "statement", "كشف حساب", "بنك"],
        "employment_letter": ["employment", "employer", "عمل", "تعريف"],
        "travel_insurance": ["insurance", "تأمين"],
        "flight_booking": ["flight", "طيران", "حجز"],
        "hotel_booking": ["hotel", "accommodation", "فندق", "إقامة"],
        "application_form": ["application", "form", "نموذج", "طلب"],
        "national_id": ["id", "هوية", "national"],
        "family_card": ["family", "عائلة", "سجل"],
    }

    def __init__(self):
        super().__init__("DocumentMatcherAgent")
        self._embedding_model = None

    def _get_embedding_model(self):
        """Lazy load the embedding model."""
        if self._embedding_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._embedding_model = SentenceTransformer(settings.embedding_model)
                self.log_info(f"Loaded embedding model: {settings.embedding_model}")
            except ImportError:
                self.log_warning("sentence-transformers not available, using fallback matching")
                return None
        return self._embedding_model

    async def execute(
        self,
        requirements: list[RequirementInfo],
        documents: list[DocumentInfo],
        travelers: list[TravelerInfo],
    ) -> MatchingResult:
        """
        Match documents to requirements for all travelers.
        """
        matches: list[MatchResult] = []
        missing: list[str] = []

        # First try type-based matching
        type_matches = self._match_by_type(requirements, documents)

        # Then use semantic matching for unmatched requirements
        unmatched_reqs = [r for r in requirements if r["id"] not in type_matches]

        if unmatched_reqs and self._get_embedding_model():
            semantic_matches = await self._match_semantically(unmatched_reqs, documents)
            type_matches.update(semantic_matches)

        # Build final results
        for requirement in requirements:
            match_info = type_matches.get(requirement["id"])

            if match_info:
                matches.append(MatchResult(
                    requirement_id=requirement["id"],
                    document_id=match_info["document_id"],
                    match_score=match_info["score"],
                    status=match_info["status"],
                    notes=match_info["notes"],
                ))
            else:
                matches.append(MatchResult(
                    requirement_id=requirement["id"],
                    document_id=None,
                    match_score=0.0,
                    status="missing",
                    notes=["No matching document found"],
                ))
                if requirement.get("is_mandatory", True):
                    missing.append(requirement["id"])

        # Calculate coverage score
        total = len(requirements)
        matched_count = sum(1 for m in matches if m["status"] in ["matched", "partial"])
        coverage = matched_count / total if total > 0 else 1.0

        return MatchingResult(
            matches=matches,
            missing=missing,
            coverage_score=coverage,
        )

    def _match_by_type(
        self,
        requirements: list[RequirementInfo],
        documents: list[DocumentInfo],
    ) -> dict[str, dict]:
        """Match documents to requirements by document type."""
        matches: dict[str, dict] = {}
        used_docs: set[str] = set()

        for req in requirements:
            req_type = req.get("document_type")
            if not req_type:
                continue

            # Find matching document
            for doc in documents:
                if doc["id"] in used_docs:
                    continue

                doc_type = doc.get("type", "").lower()

                # Check direct type match
                if doc_type == req_type.lower():
                    matches[req["id"]] = {
                        "document_id": doc["id"],
                        "score": 1.0,
                        "status": "matched",
                        "notes": ["Direct type match"],
                    }
                    used_docs.add(doc["id"])
                    break

                # Check type mappings
                type_keywords = self.TYPE_MAPPINGS.get(req_type.lower(), [])
                if any(kw in doc_type for kw in type_keywords):
                    matches[req["id"]] = {
                        "document_id": doc["id"],
                        "score": 0.9,
                        "status": "matched",
                        "notes": ["Type keyword match"],
                    }
                    used_docs.add(doc["id"])
                    break

        return matches

    async def _match_semantically(
        self,
        requirements: list[RequirementInfo],
        documents: list[DocumentInfo],
    ) -> dict[str, dict]:
        """Match using semantic similarity of descriptions."""
        matches: dict[str, dict] = {}
        model = self._get_embedding_model()

        if not model or not requirements or not documents:
            return matches

        # Prepare texts for embedding
        req_texts = []
        for req in requirements:
            # Combine Arabic and English descriptions
            text = f"{req.get('description_ar', '')} {req.get('description_en', '')}"
            req_texts.append(text)

        doc_texts = []
        for doc in documents:
            # Use extracted text if available, otherwise use type
            text = doc.get("extracted_text") or doc.get("type", "")
            doc_texts.append(text)

        # Generate embeddings
        req_embeddings = model.encode(req_texts, normalize_embeddings=True)
        doc_embeddings = model.encode(doc_texts, normalize_embeddings=True)

        # Find best matches
        used_docs: set[int] = set()

        for i, req in enumerate(requirements):
            best_score = 0.0
            best_doc_idx = -1

            for j in range(len(documents)):
                if j in used_docs:
                    continue

                # Cosine similarity (vectors are normalized)
                score = float(np.dot(req_embeddings[i], doc_embeddings[j]))

                if score > best_score:
                    best_score = score
                    best_doc_idx = j

            if best_doc_idx >= 0 and best_score >= self.MIN_CONFIDENCE:
                doc = documents[best_doc_idx]

                if best_score >= self.HIGH_CONFIDENCE:
                    status = "matched"
                    notes = ["High confidence semantic match"]
                elif best_score >= self.MEDIUM_CONFIDENCE:
                    status = "partial"
                    notes = ["Medium confidence - please verify"]
                else:
                    status = "partial"
                    notes = ["Low confidence - manual review recommended"]

                matches[req["id"]] = {
                    "document_id": doc["id"],
                    "score": best_score,
                    "status": status,
                    "notes": notes,
                }
                used_docs.add(best_doc_idx)

        return matches
