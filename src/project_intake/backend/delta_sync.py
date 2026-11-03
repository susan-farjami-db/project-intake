"""Best-effort write-through of intake requests from Lakebase to a Unity Catalog Delta table.

Enabled when PROJECT_INTAKE_DELTA_TABLE is set (catalog.schema.table). Lakebase stays the
system of record: every create/update MERGEs the row into Delta on a background thread, and
startup reconciles the full table so rows missed during an outage catch up. Failures are
logged, never raised to the user. The app's service principal needs USE CATALOG, USE SCHEMA,
SELECT and MODIFY on the target (plus CREATE TABLE if the table does not exist yet).
"""

from __future__ import annotations

import os
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any

from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementParameterListItem, StatementState

from .core._config import logger
from .db import ProjectRow

DELTA_TABLE = os.environ.get("PROJECT_INTAKE_DELTA_TABLE", "").strip()

_COLUMNS = tuple(ProjectRow.model_fields)
_TIMESTAMP_COLUMNS = frozenset({"submitted_at", "updated_at"})
_BATCH_SIZE = 10
_RETRIES = 3

# One worker serializes this process's writes, which avoids most concurrent-MERGE conflicts.
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="delta-sync")


def enabled() -> bool:
    return bool(DELTA_TABLE) and bool(os.environ.get("DATABRICKS_SQL_WAREHOUSE_ID", "").strip())


def _quoted_table() -> str:
    return ".".join(f"`{part.strip('`')}`" for part in DELTA_TABLE.split("."))


def _ddl() -> str:
    cols = ",\n  ".join(
        f"{c} {'TIMESTAMP' if c in _TIMESTAMP_COLUMNS else 'STRING'}{' NOT NULL' if c == 'id' else ''}"
        for c in _COLUMNS
    )
    return (
        f"CREATE TABLE IF NOT EXISTS {_quoted_table()} (\n  {cols}\n) "
        "COMMENT 'AI Task Force intake requests, synced from Lakebase by the project-intake app'"
    )


def _merge(rows: list[dict[str, Any]]) -> tuple[str, list[StatementParameterListItem]]:
    params: list[StatementParameterListItem] = []
    tuples = []
    for i, row in enumerate(rows):
        names = []
        for c in _COLUMNS:
            name = f"{c}_{i}"
            value = row.get(c)
            if c in _TIMESTAMP_COLUMNS:
                params.append(
                    StatementParameterListItem(
                        name=name,
                        value=value.isoformat() if isinstance(value, datetime) else value,
                        type="TIMESTAMP",
                    )
                )
            else:
                params.append(StatementParameterListItem(name=name, value="" if value is None else str(value)))
            names.append(f":{name}")
        tuples.append(f"({', '.join(names)})")
    cols = ", ".join(_COLUMNS)
    sets = ", ".join(f"t.{c} = s.{c}" for c in _COLUMNS if c != "id")
    statement = (
        f"MERGE INTO {_quoted_table()} t "
        f"USING (SELECT * FROM VALUES {', '.join(tuples)} AS v({cols})) s "
        "ON t.id = s.id "
        # Guard against an older write landing after a newer one.
        "WHEN MATCHED AND (t.updated_at IS NULL OR s.updated_at >= t.updated_at) THEN UPDATE SET "
        f"{sets} "
        f"WHEN NOT MATCHED THEN INSERT ({cols}) VALUES ({', '.join(f's.{c}' for c in _COLUMNS)})"
    )
    return statement, params


def _execute(ws: WorkspaceClient, statement: str, params: list[StatementParameterListItem] | None = None) -> None:
    warehouse_id = os.environ["DATABRICKS_SQL_WAREHOUSE_ID"].strip()
    for attempt in range(1, _RETRIES + 1):
        resp = ws.statement_execution.execute_statement(
            warehouse_id=warehouse_id, statement=statement, parameters=params, wait_timeout="50s"
        )
        statement_id = resp.statement_id
        state = resp.status.state if resp.status else None
        # Serverless cold starts can outlast wait_timeout; poll until the statement settles.
        while state in (StatementState.PENDING, StatementState.RUNNING):
            time.sleep(2)
            resp = ws.statement_execution.get_statement(statement_id)
            state = resp.status.state if resp.status else None
        if state == StatementState.SUCCEEDED:
            return
        error = resp.status.error.message if resp.status and resp.status.error else state
        if attempt == _RETRIES:
            raise RuntimeError(f"Delta sync statement failed: {error}")
        logger.warning(f"Delta sync attempt {attempt} failed, retrying: {error}")
        time.sleep(2 * attempt)


def _upsert(ws: WorkspaceClient, rows: list[dict[str, Any]]) -> None:
    for start in range(0, len(rows), _BATCH_SIZE):
        _execute(ws, *_merge(rows[start : start + _BATCH_SIZE]))


def row_snapshot(row: ProjectRow) -> dict[str, Any]:
    return {c: getattr(row, c) for c in _COLUMNS}


def submit(ws: WorkspaceClient | None, row: dict[str, Any]) -> None:
    """Queue one row for MERGE into Delta. No-op when sync is disabled."""
    if ws is None or not enabled():
        return

    def _run() -> None:
        try:
            _upsert(ws, [row])
        except Exception as exc:  # noqa: BLE001 — Lakebase already has the row
            logger.warning(f"Delta sync of {row.get('id')} to {DELTA_TABLE} failed: {exc}")

    _executor.submit(_run)


def reconcile(ws: WorkspaceClient | None, rows: list[dict[str, Any]]) -> None:
    """Create the Delta table if needed and MERGE every Lakebase row (background)."""
    if ws is None or not enabled():
        return

    def _run() -> None:
        try:
            _execute(ws, _ddl())
            _upsert(ws, rows)
            logger.info(f"Delta sync reconciled {len(rows)} requests into {DELTA_TABLE}")
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"Delta sync reconcile into {DELTA_TABLE} failed: {exc}")

    _executor.submit(_run)
