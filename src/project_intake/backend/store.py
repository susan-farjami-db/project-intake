from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from databricks.sdk import WorkspaceClient
from fastapi import FastAPI
from sqlalchemy import func, or_, select, text
from sqlmodel import Session

from .classify import classify_intake
from .core._base import LifespanDependency
from .core._config import logger
from .core.lakebase import INIT_LOCK_KEY
from .db import DB_SCHEMA, ProjectRow, req_id_seq
from .duplicates import cluster_duplicates, scan_duplicates
from .models import (
    CatalogOut,
    ClassifySource,
    DuplicateClusterOut,
    DuplicateScanIn,
    DuplicateScanOut,
    IntakeType,
    ProjectIn,
    ProjectListOut,
    ProjectOut,
    ProjectUpdate,
)

SOLUTION_TYPES = [
    "Agentic AI",
    "Automation",
    "Automation (Non-AI)",
    "Conversational AI",
    "Data Enablement",
    "Document AI",
    "Document AI + Rule-Based",
    "Document AI + Workflow Automation",
    "Generative AI",
    "Genie",
    "Language AI",
    "Predictive Analytics / ML",
    "Predictive Monitoring + Workflow Automation",
    "Process Improvement",
    "Reporting / BI",
    "UI / UX Enhancement",
]

STATUSES = [
    "New",
    "Initial review completed",
    "Ready for prioritization",
    "Prioritized",
    "Moved to active mission",
]


def _dt(year: int, month: int, day: int) -> datetime:
    return datetime(year, month, day, tzinfo=timezone.utc)


