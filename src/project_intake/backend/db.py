"""Lakebase tables. The app's service principal creates and owns DB_SCHEMA on first start."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Sequence, Text
from sqlmodel import Field, SQLModel

DB_SCHEMA = os.environ.get("PROJECT_INTAKE_DB_SCHEMA", "project_intake")

# Backs new REQ-#### ids; realigned to the highest existing id at startup.
req_id_seq = Sequence("project_req_seq", schema=DB_SCHEMA, start=1001, metadata=SQLModel.metadata)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _text(default: str = "") -> Column:
    return Column(Text, nullable=False, server_default=default)


class ProjectRow(SQLModel, table=True):
    __tablename__ = "projects"
    __table_args__ = {"schema": DB_SCHEMA}

    id: str = Field(primary_key=True)
    request_title: str = Field(sa_column=_text())
    business_dept: str = Field(default="", sa_column=_text())
    requestor: str = Field(sa_column=_text())
    current_process: str = Field(default="", sa_column=_text())
    problem_statement: str = Field(default="", sa_column=_text())
    estimated_user_population: str = Field(default="", sa_column=_text())
    expected_benefit: str = Field(default="", sa_column=_text())
    solution_summary: str = Field(default="", sa_column=_text())
    solution_type: str = Field(sa_column=_text())
    systems_data_involved: str = Field(default="", sa_column=_text())
    notes: str = Field(default="", sa_column=_text())
    links: str = Field(default="", sa_column=_text())
    readiness_score: str = Field(default="", sa_column=_text())
    strategic_alignment: str = Field(default="", sa_column=_text())
    effort_estimate: str = Field(default="", sa_column=_text())
    sensitive_data: str = Field(default="N", sa_column=_text("N"))
    executive_sponsor: str = Field(default="", sa_column=_text())
    desired_timeframe: str = Field(default="", sa_column=_text())
    status: str = Field(default="New", sa_column=_text("New"))
    intake_type: str = Field(sa_column=_text())
    intake_type_source: str = Field(sa_column=_text())
    submitted_at: datetime = Field(
        default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False, index=True)
    )
    # Audit columns (not exposed through the API)
    created_by: str = Field(default="", sa_column=_text())
    updated_by: str = Field(default="", sa_column=_text())
    updated_at: datetime = Field(
        default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
