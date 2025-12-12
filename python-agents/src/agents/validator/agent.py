"""
Validation Agent for document verification.
Validates documents against embassy specifications using OCR and rules.
"""

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Literal, Optional

from src.agents.base import BaseAgent
from src.agents.state import DocumentInfo, RequirementInfo
from src.config.settings import get_settings


settings = get_settings()


@dataclass
class ValidatorResult:
    """Result from a single document validator."""
    status: Literal["valid", "invalid", "warning"]
    errors: list[str]
    warnings: list[str]
    extracted_text: str = ""


@dataclass
class ValidationResult:
    """Result of document validation."""
    validated_documents: list[DocumentInfo]
    errors: list[str]
    warnings: list[str]
    all_valid: bool


class ValidationAgent(BaseAgent[dict, ValidationResult]):
    """
    Validates documents against embassy specifications.
    Uses OCR for text extraction and rule-based validation.
    """

    # Supported file extensions
    SUPPORTED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".bmp"}

    # Maximum file sizes (in MB)
    MAX_FILE_SIZES = {
        "default": 10,
        "photo": 2,
        "passport": 5,
    }

    def __init__(self):
        super().__init__("ValidationAgent")
        self._ocr = None

    def _get_ocr(self):
        """Lazy load PaddleOCR."""
        if self._ocr is None:
            try:
                from paddleocr import PaddleOCR
                self._ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang="ar",  # Arabic support
                    use_gpu=settings.ocr_use_gpu,
                    show_log=False,
                )
                self.log_info("PaddleOCR initialized")
            except ImportError:
                self.log_warning("PaddleOCR not available")
                return None
        return self._ocr

    async def execute(
        self,
        documents: list[DocumentInfo],
        requirements: list[RequirementInfo],
    ) -> ValidationResult:
        """Validate all documents against requirements."""
        validated_docs: list[DocumentInfo] = []
        all_errors: list[str] = []
        all_warnings: list[str] = []

        # Build requirement specs lookup
        specs_by_type: dict[str, dict] = {
            req.get("document_type", ""): req.get("specifications", {})
            for req in requirements
            if req.get("document_type")
        }

        for doc in documents:
            doc_type = doc.get("type", "")
            specs = specs_by_type.get(doc_type, {})

            result = await self._validate_document(doc, specs)

            # Update document with validation status
            validated_doc: DocumentInfo = {
                **doc,
                "validation_status": result.status,
                "validation_errors": result.errors,
                "extracted_text": result.extracted_text or doc.get("extracted_text"),
            }
            validated_docs.append(validated_doc)

            # Collect errors/warnings with document context
            for error in result.errors:
                all_errors.append(f"[{doc_type}] {error}")
            for warning in result.warnings:
                all_warnings.append(f"[{doc_type}] {warning}")

        return ValidationResult(
            validated_documents=validated_docs,
            errors=all_errors,
            warnings=all_warnings,
            all_valid=len(all_errors) == 0,
        )

    async def validate_single(
        self,
        document: dict,
        country_id: str,
    ) -> ValidatorResult:
        """Validate a single document (for API endpoint)."""
        doc_info: DocumentInfo = {
            "id": document.get("id", ""),
            "type": document.get("type", ""),
            "file_path": document.get("file_path", ""),
            "traveler_id": document.get("traveler_id"),
            "extracted_text": None,
            "validation_status": "pending",
            "validation_errors": [],
        }

        return await self._validate_document(doc_info, {})

    async def _validate_document(
        self,
        document: DocumentInfo,
        specifications: dict,
    ) -> ValidatorResult:
        """Validate a single document."""
        errors: list[str] = []
        warnings: list[str] = []
        extracted_text = ""

        file_path = Path(document.get("file_path", ""))

        # Check file exists
        if not file_path.exists():
            errors.append(f"File not found: {file_path.name}")
            return ValidatorResult(
                status="invalid",
                errors=errors,
                warnings=warnings,
            )

        # Check file extension
        if file_path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
            errors.append(f"Unsupported file type: {file_path.suffix}")
            return ValidatorResult(
                status="invalid",
                errors=errors,
                warnings=warnings,
            )

        # Check file size
        doc_type = document.get("type", "default")
        max_size_mb = specifications.get(
            "max_size_mb",
            self.MAX_FILE_SIZES.get(doc_type, self.MAX_FILE_SIZES["default"])
        )
        file_size_mb = file_path.stat().st_size / (1024 * 1024)

        if file_size_mb > max_size_mb:
            errors.append(f"File size ({file_size_mb:.1f}MB) exceeds maximum ({max_size_mb}MB)")

        # Extract text with OCR for further validation
        if file_path.suffix.lower() in {".jpg", ".jpeg", ".png", ".tiff", ".bmp"}:
            extracted_text = await self._extract_text(file_path)

        # Type-specific validation
        doc_type = document.get("type", "").lower()

        if doc_type == "passport":
            passport_result = await self._validate_passport(
                file_path, extracted_text, specifications
            )
            errors.extend(passport_result.errors)
            warnings.extend(passport_result.warnings)

        elif doc_type == "photo":
            photo_result = await self._validate_photo(file_path, specifications)
            errors.extend(photo_result.errors)
            warnings.extend(photo_result.warnings)

        elif doc_type == "bank_statement":
            bank_result = await self._validate_bank_statement(
                file_path, extracted_text, specifications
            )
            errors.extend(bank_result.errors)
            warnings.extend(bank_result.warnings)

        # Determine final status
        if errors:
            status = "invalid"
        elif warnings:
            status = "warning"
        else:
            status = "valid"

        return ValidatorResult(
            status=status,
            errors=errors,
            warnings=warnings,
            extracted_text=extracted_text,
        )

    async def _extract_text(self, file_path: Path) -> str:
        """Extract text from document using OCR."""
        ocr = self._get_ocr()
        if not ocr:
            return ""

        try:
            result = ocr.ocr(str(file_path), cls=True)

            if not result or not result[0]:
                return ""

            # Combine all detected text
            texts = []
            for line in result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]
                    texts.append(text)

            return " ".join(texts)

        except Exception as e:
            self.log_error(f"OCR extraction failed: {e}")
            return ""

    async def _validate_passport(
        self,
        file_path: Path,
        extracted_text: str,
        specifications: dict,
    ) -> ValidatorResult:
        """Validate passport document."""
        errors: list[str] = []
        warnings: list[str] = []

        # Check for MRZ (Machine Readable Zone) patterns
        mrz_pattern_found = any(
            pattern in extracted_text.upper()
            for pattern in ["P<", "P<SAU", "<<<"]
        )

        if extracted_text and not mrz_pattern_found:
            warnings.append("Could not detect passport MRZ - ensure clear scan")

        # Check minimum validity if we can extract dates
        min_validity_months = specifications.get("min_validity_months", 6)
        # Note: Actual date extraction would require more sophisticated parsing

        return ValidatorResult(
            status="valid" if not errors else "invalid",
            errors=errors,
            warnings=warnings,
        )

    async def _validate_photo(
        self,
        file_path: Path,
        specifications: dict,
    ) -> ValidatorResult:
        """Validate passport photo."""
        errors: list[str] = []
        warnings: list[str] = []

        try:
            from PIL import Image

            with Image.open(file_path) as img:
                width, height = img.size

                # Check dimensions (typical passport photo is 35x45mm)
                expected_size = specifications.get("size", "35x45mm")
                min_width = 300  # pixels
                min_height = 400  # pixels

                if width < min_width or height < min_height:
                    warnings.append(
                        f"Photo resolution may be too low ({width}x{height}px)"
                    )

                # Check aspect ratio (should be approximately 35:45 = 0.78)
                aspect_ratio = width / height
                if not (0.7 <= aspect_ratio <= 0.85):
                    warnings.append(
                        f"Photo aspect ratio ({aspect_ratio:.2f}) may not match requirements"
                    )

                # Check if image is color
                if img.mode not in ["RGB", "RGBA"]:
                    warnings.append("Photo should be in color")

        except ImportError:
            self.log_warning("PIL not available for photo validation")
        except Exception as e:
            self.log_error(f"Photo validation error: {e}")
            errors.append("Could not validate photo")

        return ValidatorResult(
            status="valid" if not errors else "invalid",
            errors=errors,
            warnings=warnings,
        )

    async def _validate_bank_statement(
        self,
        file_path: Path,
        extracted_text: str,
        specifications: dict,
    ) -> ValidatorResult:
        """Validate bank statement."""
        errors: list[str] = []
        warnings: list[str] = []

        # Check for common bank statement keywords
        keywords_found = any(
            keyword.lower() in extracted_text.lower()
            for keyword in [
                "statement", "balance", "account",
                "كشف حساب", "رصيد", "حساب",
                "bank", "بنك",
            ]
        )

        if extracted_text and not keywords_found:
            warnings.append("Document may not be a valid bank statement")

        # Check for recent dates (within last 3 months typically)
        months_required = specifications.get("months", 3)
        # Note: Actual date validation would require date parsing

        return ValidatorResult(
            status="valid" if not errors else "invalid",
            errors=errors,
            warnings=warnings,
        )
