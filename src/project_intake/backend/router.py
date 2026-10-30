from fastapi import HTTPException, Query

from .classify import classify_intake
from .core import create_router
from .core._headers import DatabricksAppsHeaders
from .core.dependencies import Dependencies
from .models import (
    CatalogOut,
    ClassifyIn,
    ClassifyOut,
    CurrentUserOut,
    DuplicateClusterOut,
    DuplicateScanIn,
    DuplicateScanOut,
    ProjectIn,
    ProjectListOut,
    ProjectOut,
    ProjectUpdate,
    VersionOut,
)
from .store import store

router = create_router()


@router.get("/version", response_model=VersionOut, operation_id="version")
async def version():
    return VersionOut.from_metadata()


@router.get("/current-user", response_model=CurrentUserOut, operation_id="currentUser")
def me(headers: Dependencies.Headers):
    email = headers.user_email or headers.user_name or ""
    display = headers.user_name or email or "Local developer"
    return CurrentUserOut(
        id=headers.user_id or "local",
        user_name=email or "local",
        display_name=display,
        active=True,
        emails=[{"value": email, "primary": True, "type": "work"}] if email else [],
    )


def _actor(headers: DatabricksAppsHeaders) -> str:
    return headers.user_email or headers.user_name or ""


@router.get("/catalog", response_model=CatalogOut, operation_id="getCatalog")
def get_catalog():
    return store.catalog()


@router.post("/projects/classify", response_model=ClassifyOut, operation_id="classifyIntake")
def classify(payload: ClassifyIn, ws: Dependencies.Client):
    intake_type, source = classify_intake(
        ws=ws,
        request_title=payload.request_title,
        problem_statement=payload.problem_statement,
        solution_summary=payload.solution_summary,
        solution_type=payload.solution_type,
        systems_data_involved=payload.systems_data_involved,
    )
    return ClassifyOut(intake_type=intake_type, source=source)


@router.get("/projects", response_model=ProjectListOut, operation_id="listProjects")
def list_projects(
    session: Dependencies.Session,
    q: str = Query(default=""),
    status: str | None = None,
    business_dept: str | None = None,
    intake_type: str | None = None,
    solution_type: str | None = None,
):
    return store.list(
        session,
        q=q,
        status=status,
        business_dept=business_dept,
        intake_type=intake_type,
        solution_type=solution_type,
    )


@router.get(
    "/projects/duplicate-clusters",
    response_model=list[DuplicateClusterOut],
    operation_id="listDuplicateClusters",
)
def list_duplicate_clusters(session: Dependencies.Session):
    return store.clusters(session)


@router.get("/projects/{project_id}", response_model=ProjectOut, operation_id="getProject")
def get_project(project_id: str, session: Dependencies.Session):
    project = store.get(session, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/projects", response_model=ProjectOut, operation_id="createProject")
def create_project(
    payload: ProjectIn,
    ws: Dependencies.Client,
    session: Dependencies.Session,
    headers: Dependencies.Headers,
):
    if not payload.request_title.strip() or not payload.requestor.strip():
        raise HTTPException(status_code=400, detail="Request title and requestor are required")
    if not payload.solution_type.strip():
        raise HTTPException(status_code=400, detail="Solution type is required")
    return store.create(session, payload, ws=ws, actor=_actor(headers))


@router.patch("/projects/{project_id}", response_model=ProjectOut, operation_id="updateProject")
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    ws: Dependencies.Client,
    session: Dependencies.Session,
    headers: Dependencies.Headers,
):
    project = store.update(session, project_id, payload, ws=ws, actor=_actor(headers))
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post(
    "/projects/scan-duplicates",
    response_model=DuplicateScanOut,
    operation_id="scanDuplicates",
)
def scan_duplicates(payload: DuplicateScanIn, session: Dependencies.Session):
    return store.scan(session, payload)
