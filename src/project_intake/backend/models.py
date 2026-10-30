from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from .. import __version__

Status = Literal[
    "New",
    "Initial review completed",
    "Ready for prioritization",
    "Prioritized",
    "Moved to active mission",
]
SensitiveData = Literal["Y", "N"]
EffortEstimate = Literal["", "S", "M", "L"]
StrategicAlignment = Literal["", "Strategic Initiative", "Annual Goal"]
IntakeType = Literal["AI", "Data", "Analytics", "Other"]
ClassifySource = Literal["ai_classify", "heuristic"]


class VersionOut(BaseModel):
    version: str

    @classmethod
    def from_metadata(cls):
        return cls(version=__version__)


class CurrentUserOut(BaseModel):
    id: str
    user_name: str
    display_name: str
    active: bool = True
    name: dict[str, str] | None = None
    emails: list[dict[str, str | bool]] = Field(default_factory=list)
    roles: list[dict[str, str]] = Field(default_factory=list)
    groups: list[dict[str, str]] = Field(default_factory=list)
    entitlements: list[dict[str, str]] = Field(default_factory=list)
    external_id: str | None = None


class ProjectOut(BaseModel):
    id: str
    request_title: str
    business_dept: str
    requestor: str
    current_process: str
    problem_statement: str
    estimated_user_population: str
    expected_benefit: str
    solution_summary: str
    solution_type: str
    systems_data_involved: str
    notes: str
    links: str
    readiness_score: str = ""
    strategic_alignment: StrategicAlignment = ""
    effort_estimate: EffortEstimate = ""
    sensitive_data: SensitiveData
    executive_sponsor: str
    desired_timeframe: str
    status: Status
    intake_type: IntakeType
    intake_type_source: ClassifySource
    submitted_at: datetime


class ProjectIn(BaseModel):
    request_title: str
    business_dept: str = ""
    requestor: str
    current_process: str = ""
    problem_statement: str = ""
    estimated_user_population: str = ""
    expected_benefit: str = ""
    solution_summary: str = ""
    solution_type: str
    systems_data_involved: str = ""
    notes: str = ""
    links: str = ""
    readiness_score: str = ""
    strategic_alignment: StrategicAlignment = ""
    effort_estimate: EffortEstimate = ""
    sensitive_data: SensitiveData = "N"
    executive_sponsor: str = ""
    desired_timeframe: str = ""
    status: Status = "New"
    acknowledge_duplicates: bool = False


class ProjectUpdate(BaseModel):
    request_title: str | None = None
    business_dept: str | None = None
    requestor: str | None = None
    current_process: str | None = None
    problem_statement: str | None = None
    estimated_user_population: str | None = None
    expected_benefit: str | None = None
    solution_summary: str | None = None
    solution_type: str | None = None
    systems_data_involved: str | None = None
    notes: str | None = None
    links: str | None = None
    readiness_score: str | None = None
    strategic_alignment: StrategicAlignment | None = None
    effort_estimate: EffortEstimate | None = None
    sensitive_data: SensitiveData | None = None
    executive_sponsor: str | None = None
    desired_timeframe: str | None = None
    status: Status | None = None
    reclassify: bool = False


class DuplicateMatchOut(BaseModel):
    project: ProjectOut
    score: int
    band: Literal["likely", "possible"]
    reasons: list[str]


class DuplicateScanIn(BaseModel):
    request_title: str = ""
    problem_statement: str = ""
    solution_summary: str = ""
    business_dept: str = ""
    solution_type: str = ""
    exclude_id: str | None = None


class DuplicateScanOut(BaseModel):
    matches: list[DuplicateMatchOut]
    scanned_count: int


class DuplicateClusterOut(BaseModel):
    id: str
    label: str
    score: int
    projects: list[ProjectOut]


class CatalogOut(BaseModel):
    statuses: list[str]
    solution_types: list[str]
    intake_types: list[str]
    sensitive_data: list[str]
    strategic_alignments: list[str]
    effort_estimates: list[str]
    data_note: str


class ProjectListOut(BaseModel):
    items: list[ProjectOut]
    total: int
    likely_duplicate_pairs: int
    mock_data: bool = True


class ClassifyIn(BaseModel):
    request_title: str = ""
    problem_statement: str = ""
    solution_summary: str = ""
    solution_type: str = ""
    systems_data_involved: str = ""


class ClassifyOut(BaseModel):
    intake_type: IntakeType
    source: ClassifySource
