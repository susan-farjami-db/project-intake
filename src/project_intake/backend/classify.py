from __future__ import annotations

import json
import logging
import os
import re
from typing import TYPE_CHECKING

from .models import ClassifySource, IntakeType

if TYPE_CHECKING:
    from databricks.sdk import WorkspaceClient

logger = logging.getLogger("project_intake")

INTAKE_LABELS: dict[str, str] = {
    "AI": "Machine learning, generative AI, agents, document intelligence, chatbots, OCR, or automated judgment.",
    "Data": "Data products, pipelines, ETL, ingestion, quality, catalogs, or governed tables as the main outcome.",
    "Analytics": "Reporting, dashboards, metrics, Power BI, KPIs, or conversational analytics such as a Genie room.",
    "Other": "Process, UI, workflow, or operations work that is not primarily AI, data platform, or analytics.",
}

SOLUTION_TYPE_HINT: dict[str, IntakeType] = {
    "Agentic AI": "AI",
    "Automation": "Other",
    "Automation (Non-AI)": "Other",
    "Conversational AI": "AI",
    "Data Enablement": "Data",
    "Document AI": "AI",
    "Document AI + Rule-Based": "AI",
    "Document AI + Workflow Automation": "AI",
    "Generative AI": "AI",
    "Language AI": "AI",
    "Predictive Analytics / ML": "AI",
    "Predictive Monitoring + Workflow Automation": "AI",
    "Process Improvement": "Other",
    "Reporting / BI": "Analytics",
    "UI / UX Enhancement": "Other",
    "Genie": "Analytics",
}

_AI_TERMS = {
    "ai",
    "ml",
    "llm",
    "ocr",
    "agent",
    "agentic",
    "chatbot",
    "copilot",
    "generative",
    "predict",
    "classification",
    "extract",
    "document",
    "intelligence",
    "model",
    "nlp",
}
_DATA_TERMS = {
    "pipeline",
    "etl",
    "ingest",
    "lakehouse",
    "catalog",
    "table",
    "governance",
    "quality",
    "warehouse",
    "sync",
    "tms",
}
_ANALYTICS_TERMS = {
    "dashboard",
    "report",
    "reporting",
    "powerbi",
    "metric",
    "kpi",
    "trend",
    "visibility",
    "genie",
    "bi",
}


def classification_text(
    *,
    request_title: str = "",
    problem_statement: str = "",
    solution_summary: str = "",
    solution_type: str = "",
    systems_data_involved: str = "",
) -> str:
    parts = [
        f"Title: {request_title}",
        f"Problem: {problem_statement}",
        f"Solution: {solution_summary}",
        f"Solution type: {solution_type}",
        f"Systems and data: {systems_data_involved}",
    ]
    return "\n".join(part for part in parts if part.split(": ", 1)[-1].strip())


def heuristic_classify(
    text: str,
    solution_type: str = "",
) -> IntakeType:
    hint = SOLUTION_TYPE_HINT.get(solution_type.strip())
    blob = text.lower()
    tokens = set(re.findall(r"[a-z0-9]+", blob))
    scores: dict[IntakeType, int] = {
        "AI": len(tokens & _AI_TERMS),
        "Data": len(tokens & _DATA_TERMS),
        "Analytics": len(tokens & _ANALYTICS_TERMS),
        "Other": 0,
    }
    if hint:
        scores[hint] += 3
    best = max(scores, key=lambda key: scores[key])
    if scores[best] == 0:
        return "Other"
    return best


def _label_from_value(value: object) -> IntakeType | None:
    text = str(value or "").strip()
    if text in INTAKE_LABELS:
        return text  # type: ignore[return-value]
    return None


def classify_with_ai_function(
    ws: WorkspaceClient | None,
    content: str,
) -> IntakeType | None:
    if ws is None or not content.strip():
        return None
    warehouse_id = os.environ.get("DATABRICKS_SQL_WAREHOUSE_ID", "").strip()
    if not warehouse_id:
        return None
    labels = json.dumps(INTAKE_LABELS)
    statement = (
        "SELECT ai_classify(:content, :labels, "
        "map('version', '2.0', 'instructions', :instructions)"
        "):response[0]::STRING AS intake_type"
    )
    try:
        from databricks.sdk.service.sql import StatementParameterListItem

        result = ws.statement_execution.execute_statement(
            warehouse_id=warehouse_id,
            statement=statement,
            wait_timeout="30s",
            parameters=[
                StatementParameterListItem(name="content", value=content[:8000]),
                StatementParameterListItem(name="labels", value=labels),
                StatementParameterListItem(
                    name="instructions",
                    value=(
                        "Classify an AI Task Force intake into exactly one label. "
                        "Use Other when the work is not primarily AI, data platform, or analytics."
                    ),
                ),
            ],
        )
        data = result.result.data_array if result.result else None
        if not data:
            return None
        return _label_from_value(data[0][0])
    except Exception as exc:  # noqa: BLE001 — local demo should still submit
        logger.warning("ai_classify unavailable, using heuristic: %s", exc)
        return None


def classify_intake(
    *,
    ws: WorkspaceClient | None = None,
    request_title: str = "",
    problem_statement: str = "",
    solution_summary: str = "",
    solution_type: str = "",
    systems_data_involved: str = "",
) -> tuple[IntakeType, ClassifySource]:
    text = classification_text(
        request_title=request_title,
        problem_statement=problem_statement,
        solution_summary=solution_summary,
        solution_type=solution_type,
        systems_data_involved=systems_data_involved,
    )
    labeled = classify_with_ai_function(ws, text)
    if labeled:
        return labeled, "ai_classify"
    return heuristic_classify(text, solution_type), "heuristic"
