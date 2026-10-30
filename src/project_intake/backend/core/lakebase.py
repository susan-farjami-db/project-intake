"""Lakebase Autoscaling integration: config, engine, session, and dependency."""

from __future__ import annotations

import os
from collections.abc import Generator
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Annotated, AsyncGenerator, TypeAlias

from databricks.sdk import WorkspaceClient
from fastapi import FastAPI, Request
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import Engine, create_engine, event
from sqlmodel import Session, SQLModel, text

from ._base import LifespanDependency
from ._config import logger

# Arbitrary app-wide key: serializes schema setup and seeding across uvicorn workers.
INIT_LOCK_KEY = 7_340_001


# --- Database Config ---


class DatabaseConfig(BaseSettings):
    """Connection settings. On Databricks Apps the `postgres` resource injects PGHOST,
    PGPORT, PGDATABASE and PGUSER; app.yml maps LAKEBASE_ENDPOINT from the same resource."""

    model_config = SettingsConfigDict(env_prefix="")

    endpoint: str = Field(
        description="Endpoint resource path (projects/<p>/branches/<b>/endpoints/<e>)",
        validation_alias="LAKEBASE_ENDPOINT",
    )
    host: str | None = Field(default=None, validation_alias="PGHOST")
    port: int = Field(default=5432, validation_alias="PGPORT")
    database_name: str = Field(default="databricks_postgres", validation_alias="PGDATABASE")
    user: str | None = Field(default=None, validation_alias="PGUSER")


# --- Credentials ---


class _CredentialCache:
    """OAuth database tokens last 1h; reuse one until 5 minutes before expiry."""

    def __init__(self, ws: WorkspaceClient, endpoint: str) -> None:
        self._ws = ws
        self._endpoint = endpoint
        self._lock = Lock()
        self._token: str | None = None
        self._expires_at = datetime.min.replace(tzinfo=timezone.utc)

    def token(self) -> str:
        with self._lock:
            now = datetime.now(timezone.utc)
            if self._token is None or now >= self._expires_at - timedelta(minutes=5):
                cred = self._ws.postgres.generate_database_credential(endpoint=self._endpoint)
                self._token = cred.token
                expire = getattr(cred, "expire_time", None)
                if isinstance(expire, datetime):
                    self._expires_at = expire if expire.tzinfo else expire.replace(tzinfo=timezone.utc)
                else:
                    self._expires_at = now + timedelta(minutes=55)
            return self._token  # type: ignore[return-value]


# --- Engine creation ---


def _get_dev_db_port() -> int | None:
    """Check for APX_DEV_DB_PORT environment variable for local development."""
    port = os.environ.get("APX_DEV_DB_PORT")
    return int(port) if port else None


def _create_dev_engine(dev_port: int) -> Engine:
    logger.info(f"Using local dev database at localhost:{dev_port}")
    password = os.environ.get("APX_DEV_DB_PWD")
    if password is None:
        raise ValueError("APX server didn't provide a password, please check the dev server logs")
    url = f"postgresql+psycopg://postgres:{password}@localhost:{dev_port}/postgres?sslmode=disable"
    return create_engine(url, pool_size=4, pool_pre_ping=True)


def create_db_engine(db_config: DatabaseConfig, ws: WorkspaceClient) -> Engine:
    """Create a SQLAlchemy engine against a Lakebase Autoscaling endpoint.

    Every new pooled connection gets a (cached) OAuth token as its password.
    """
    host = db_config.host or ws.postgres.get_endpoint(db_config.endpoint).status.hosts.host
    username = db_config.user or ws.config.client_id or ws.current_user.me().user_name
    logger.info(f"Using Lakebase endpoint {db_config.endpoint} ({host}) as {username}")

    url = f"postgresql+psycopg://{username}:@{host}:{db_config.port}/{db_config.database_name}"
    engine = create_engine(
        url,
        pool_size=4,
        max_overflow=4,
        # Scale-to-zero and the 24h idle cutoff both drop connections; recycle well inside the token TTL.
        pool_pre_ping=True,
        pool_recycle=45 * 60,
        connect_args={"sslmode": "require"},
    )
    credentials = _CredentialCache(ws, db_config.endpoint)

    @event.listens_for(engine, "do_connect")
    def _inject_token(dialect, conn_rec, cargs, cparams):
        cparams["password"] = credentials.token()

    return engine


def validate_db(engine: Engine) -> None:
    """Validate that the database connection works."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        raise ConnectionError(f"Failed to connect to Lakebase: {e}") from e
    logger.info("Lakebase connection validated")


def initialize_models(engine: Engine) -> None:
    """Create app-owned schemas and all SQLModel tables (idempotent, one worker at a time)."""
    schemas = {t.schema for t in SQLModel.metadata.tables.values() if t.schema}
    with engine.begin() as conn:
        conn.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": INIT_LOCK_KEY})
        for schema in sorted(schemas):
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
        SQLModel.metadata.create_all(conn)
    logger.info("Database models initialized")


# --- Dependency ---


class _LakebaseDependency(LifespanDependency):
    @asynccontextmanager
    async def lifespan(self, app: FastAPI) -> AsyncGenerator[None, None]:
        dev_port = _get_dev_db_port()
        if dev_port:
            engine = _create_dev_engine(dev_port)
        else:
            if not os.environ.get("LAKEBASE_ENDPOINT"):
                raise RuntimeError(
                    "LAKEBASE_ENDPOINT is not set. On Databricks Apps attach the `postgres` resource "
                    "and map it in app.yml; locally export LAKEBASE_ENDPOINT (and optionally PGHOST)."
                )
            ws = app.state.workspace_client or WorkspaceClient()
            engine = create_db_engine(DatabaseConfig(), ws)  # ty: ignore[missing-argument]

        validate_db(engine)
        initialize_models(engine)

        app.state.engine = engine
        yield
        engine.dispose()

    @staticmethod
    def __call__(request: Request) -> Generator[Session, None, None]:
        with Session(bind=request.app.state.engine) as session:
            yield session


LakebaseDependency: TypeAlias = Annotated[Session, _LakebaseDependency.depends()]