def _seed() -> list[ProjectOut]:
    # Fictional sample requests for demos; not from any real organization.
    return [
        ProjectOut(
            id="REQ-1001",
            request_title="Invoice Data Extraction for Accounts Payable",
            business_dept="Finance",
            requestor="AP team",
            current_process="Clerks key vendor invoice fields into the ERP by hand.",
            problem_statement="Manual entry of ~2,000 invoices a month causes delays and typos.",
            estimated_user_population="6 AP clerks",
            expected_benefit="Faster invoice processing and fewer entry errors.",
            solution_summary="Extract invoice fields with document AI and route low-confidence items for review.",
            solution_type="Document AI",
            systems_data_involved="Vendor invoices (PDF); ERP",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="Q1",
            status="New",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 9, 12),
        ),
        ProjectOut(
            id="REQ-1002",
            request_title="Customer Support Chat Assistant",
            business_dept="Customer Service",
            requestor="Support operations",
            current_process="Agents search several knowledge bases to answer common questions.",
            problem_statement="Average handle time is high for repetitive questions.",
            estimated_user_population="40 support agents",
            expected_benefit="Shorter handle times and more consistent answers.",
            solution_summary="Retrieval-augmented assistant over the support knowledge base.",
            solution_type="Conversational AI",
            systems_data_involved="Knowledge base articles; ticketing system",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="Initial review completed",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 9, 10),
        ),
        ProjectOut(
            id="REQ-1003",
            request_title="Support Knowledge Base Q&A Bot",
            business_dept="Customer Service",
            requestor="Support team lead",
            current_process="Agents ask senior staff in chat when they cannot find an answer.",
            problem_statement="Senior staff are interrupted many times a day with the same questions.",
            estimated_user_population="40 support agents",
            expected_benefit="Fewer interruptions and faster answers.",
            solution_summary="Chatbot that answers agent questions from the knowledge base.",
            solution_type="Conversational AI",
            systems_data_involved="Knowledge base articles",
            links="",
            notes="Likely duplicate of REQ-1002 (sample).",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="New",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 9, 14),
        ),
        ProjectOut(
            id="REQ-1004",
            request_title="Weekly Sales Pipeline Dashboard",
            business_dept="Sales",
            requestor="Sales operations",
            current_process="Analysts build the weekly pipeline deck from spreadsheet exports.",
            problem_statement="Building the deck takes most of a day each week.",
            estimated_user_population="Sales leadership (~15)",
            expected_benefit="Self-serve, always-current pipeline view.",
            solution_summary="AI/BI dashboard on the CRM opportunity tables.",
            solution_type="Reporting / BI",
            systems_data_involved="CRM opportunities; quota table",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="Ready for prioritization",
            intake_type="Analytics",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 8, 28),
        ),
        ProjectOut(
            id="REQ-1005",
            request_title="Demand Forecast for Warehouse Staffing",
            business_dept="Operations",
            requestor="Warehouse planning",
            current_process="Planners estimate staffing from last year's volumes.",
            problem_statement="Over- and under-staffing on peak days.",
            estimated_user_population="12 planners; 4 sites",
            expected_benefit="Better staffing levels and lower overtime.",
            solution_summary="Daily volume forecast per site feeding the staffing plan.",
            solution_type="Predictive Analytics / ML",
            systems_data_involved="Historical order volumes; calendar",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="Q2",
            status="Prioritized",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 8, 20),
        ),
        ProjectOut(
            id="REQ-1006",
            request_title="Order Data Pipeline Consolidation",
            business_dept="Data Platform",
            requestor="Data engineering",
            current_process="Order data lands in three systems with separate nightly jobs.",
            problem_statement="Reports disagree because pipelines run at different times.",
            estimated_user_population="Data team; downstream analysts",
            expected_benefit="One governed order table and fewer broken reports.",
            solution_summary="Consolidate ingestion into a single Lakeflow pipeline with quality checks.",
            solution_type="Data Enablement",
            systems_data_involved="Order management system; ERP; data warehouse",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="Initial review completed",
            intake_type="Data",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 8, 30),
        ),
        ProjectOut(
            id="REQ-1007",
            request_title="Contract Clause Review Assistant",
            business_dept="Legal",
            requestor="Legal operations",
            current_process="Paralegals read contracts to find non-standard clauses.",
            problem_statement="Review backlog of several weeks for routine contracts.",
            estimated_user_population="5 paralegals",
            expected_benefit="Faster first-pass contract review.",
            solution_summary="Flag non-standard clauses against a clause library for attorney review.",
            solution_type="Generative AI",
            systems_data_involved="Contract repository (PDF/DOCX)",
            links="",
            notes="Sample request.",
            sensitive_data="Y",
            executive_sponsor="",
            desired_timeframe="",
            status="New",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 9, 2),
        ),
        ProjectOut(
            id="REQ-1008",
            request_title="Equipment Failure Early Warning",
            business_dept="Maintenance",
            requestor="Fleet maintenance",
            current_process="Maintenance is scheduled on fixed intervals.",
            problem_statement="Unplanned breakdowns cause missed deliveries.",
            estimated_user_population="Maintenance planners",
            expected_benefit="Fewer unplanned breakdowns.",
            solution_summary="Predict failures from sensor readings and open work orders automatically.",
            solution_type="Predictive Monitoring + Workflow Automation",
            systems_data_involved="Sensor telemetry; maintenance system",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="Ready for prioritization",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 8, 25),
        ),
        ProjectOut(
            id="REQ-1009",
            request_title="Overdue Invoice Follow-up Notes",
            business_dept="Finance",
            requestor="Collections team",
            current_process="Collectors type follow-up notes into the billing system one invoice at a time.",
            problem_statement="Updating notes on overdue invoices takes several days each cycle.",
            estimated_user_population="8 collectors",
            expected_benefit="Notes updated automatically and collectors focus on calls.",
            solution_summary="Generate and write follow-up notes from the aging report.",
            solution_type="Automation",
            systems_data_involved="Aging report; billing system",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="New",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 9, 5),
        ),
        ProjectOut(
            id="REQ-1010",
            request_title="Automated Aging Report Updates",
            business_dept="Finance",
            requestor="Collections manager",
            current_process="The aging report is refreshed manually from a billing export.",
            problem_statement="The report is stale by the time it is reviewed.",
            estimated_user_population="Finance leadership",
            expected_benefit="Always-current aging view.",
            solution_summary="Scheduled refresh of the aging report with automatic note updates.",
            solution_type="Automation (Non-AI)",
            systems_data_involved="Billing system; aging report",
            links="",
            notes="Likely duplicate of REQ-1009 (sample).",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="New",
            intake_type="Analytics",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 9, 7),
        ),
        ProjectOut(
            id="REQ-1011",
            request_title="Employee Onboarding Checklist App",
            business_dept="Human Resources",
            requestor="HR operations",
            current_process="Onboarding tasks are tracked in email and spreadsheets.",
            problem_statement="New hires miss steps and equipment arrives late.",
            estimated_user_population="HR team; hiring managers",
            expected_benefit="Consistent onboarding and fewer missed steps.",
            solution_summary="Simple workflow app with task assignment and reminders.",
            solution_type="UI / UX Enhancement",
            systems_data_involved="HR system; IT ticketing",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="Moved to active mission",
            intake_type="Other",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 7, 30),
        ),
        ProjectOut(
            id="REQ-1012",
            request_title="Survey Comment Sentiment Analysis",
            business_dept="Marketing",
            requestor="Customer insights",
            current_process="Analysts read open-text survey comments by hand.",
            problem_statement="Thousands of comments per quarter are never read.",
            estimated_user_population="Insights team",
            expected_benefit="Themes and sentiment from every comment.",
            solution_summary="Classify and summarize comments with AI functions in SQL.",
            solution_type="Language AI",
            systems_data_involved="Survey platform export",
            links="",
            notes="Sample request.",
            sensitive_data="N",
            executive_sponsor="",
            desired_timeframe="",
            status="Initial review completed",
            intake_type="AI",
            intake_type_source="heuristic",
            submitted_at=_dt(2026, 8, 18),
        ),
    ]

