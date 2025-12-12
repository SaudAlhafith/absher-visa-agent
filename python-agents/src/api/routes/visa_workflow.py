"""
Visa workflow API endpoints.
Main integration point with the Node.js backend.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from src.api.dependencies import get_orchestrator, get_node_client
from src.api.schemas.requests import WorkflowStartRequest
from src.api.schemas.responses import (
    WorkflowStartResponse,
    WorkflowStatusResponse,
    WorkflowResultResponse,
)
from src.agents.orchestrator.agent import OrchestratorAgent
from src.services.node_backend import NodeBackendClient


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/start", response_model=WorkflowStartResponse)
async def start_workflow(
    request: WorkflowStartRequest,
    background_tasks: BackgroundTasks,
    orchestrator: OrchestratorAgent = Depends(get_orchestrator),
    node_client: NodeBackendClient = Depends(get_node_client),
) -> WorkflowStartResponse:
    """
    Start a new visa application workflow.
    Called by the Node.js backend when user submits Step 2.
    """
    # Validate request exists in Node.js backend
    visa_request = await node_client.get_visa_request(request.request_id)
    if not visa_request:
        raise HTTPException(status_code=404, detail="Visa request not found")

    # Fetch country and traveler details
    country = await node_client.get_country(request.country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")

    travelers = await node_client.get_travelers(request.traveler_ids)

    # Convert documents to dict format
    documents = [doc.model_dump() for doc in request.documents]

    # Start workflow in background
    background_tasks.add_task(
        orchestrator.run,
        request_id=request.request_id,
        country_id=request.country_id,
        country_name_ar=country.get("nameAr", ""),
        visa_type=request.visa_type,
        travelers=travelers,
        documents=documents,
    )

    logger.info(f"Started workflow for request {request.request_id}")

    return WorkflowStartResponse(
        request_id=request.request_id,
        status="started",
        message="Workflow initiated successfully",
    )


@router.get("/status/{request_id}", response_model=WorkflowStatusResponse)
async def get_workflow_status(
    request_id: str,
    orchestrator: OrchestratorAgent = Depends(get_orchestrator),
) -> WorkflowStatusResponse:
    """
    Get current workflow status.
    Polled by Node.js backend or frontend to track progress.
    """
    state = orchestrator.get_state(request_id)

    if not state:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return WorkflowStatusResponse(
        request_id=request_id,
        current_step=state.get("current_step", "unknown"),
        started_at=state.get("started_at", ""),
        updated_at=state.get("updated_at", ""),
        requirements_count=len(state.get("requirements", [])),
        matched_count=len([
            m for m in state.get("match_results", [])
            if m.get("status") == "matched"
        ]),
        missing_count=len(state.get("missing_requirements", [])),
        validation_errors=state.get("validation_errors", []),
        has_pdf=state.get("generated_pdf_path") is not None,
    )


@router.get("/result/{request_id}", response_model=WorkflowResultResponse)
async def get_workflow_result(
    request_id: str,
    orchestrator: OrchestratorAgent = Depends(get_orchestrator),
) -> WorkflowResultResponse:
    """
    Get complete workflow result after completion.
    Returns all data needed for the Success page.
    """
    state = orchestrator.get_state(request_id)

    if not state:
        raise HTTPException(status_code=404, detail="Workflow not found")

    current_step = state.get("current_step", "")
    if current_step not in ["completed", "error"]:
        raise HTTPException(status_code=400, detail="Workflow not yet complete")

    return WorkflowResultResponse(
        request_id=request_id,
        status="success" if current_step == "completed" else "error",
        requirements=state.get("requirements", []),
        match_results=state.get("match_results", []),
        missing_requirements=state.get("missing_requirements", []),
        validation_errors=state.get("validation_errors", []),
        validation_warnings=state.get("validation_warnings", []),
        application_pdf_url=f"/api/v1/documents/pdf/{request_id}/application" if state.get("generated_pdf_path") else None,
        checklist_pdf_url=f"/api/v1/documents/pdf/{request_id}/checklist" if state.get("checklist_pdf_path") else None,
        error_message=state.get("error_message"),
    )


@router.post("/retry/{request_id}")
async def retry_workflow(
    request_id: str,
    background_tasks: BackgroundTasks,
    orchestrator: OrchestratorAgent = Depends(get_orchestrator),
) -> dict:
    """
    Retry a failed workflow from the last checkpoint.
    """
    state = orchestrator.get_state(request_id)

    if not state:
        raise HTTPException(status_code=404, detail="Workflow not found")

    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)

    if retry_count >= max_retries:
        raise HTTPException(status_code=400, detail="Maximum retries exceeded")

    background_tasks.add_task(
        orchestrator.resume,
        request_id=request_id,
    )

    return {"message": "Retry initiated", "attempt": retry_count + 1}
