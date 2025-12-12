"""
PDF Generator Agent for creating embassy-ready documents.
Uses WeasyPrint for high-quality PDF rendering with Arabic RTL support.
"""

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from jinja2 import Environment, BaseLoader

from src.agents.base import BaseAgent
from src.agents.state import WorkflowState
from src.config.settings import get_settings


settings = get_settings()


@dataclass
class PDFResult:
    """Result of PDF generation."""
    application_pdf: str
    checklist_pdf: str
    generated_at: str


# HTML template for visa application
APPLICATION_TEMPLATE = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');

        * {
            font-family: 'Noto Sans Arabic', 'Arial', sans-serif;
            box-sizing: border-box;
        }

        body {
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 20px;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
        }

        .ltr {
            direction: ltr;
            text-align: left;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1E9B63;
        }

        .header h1 {
            color: #1E9B63;
            margin: 0;
            font-size: 24pt;
        }

        .header .subtitle {
            color: #666;
            font-size: 14pt;
            margin-top: 10px;
        }

        .section {
            margin-bottom: 25px;
        }

        .section h2 {
            color: #1E9B63;
            font-size: 16pt;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .info-item {
            padding: 8px;
            background: #f9f9f9;
            border-radius: 4px;
        }

        .info-label {
            font-weight: 600;
            color: #555;
            font-size: 10pt;
        }

        .info-value {
            font-size: 12pt;
            margin-top: 4px;
        }

        .traveler-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #fff;
        }

        .traveler-name {
            font-size: 14pt;
            font-weight: 700;
            color: #1E9B63;
            margin-bottom: 10px;
        }

        .requirement-list {
            list-style: none;
            padding: 0;
        }

        .requirement-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }

        .requirement-item:last-child {
            border-bottom: none;
        }

        .status-matched {
            color: #1E9B63;
            font-weight: 600;
        }

        .status-missing {
            color: #dc2626;
            font-weight: 600;
        }

        .status-partial {
            color: #f59e0b;
            font-weight: 600;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #888;
            font-size: 10pt;
        }

        @media print {
            body {
                padding: 0;
            }
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>طلب تأشيرة - {{ country_name }}</h1>
        <div class="subtitle">Visa Application Request</div>
        <div class="ltr" style="font-size: 10pt; color: #888; margin-top: 10px;">
            Request ID: {{ request_id }} | Generated: {{ generated_at }}
        </div>
    </div>

    <div class="section">
        <h2>معلومات الطلب | Application Details</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">الوجهة | Destination</div>
                <div class="info-value">{{ country_name }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">نوع التأشيرة | Visa Type</div>
                <div class="info-value">{{ visa_type }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">عدد المسافرين | Travelers</div>
                <div class="info-value">{{ travelers|length }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">تاريخ الطلب | Request Date</div>
                <div class="info-value ltr">{{ started_at[:10] }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>المسافرون | Travelers</h2>
        {% for traveler in travelers %}
        <div class="traveler-card">
            <div class="traveler-name">{{ traveler.name_ar or traveler.name }}</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">صلة القرابة | Relationship</div>
                    <div class="info-value">{{ traveler.relationship_ar or traveler.relationship }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">رقم الهوية | ID Number</div>
                    <div class="info-value ltr">{{ traveler.id_number }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">انتهاء الجواز | Passport Expiry</div>
                    <div class="info-value ltr">{{ traveler.passport_expiry }}</div>
                </div>
            </div>
        </div>
        {% endfor %}
    </div>

    <div class="section">
        <h2>حالة المتطلبات | Requirements Status</h2>
        <ul class="requirement-list">
            {% for result in match_results %}
            <li class="requirement-item">
                <span>{% for req in requirements if req.id == result.requirement_id %}{{ req.description_ar or req.description_en }}{% endfor %}</span>
                <span class="status-{{ result.status }}">
                    {% if result.status == 'matched' %}مكتمل{% elif result.status == 'partial' %}جزئي{% else %}ناقص{% endif %}
                </span>
            </li>
            {% endfor %}
        </ul>
    </div>

    {% if missing_requirements %}
    <div class="section">
        <h2>المتطلبات الناقصة | Missing Requirements</h2>
        <ul class="requirement-list">
            {% for req_id in missing_requirements %}
            <li class="requirement-item">
                <span>{% for req in requirements if req.id == req_id %}{{ req.description_ar or req.description_en }}{% endfor %}</span>
                <span class="status-missing">مطلوب</span>
            </li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <div class="footer">
        <p>تم إنشاء هذا المستند تلقائياً بواسطة نظام أبشر للتأشيرات</p>
        <p class="ltr">Generated by Absher Visa System</p>
    </div>
</body>
</html>
"""


# HTML template for checklist
CHECKLIST_TEMPLATE = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');

        * {
            font-family: 'Noto Sans Arabic', 'Arial', sans-serif;
            box-sizing: border-box;
        }

        body {
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 20px;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #1E9B63;
            margin: 0;
        }

        .category {
            margin-bottom: 25px;
        }

        .category h2 {
            color: #1E9B63;
            font-size: 14pt;
            margin-bottom: 10px;
        }

        .checklist {
            list-style: none;
            padding: 0;
        }

        .checklist-item {
            display: flex;
            align-items: flex-start;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }

        .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #1E9B63;
            border-radius: 4px;
            margin-left: 15px;
            flex-shrink: 0;
        }

        .checkbox.checked {
            background: #1E9B63;
        }

        .checkbox.checked::after {
            content: "✓";
            color: white;
            font-size: 14px;
            display: flex;
            justify-content: center;
        }

        .item-content {
            flex: 1;
        }

        .item-title {
            font-weight: 600;
        }

        .item-details {
            font-size: 10pt;
            color: #666;
            margin-top: 4px;
        }

        .mandatory {
            color: #dc2626;
            font-size: 10pt;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            color: #888;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>قائمة المستندات المطلوبة</h1>
        <p>Document Checklist - {{ country_name }}</p>
        <p style="font-size: 10pt; color: #666;">{{ travelers|join(', ') }}</p>
    </div>

    {% for category, reqs in categories.items() %}
    <div class="category">
        <h2>{{ category }}</h2>
        <ul class="checklist">
            {% for req in reqs %}
            <li class="checklist-item">
                <div class="checkbox {% if req.id not in missing %}checked{% endif %}"></div>
                <div class="item-content">
                    <div class="item-title">
                        {{ req.description_ar or req.description_en }}
                        {% if req.is_mandatory %}<span class="mandatory">*</span>{% endif %}
                    </div>
                    <div class="item-details">{{ req.description_en }}</div>
                    {% if req.specifications %}
                    <div class="item-details">
                        {% for key, value in req.specifications.items() %}
                        {{ key }}: {{ value }}{% if not loop.last %}, {% endif %}
                        {% endfor %}
                    </div>
                    {% endif %}
                </div>
            </li>
            {% endfor %}
        </ul>
    </div>
    {% endfor %}

    <div class="footer">
        <p>* المستندات المطلوبة إلزامية | * Mandatory documents are required</p>
        <p>تم إنشاؤه في: {{ generated_at }}</p>
    </div>
</body>
</html>
"""


class PDFGeneratorAgent(BaseAgent[WorkflowState, PDFResult]):
    """
    Generates embassy-ready PDF documents with Arabic RTL support.
    Uses WeasyPrint for high-quality PDF rendering.
    """

    def __init__(self):
        super().__init__("PDFGeneratorAgent")
        self.jinja_env = Environment(loader=BaseLoader())

    async def execute(
        self,
        state: WorkflowState,
    ) -> PDFResult:
        """Generate application and checklist PDFs."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M")

        output_dir = Path(settings.storage_local_path) / state["request_id"]
        output_dir.mkdir(parents=True, exist_ok=True)

        # Generate application PDF
        application_path = output_dir / f"application_{timestamp}.pdf"
        await self._generate_application_pdf(state, application_path, generated_at)

        # Generate checklist PDF
        checklist_path = output_dir / f"checklist_{timestamp}.pdf"
        await self._generate_checklist_pdf(state, checklist_path, generated_at)

        return PDFResult(
            application_pdf=str(application_path),
            checklist_pdf=str(checklist_path),
            generated_at=datetime.utcnow().isoformat(),
        )

    async def _generate_application_pdf(
        self,
        state: WorkflowState,
        output_path: Path,
        generated_at: str,
    ) -> None:
        """Generate the main visa application PDF."""
        template = self.jinja_env.from_string(APPLICATION_TEMPLATE)

        html_content = template.render(
            request_id=state["request_id"],
            country_name=state["country_name_ar"] or state["country_id"].upper(),
            visa_type=state["visa_type"],
            travelers=state["travelers"],
            requirements=state["requirements"],
            match_results=state["match_results"],
            missing_requirements=state["missing_requirements"],
            started_at=state["started_at"],
            generated_at=generated_at,
        )

        await self._render_pdf(html_content, output_path)
        self.log_info(f"Generated application PDF: {output_path}")

    async def _generate_checklist_pdf(
        self,
        state: WorkflowState,
        output_path: Path,
        generated_at: str,
    ) -> None:
        """Generate document checklist PDF."""
        template = self.jinja_env.from_string(CHECKLIST_TEMPLATE)

        # Categorize requirements
        categories = self._categorize_requirements(state["requirements"])

        # Get traveler names
        traveler_names = [
            t.get("name_ar") or t.get("name", "")
            for t in state["travelers"]
        ]

        html_content = template.render(
            request_id=state["request_id"],
            country_name=state["country_name_ar"] or state["country_id"].upper(),
            travelers=traveler_names,
            categories=categories,
            missing=state["missing_requirements"],
            generated_at=generated_at,
        )

        await self._render_pdf(html_content, output_path)
        self.log_info(f"Generated checklist PDF: {output_path}")

    async def _render_pdf(self, html_content: str, output_path: Path) -> None:
        """Render HTML to PDF using WeasyPrint."""
        try:
            from weasyprint import HTML
            HTML(string=html_content).write_pdf(str(output_path))
        except ImportError:
            self.log_warning("WeasyPrint not available, saving as HTML")
            # Fallback: save as HTML
            html_path = output_path.with_suffix(".html")
            html_path.write_text(html_content, encoding="utf-8")

    def _categorize_requirements(
        self,
        requirements: list,
    ) -> dict[str, list]:
        """Group requirements by category."""
        category_names = {
            "personal_documents": "المستندات الشخصية | Personal Documents",
            "financial": "المستندات المالية | Financial Documents",
            "travel": "وثائق السفر | Travel Documents",
            "accommodation": "الإقامة | Accommodation",
            "employment": "التوظيف | Employment",
            "application": "نماذج الطلب | Application Forms",
            "other": "أخرى | Other",
        }

        categories: dict[str, list] = {}
        for req in requirements:
            cat_key = req.get("category", "other")
            cat_name = category_names.get(cat_key, category_names["other"])

            if cat_name not in categories:
                categories[cat_name] = []
            categories[cat_name].append(req)

        return categories
