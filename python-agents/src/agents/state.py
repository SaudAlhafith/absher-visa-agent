"""
Workflow state definitions for LangGraph-based agent orchestration.
Uses TypedDict for type safety and serialization support.
"""

from typing import TypedDict, Optional, Literal
from datetime import datetime


class TravelerInfo(TypedDict):
    """Traveler information from Absher."""
    id: str
    name: str
    name_ar: str
    relationship: str
    relationship_ar: str
    id_number: str
    passport_expiry: str


class DocumentInfo(TypedDict):
    """Document metadata."""
    id: str
    type: str
    file_path: str
    traveler_id: Optional[str]
    extracted_text: Optional[str]
    validation_status: Literal["pending", "valid", "invalid", "warning"]
    validation_errors: list[str]


class RequirementInfo(TypedDict):
    """Embassy requirement definition."""
    id: str
    description_ar: str
    description_en: str
    category: str
    is_mandatory: bool
    document_type: Optional[str]
    specifications: dict


class MatchResult(TypedDict):
    """Document to requirement matching result."""
    requirement_id: str
    document_id: Optional[str]
    match_score: float
    status: Literal["matched", "partial", "missing"]
    notes: list[str]


# Workflow step literals
WorkflowStep = Literal[
    "initialized",
    "scraping_requirements",
    "requirements_ready",
    "matching_documents",
    "documents_matched",
    "validating_documents",
    "documents_validated",
    "generating_pdf",
    "completed",
    "error",
]


class WorkflowState(TypedDict):
    """
    Main workflow state passed between agents.
    This is the central data structure for the LangGraph workflow.
    """
    # Request context
    request_id: str
    country_id: str
    country_name_ar: str
    visa_type: str
    travelers: list[TravelerInfo]

    # Workflow progress
    current_step: WorkflowStep
    started_at: str
    updated_at: str

    # Scraped requirements
    requirements: list[RequirementInfo]
    requirements_source: Optional[str]
    requirements_cached: bool

    # User documents
    documents: list[DocumentInfo]

    # Matching results
    match_results: list[MatchResult]
    missing_requirements: list[str]

    # Validation results
    validation_complete: bool
    validation_errors: list[str]
    validation_warnings: list[str]

    # Generated outputs
    generated_pdf_path: Optional[str]
    checklist_pdf_path: Optional[str]

    # Error handling
    error_message: Optional[str]
    retry_count: int
    max_retries: int


def create_initial_state(
    request_id: str,
    country_id: str,
    country_name_ar: str,
    visa_type: str,
    travelers: list[dict],
    documents: list[dict],
) -> WorkflowState:
    """Create initial workflow state with defaults."""
    now = datetime.utcnow().isoformat()

    # Convert documents to proper format
    formatted_docs: list[DocumentInfo] = []
    for doc in documents:
        formatted_docs.append({
            "id": doc.get("id", ""),
            "type": doc.get("type", ""),
            "file_path": doc.get("file_path", ""),
            "traveler_id": doc.get("traveler_id"),
            "extracted_text": None,
            "validation_status": "pending",
            "validation_errors": [],
        })

    # Convert travelers to proper format
    formatted_travelers: list[TravelerInfo] = []
    for t in travelers:
        formatted_travelers.append({
            "id": t.get("id", ""),
            "name": t.get("name", ""),
            "name_ar": t.get("nameAr", t.get("name_ar", "")),
            "relationship": t.get("relationship", ""),
            "relationship_ar": t.get("relationshipAr", t.get("relationship_ar", "")),
            "id_number": t.get("idNumber", t.get("id_number", "")),
            "passport_expiry": t.get("passportExpiry", t.get("passport_expiry", "")),
        })

    return WorkflowState(
        request_id=request_id,
        country_id=country_id,
        country_name_ar=country_name_ar,
        visa_type=visa_type,
        travelers=formatted_travelers,
        documents=formatted_docs,
        current_step="initialized",
        started_at=now,
        updated_at=now,
        requirements=[],
        requirements_source=None,
        requirements_cached=False,
        match_results=[],
        missing_requirements=[],
        validation_complete=False,
        validation_errors=[],
        validation_warnings=[],
        generated_pdf_path=None,
        checklist_pdf_path=None,
        error_message=None,
        retry_count=0,
        max_retries=3,
    )