_API_FIELDS = tuple(ProjectOut.model_fields)
_NARRATIVE_FIELDS = (
    "request_title",
    "problem_statement",
    "solution_summary",
    "solution_type",
    "systems_data_involved",
)


def _to_out(row: ProjectRow) -> ProjectOut:
    return ProjectOut.model_validate({f: getattr(row, f) for f in _API_FIELDS})


class ProjectStore:
    """Lakebase-backed request catalog. Methods take a request-scoped Session."""

    def catalog(self) -> CatalogOut:
        return CatalogOut(
            statuses=STATUSES,
            solution_types=SOLUTION_TYPES,
            intake_types=["AI", "Data", "Analytics", "Other"],
            sensitive_data=["Y", "N"],
            strategic_alignments=["Strategic Initiative", "Annual Goal"],
            effort_estimates=["S", "M", "L"],
            data_note="AI Task Force requests are saved to Lakebase.",
        )

    def _all(self, session: Session) -> list[ProjectOut]:
        rows = session.scalars(select(ProjectRow).order_by(ProjectRow.submitted_at.desc())).all()
        return [_to_out(r) for r in rows]

    def list(
        self,
        session: Session,
        q: str = "",
        status: str | None = None,
        business_dept: str | None = None,
        intake_type: str | None = None,
        solution_type: str | None = None,
    ) -> ProjectListOut:
        stmt = select(ProjectRow)
        query = q.strip()
        if query:
            pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    ProjectRow.request_title.ilike(pattern),
                    ProjectRow.problem_statement.ilike(pattern),
                    ProjectRow.solution_summary.ilike(pattern),
                    ProjectRow.id.ilike(pattern),
                    ProjectRow.business_dept.ilike(pattern),
                    ProjectRow.requestor.ilike(pattern),
                )
            )
        if status:
            stmt = stmt.where(ProjectRow.status == status)
        if business_dept:
            stmt = stmt.where(ProjectRow.business_dept == business_dept)
        if intake_type:
            stmt = stmt.where(ProjectRow.intake_type == intake_type)
        if solution_type:
            stmt = stmt.where(ProjectRow.solution_type == solution_type)
        items = [_to_out(r) for r in session.scalars(stmt.order_by(ProjectRow.submitted_at.desc())).all()]
        pairs = sum(1 for _score, members in cluster_duplicates(self._all(session)) if members)
        return ProjectListOut(
            items=items,
            total=len(items),
            likely_duplicate_pairs=pairs,
            mock_data=False,
        )

    def get(self, session: Session, project_id: str) -> ProjectOut | None:
        row = session.get(ProjectRow, project_id)
        return _to_out(row) if row else None

    def _classify(self, payload: ProjectIn | ProjectOut, ws: WorkspaceClient | None) -> tuple[IntakeType, ClassifySource]:
        return classify_intake(
            ws=ws,
            request_title=payload.request_title,
            problem_statement=payload.problem_statement,
            solution_summary=payload.solution_summary,
            solution_type=payload.solution_type,
            systems_data_involved=payload.systems_data_involved,
        )

    def create(
        self,
        session: Session,
        payload: ProjectIn,
        ws: WorkspaceClient | None = None,
        actor: str = "",
    ) -> ProjectOut:
        intake_type, source = self._classify(payload, ws)
        next_id = session.scalar(select(req_id_seq.next_value()))
        now = datetime.now(timezone.utc)
        row = ProjectRow(
            id=f"REQ-{next_id}",
            request_title=payload.request_title.strip(),
            business_dept=payload.business_dept.strip(),
            requestor=payload.requestor.strip(),
            current_process=payload.current_process.strip(),
            problem_statement=payload.problem_statement.strip(),
            estimated_user_population=payload.estimated_user_population.strip(),
            expected_benefit=payload.expected_benefit.strip(),
            solution_summary=payload.solution_summary.strip(),
            solution_type=payload.solution_type,
            systems_data_involved=payload.systems_data_involved.strip(),
            notes=payload.notes.strip(),
            links=payload.links.strip(),
            readiness_score=payload.readiness_score.strip(),
            strategic_alignment=payload.strategic_alignment,
            effort_estimate=payload.effort_estimate,
            sensitive_data=payload.sensitive_data,
            executive_sponsor=payload.executive_sponsor.strip(),
            desired_timeframe=payload.desired_timeframe.strip(),
            status=payload.status,
            intake_type=intake_type,
            intake_type_source=source,
            submitted_at=now,
            created_by=actor,
            updated_by=actor,
            updated_at=now,
        )
        session.add(row)
        session.commit()
        session.refresh(row)
        return _to_out(row)

    def update(
        self,
        session: Session,
        project_id: str,
        payload: ProjectUpdate,
        ws: WorkspaceClient | None = None,
        actor: str = "",
    ) -> ProjectOut | None:
        # Row lock so concurrent edits from both workers serialize instead of clobbering.
        row = session.scalars(
            select(ProjectRow).where(ProjectRow.id == project_id).with_for_update()
        ).first()
        if row is None:
            return None
        current = _to_out(row)
        data = current.model_dump()
        updates = payload.model_dump(exclude_unset=True)
        reclassify = bool(updates.pop("reclassify", False))
        for key, value in updates.items():
            if value is not None and isinstance(value, str):
                data[key] = value.strip() if key != "status" else value
            elif value is not None:
                data[key] = value
        updated = ProjectOut(**data)
        narrative_changed = any(getattr(updated, f) != getattr(current, f) for f in _NARRATIVE_FIELDS)
        if reclassify or narrative_changed:
            intake_type, source = self._classify(updated, ws)
            updated = updated.model_copy(update={"intake_type": intake_type, "intake_type_source": source})
        for field in _API_FIELDS:
            if field != "id":
                setattr(row, field, getattr(updated, field))
        row.updated_by = actor
        row.updated_at = datetime.now(timezone.utc)
        session.add(row)
        session.commit()
        session.refresh(row)
        return _to_out(row)

    def scan(self, session: Session, draft: DuplicateScanIn) -> DuplicateScanOut:
        catalog = self._all(session)
        matches = scan_duplicates(draft, catalog)
        return DuplicateScanOut(matches=matches, scanned_count=len(catalog))

    def clusters(self, session: Session) -> list[DuplicateClusterOut]:
        out: list[DuplicateClusterOut] = []
        for index, (score, members) in enumerate(cluster_duplicates(self._all(session)), start=1):
            out.append(
                DuplicateClusterOut(
                    id=f"DUP-{index:02d}",
                    label=members[0].request_title,
                    score=score,
                    projects=members,
                )
            )
        return out


