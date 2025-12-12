"""
Main orchestrator agent using LangGraph for workflow management.
Coordinates all other agents in the visa application pipeline.
"""

from datetime import datetime
from typing import Any, Optional, TYPE_CHECKING

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from src.agents.base import BaseAgent
from src.agents.state import WorkflowState, create_initial_state

if TYPE_CHECKING:
    from src.agents.scraper.agent import RequirementsScraperAgent
    from src.agents.matcher.agent import DocumentMatcherAgent
    from src.agents.validator.agent import ValidationAgent
    from src.agents.pdf_generator.agent import PDFGeneratorAgent


class OrchestratorAgent(BaseAgent[dict, WorkflowState]):
    """
    Central orchestrator that manages the visa application workflow.
    Uses LangGraph for state management and conditional routing.
    """

    def __init__(
        self,
        scraper_agent: "RequirementsScraperAgent",
        matcher_agent: "DocumentMatcherAgent",
        validator_agent: "ValidationAgent",
        pdf_agent: "PDFGeneratorAgent",
    ):
        super().__init__("OrchestratorAgent")
        self.scraper = scraper_agent
        self.matcher = matcher_agent
        self.validator = validator_agent
        self.pdf_generator = pdf_agent

        # State storage for active workflows
        self._states: dict[str, WorkflowState] = {}

        # Build the workflow graph
        self.graph = self._build_graph()
        self.checkpointer = MemorySaver()

    def _build_graph(self) -> StateGraph:
        """Construct the LangGraph workflow."""
        workflow = StateGraph(WorkflowState)

        # Add nodes
        workflow.add_node("initialize", self._initialize_node)
        workflow.add_node("scrape", self._scrape_node)
        workflow.add_node("match", self._match_node)
        workflow.add_node("validate", self._validate_node)
        workflow.add_node("generate", self._generate_node)
        workflow.add_node("error_handler", self._error_handler_node)

        # Set entry point
        workflow.set_entry_point("initialize")

        # Add conditional edges
        workflow.add_conditional_edges(
            "initialize",
            self._should_scrape,
            {
                "scrape": "scrape",
                "cached": "match",
                "error": "error_handler",
            },
        )

        workflow.add_conditional_edges(
            "scrape",
            self._should_match,
            {
                "match": "match",
                "error": "error_handler",
            },
        )

        workflow.add_conditional_edges(
            "match",
            self._should_validate,
            {
                "validate": "validate",
                "incomplete": END,  # Return for user to provide missing docs
                "error": "error_handler",
            },
        )

        workflow.add_conditional_edges(
            "validate",
            self._should_generate,
            {
                "generate": "generate",
                "invalid": END,  # Return with validation errors
                "error": "error_handler",
            },
        )

        workflow.add_conditional_edges(
            "generate",
            self._check_completion,
            {
                "complete": END,
                "error": "error_handler",
            },
        )

        workflow.add_edge("error_handler", END)

        return workflow.compile(checkpointer=self.checkpointer)

    # Node functions
    async def _initialize_node(self, state: WorkflowState) -> dict[str, Any]:
        """Initialize the workflow."""
        self.log_info("Initializing workflow", request_id=state["request_id"])
        return {
            "current_step": "initialized",
            "updated_at": datetime.utcnow().isoformat(),
        }

    async def _scrape_node(self, state: WorkflowState) -> dict[str, Any]:
        """Execute scraping agent."""
        self.log_info("Scraping requirements", request_id=state["request_id"])

        try:
            result = await self.scraper.execute(
                country_id=state["country_id"],
                visa_type=state["visa_type"],
            )

            return {
                "requirements": result.requirements,
                "requirements_source": result.source_url,
                "requirements_cached": result.from_cache,
                "current_step": "requirements_ready",
                "updated_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            self.log_error("Scraping failed", error=str(e))
            return {
                "error_message": f"Failed to scrape requirements: {str(e)}",
                "current_step": "error",
            }

    async def _match_node(self, state: WorkflowState) -> dict[str, Any]:
        """Execute matching agent."""
        self.log_info("Matching documents", request_id=state["request_id"])

        try:
            result = await self.matcher.execute(
                requirements=state["requirements"],
                documents=state["documents"],
                travelers=state["travelers"],
            )

            return {
                "match_results": result.matches,
                "missing_requirements": result.missing,
                "current_step": "documents_matched",
                "updated_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            self.log_error("Matching failed", error=str(e))
            return {
                "error_message": f"Failed to match documents: {str(e)}",
                "current_step": "error",
            }

    async def _validate_node(self, state: WorkflowState) -> dict[str, Any]:
        """Execute validation agent."""
        self.log_info("Validating documents", request_id=state["request_id"])

        try:
            result = await self.validator.execute(
                documents=state["documents"],
                requirements=state["requirements"],
            )

            return {
                "documents": result.validated_documents,
                "validation_complete": True,
                "validation_errors": result.errors,
                "validation_warnings": result.warnings,
                "current_step": "documents_validated",
                "updated_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            self.log_error("Validation failed", error=str(e))
            return {
                "error_message": f"Failed to validate documents: {str(e)}",
                "current_step": "error",
            }

    async def _generate_node(self, state: WorkflowState) -> dict[str, Any]:
        """Execute PDF generation agent."""
        self.log_info("Generating PDF", request_id=state["request_id"])

        try:
            result = await self.pdf_generator.execute(state=state)

            return {
                "generated_pdf_path": result.application_pdf,
                "checklist_pdf_path": result.checklist_pdf,
                "current_step": "completed",
                "updated_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            self.log_error("PDF generation failed", error=str(e))
            return {
                "error_message": f"Failed to generate PDF: {str(e)}",
                "current_step": "error",
            }

    async def _error_handler_node(self, state: WorkflowState) -> dict[str, Any]:
        """Handle errors in the workflow."""
        self.log_error(
            "Workflow error",
            request_id=state["request_id"],
            error=state.get("error_message", "Unknown error"),
        )

        return {
            "current_step": "error",
            "retry_count": state.get("retry_count", 0) + 1,
            "updated_at": datetime.utcnow().isoformat(),
        }

    # Edge condition functions
    def _should_scrape(self, state: WorkflowState) -> str:
        """Determine if we need to scrape or use cached requirements."""
        if state.get("error_message"):
            return "error"
        if state.get("requirements") and state.get("requirements_cached"):
            return "cached"
        return "scrape"

    def _should_match(self, state: WorkflowState) -> str:
        """Determine if we should proceed to matching."""
        if state.get("error_message"):
            return "error"
        return "match"

    def _should_validate(self, state: WorkflowState) -> str:
        """Determine if we should proceed to validation."""
        if state.get("error_message"):
            return "error"

        # Check if too many requirements are missing
        missing_count = len(state.get("missing_requirements", []))
        total_mandatory = sum(
            1 for r in state.get("requirements", []) if r.get("is_mandatory", False)
        )

        if total_mandatory > 0 and missing_count / total_mandatory > 0.5:
            # More than 50% mandatory requirements missing
            return "incomplete"

        return "validate"

    def _should_generate(self, state: WorkflowState) -> str:
        """Determine if we should proceed to PDF generation."""
        if state.get("error_message"):
            return "error"

        # Check if there are critical validation errors
        errors = state.get("validation_errors", [])
        if len(errors) > 0:
            # Has critical errors, don't generate PDF
            return "invalid"

        return "generate"

    def _check_completion(self, state: WorkflowState) -> str:
        """Check if workflow completed successfully."""
        if state.get("error_message"):
            return "error"
        return "complete"

    # Public API
    async def execute(
        self,
        request_id: str,
        country_id: str,
        country_name_ar: str,
        visa_type: str,
        travelers: list[dict],
        documents: list[dict],
    ) -> WorkflowState:
        """Execute the complete workflow (alias for run)."""
        return await self.run(
            request_id=request_id,
            country_id=country_id,
            country_name_ar=country_name_ar,
            visa_type=visa_type,
            travelers=travelers,
            documents=documents,
        )

    async def run(
        self,
        request_id: str,
        country_id: str,
        country_name_ar: str,
        visa_type: str,
        travelers: list[dict],
        documents: list[dict],
    ) -> WorkflowState:
        """Execute the complete workflow."""
        initial_state = create_initial_state(
            request_id=request_id,
            country_id=country_id,
            country_name_ar=country_name_ar,
            visa_type=visa_type,
            travelers=travelers,
            documents=documents,
        )

        config = {"configurable": {"thread_id": request_id}}

        self.log_info(f"Starting workflow for request {request_id}")

        # Store initial state
        self._states[request_id] = initial_state

        try:
            # Run the graph
            final_state = await self.graph.ainvoke(initial_state, config)

            # Update stored state
            self._states[request_id] = final_state

            self.log_info(
                f"Workflow completed for {request_id}",
                step=final_state.get("current_step"),
            )

            return final_state

        except Exception as e:
            self.log_error(f"Workflow failed for {request_id}", error=str(e))
            # Update state with error
            self._states[request_id] = {
                **initial_state,
                "current_step": "error",
                "error_message": str(e),
            }
            raise

    async def resume(self, request_id: str) -> WorkflowState:
        """Resume a workflow from the last checkpoint."""
        state = self._states.get(request_id)
        if not state:
            raise ValueError(f"No workflow found for request {request_id}")

        config = {"configurable": {"thread_id": request_id}}

        self.log_info(f"Resuming workflow for request {request_id}")

        final_state = await self.graph.ainvoke(state, config)
        self._states[request_id] = final_state

        return final_state

    def get_state(self, request_id: str) -> Optional[WorkflowState]:
        """Get the current state of a workflow."""
        return self._states.get(request_id)
