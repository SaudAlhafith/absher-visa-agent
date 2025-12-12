"""
API response models using Pydantic.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class RequirementInfo(BaseModel):
    """Embassy requirement information."""
    id: str
    description_ar: str
    description_en: str
    category: str
    is_mandatory: bool
    document_type: Optional[str] = None
    specifications: dict = Field(default_factory=dict)


class MatchResult(BaseModel):
    """Document to requirement matching result."""
    requirement_id: str
    document_id: Optional[str]
    match_score: float
    status: Literal["matched", "partial", "missing"]
    notes: list[str] = Field(default_factory=list)


class WorkflowStartResponse(BaseModel):
    """Response when starting a workflow."""
    request_id: str
    status: str
    message: str


class WorkflowStatusResponse(BaseModel):
    """Response with current workflow status."""
    request_id: str
    current_step: str
    started_at: str
    updated_at: str
    requirements_count: int
    matched_count: int
    missing_count: int
    validation_errors: list[str] = Field(default_factory=list)
    has_pdf: bool


class WorkflowResultResponse(BaseModel):
    """Complete workflow result after completion."""
    request_id: str
    status: Literal["success", "error"]
    requirements: list[RequirementInfo] = Field(default_factory=list)
    match_results: list[MatchResult] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)
    validation_errors: list[str] = Field(default_factory=list)
    validation_warnings: list[str] = Field(default_factory=list)
    application_pdf_url: Optional[str] = None
    checklist_pdf_url: Optional[str] = None
    error_message: Optional[str] = None


class DocumentValidationResponse(BaseModel):
    """Response from document validation."""
    document_id: str
    status: Literal["valid", "invalid", "warning"]
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    extracted_text: Optional[str] = None


class ScrapeResponse(BaseModel):
    """Response from scraping operation."""
    country_id: str
    requirements_count: int
    from_cache: bool
    scraped_at: str
    source_url: Optional[str] = None