store = ProjectStore()


# --- Startup: sample data + id sequence alignment ---


def _sync_id_sequence(session: Session) -> None:
    """Move the REQ id sequence past every existing numeric REQ-#### id."""
    session.execute(
        text(
            f"""
            SELECT setval(
                '"{DB_SCHEMA}".project_req_seq',
                GREATEST(
                    1000,
                    COALESCE((
                        SELECT max(substring(id FROM 5)::bigint)
                        FROM "{DB_SCHEMA}".projects
                        WHERE id ~ '^REQ-[0-9]+$'
                    ), 0)
                )
            )
            """
        )
    )


def seed_sample_data(session: Session) -> int:
    """Insert the sample requests into an empty table. Returns rows inserted."""
    if session.scalar(select(func.count()).select_from(ProjectRow)):
        return 0
    rows = [ProjectRow(**p.model_dump(), created_by="sample-data", updated_by="sample-data") for p in _seed()]
    session.add_all(rows)
    return len(rows)


class _ProjectDataDependency(LifespanDependency):
    """Runs after the Lakebase lifespan (registered later), so app.state.engine is ready."""

    @asynccontextmanager
    async def lifespan(self, app: FastAPI) -> AsyncGenerator[None, None]:
        with Session(app.state.engine) as session:
            session.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": INIT_LOCK_KEY})
            if os.environ.get("PROJECT_INTAKE_SEED_SAMPLE_DATA") == "1":
                inserted = seed_sample_data(session)
                if inserted:
                    logger.info(f"Seeded {inserted} sample requests into {DB_SCHEMA}.projects")
            _sync_id_sequence(session)
            session.commit()
        yield

    @staticmethod
    def __call__() -> ProjectStore:
        return store
