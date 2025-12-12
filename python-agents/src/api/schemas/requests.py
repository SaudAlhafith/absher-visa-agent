"""
API request models using Pydantic.
"""

from typing import Optional
from pydantic import BaseModel, Field


class DocumentUpload(BaseModel):
    """Document metadata for workflow."""
    id: str = Field(..., description="Unique document identifier")
    type: str = Field(..., description="Document type (passport, photo, bank_statement, etc.)")
    file_path: str = Field(..., description="Path to uploaded file")
    traveler_id: Optional[str] = Field(None, description="Associated traveler ID if per-traveler")


class WorkflowStartRequest(BaseModel):
    """Request to start a visa workflow."""
    request_id: str = Field(..., description="Visa request ID from Node.js backend")
    country_id: str = Field(..., description="Destination country code (e.g., 'fr', 'de')")
    visa_type: str = Field(default="tourist", description="Type of visa")
    traveler_ids: list[str] = Field(..., description="List of traveler IDs")
    documents: list[DocumentUpload] = Field(default=[], description="Uploaded documents")

    model_config = {
        "json_schema_extra": {
            "example": {
                "request_id": "req-123",
                "country_id": "fr",
                "visa_type": "tourist",
                "traveler_ids": ["t1", "t2"],
                "documents": [
                    {"id": "doc-1", "type": "passport", "file_path": "/uploads/passport.pdf"}
                ],
            }
        }
    }


class ValidateDocumentRequest(BaseModel):
    """Request to validate a single document."""
    document_id: str = Field(..., description="Document ID to validate")
    document_type: str = Field(..., description="Expected document type")
    file_path: str = Field(..., description="Path to the document file")
    country_id: str = Field(..., description="Destination country for validation rules")


class ScrapeRequest(BaseModel):
    """Request to scrape embassy requirements."""
    country_id: str = Field(..., description="Country code to scrape")
    visa_type: str = Field(default="tourist", description="Visa type")
    force_refresh: bool = Field(default=False, description="Force refresh cached data")
