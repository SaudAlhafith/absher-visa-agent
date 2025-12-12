"""
Document management API endpoints.
Handles document upload, validation, and PDF serving.
"""

import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from src.api.dependencies import get_validator_agent
from src.api.schemas.requests import ValidateDocumentRequest
from src.api.schemas.responses import DocumentValidationResponse
from src.agents.validator.agent import ValidationAgent
from src.config.settings import get_settings


logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    traveler_id: Optional[str] = Form(None),
) -> dict:
    """
    Upload a document for visa application.
    Returns the document ID and file path.
    """
    import uuid
    import aiofiles

    # Generate unique ID
    doc_id = f"doc-{uuid.uuid4().hex[:8]}"

    # Create upload directory
    upload_dir = Path(settings.storage_local_path)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_ext = Path(file.filename or "").suffix or ".pdf"
    file_path = upload_dir / f"{doc_id}{file_ext}"

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    logger.info(f"Uploaded document {doc_id}: {file_path}")

    return {
        "id": doc_id,
        "type": document_type,
        "file_path": str(file_path),
        "traveler_id": traveler_id,
        "filename": file.filename,
        "size": len(content),
    }


@router.post("/validate", response_model=DocumentValidationResponse)
async def validate_document(
    request: ValidateDocumentRequest,
    validator: ValidationAgent = Depends(get_validator_agent),
) -> DocumentValidationResponse:
    """
    Validate a single document against embassy requirements.
    """
    document = {
        "id": request.document_id,
        "type": request.document_type,
        "file_path": request.file_path,
    }

    result = await validator.validate_single(
        document=document,
        country_id=request.country_id,
    )

    return DocumentValidationResponse(
        document_id=request.document_id,
        status=result.status,
        errors=result.errors,
        warnings=result.warnings,
        extracted_text=result.extracted_text,
    )


@router.get("/pdf/{request_id}/{pdf_type}")
async def get_pdf(
    request_id: str,
    pdf_type: str,
) -> FileResponse:
    """
    Download generated PDF document.
    pdf_type: 'application' or 'checklist'
    """
    if pdf_type not in ["application", "checklist"]:
        raise HTTPException(status_code=400, detail="Invalid PDF type")

    # Look for PDF in uploads directory
    pdf_dir = Path(settings.storage_local_path) / request_id

    if not pdf_dir.exists():
        raise HTTPException(status_code=404, detail="PDF not found")

    # Find the most recent PDF of the requested type
    pdf_files = list(pdf_dir.glob(f"{pdf_type}_*.pdf"))

    if not pdf_files:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Get the most recent file
    pdf_path = max(pdf_files, key=lambda p: p.stat().st_mtime)

    return FileResponse(
        path=str(pdf_path),
        filename=f"{pdf_type}_{request_id}.pdf",
        media_type="application/pdf",
    )


@router.delete("/{document_id}")
async def delete_document(document_id: str) -> dict:
    """
    Delete an uploaded document.
    """
    upload_dir = Path(settings.storage_local_path)

    # Find and delete the document
    for file_path in upload_dir.glob(f"{document_id}.*"):
        file_path.unlink()
        logger.info(f"Deleted document: {file_path}")
        return {"message": "Document deleted", "id": document_id}

    raise HTTPException(status_code=404, detail="Document not found")
