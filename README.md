# Project Intake

AI Task Force intake: file a request, review and edit the request list, get a suggested intake type (AI, Data, Analytics, or Other) and see likely duplicates.

## Data and resources

| What | Where |
|------|-------|
| Requests | Lakebase Autoscaling project `project-intake`, branch `production`, table `project_intake.projects` (schema created and owned by the app service principal) |
| Request ids | Sequence `project_intake.project_req_seq` (`REQ-####`), realigned to the highest id on every start |
| Intake-type classification | `ai_classify` on the `sql-warehouse` app resource; falls back to keyword heuristics if the call fails |
| Sample data | Off by default. Set `PROJECT_INTAKE_SEED_SAMPLE_DATA` to `"1"` in `app.yml` to load the sample requests into an **empty** table (demo workspaces) |

`app.yml` maps `LAKEBASE_ENDPOINT` and `DATABRICKS_SQL_WAREHOUSE_ID` from the app resources; `PGHOST`/`PGUSER`/`PGDATABASE` are injected by the `postgres` resource. The app refuses to start without a database.

## Deploy

The bundle carries no workspace details. Choose the workspace with a CLI profile and pass a SQL warehouse id:

```bash
export DATABRICKS_CONFIG_PROFILE=<your-profile>
export BUNDLE_VAR_warehouse_id=<warehouse-id>

databricks bundle deploy -t dev            # or -t prod (deploys under /Workspace/Shared)
databricks bundle run project-intake-app -t dev
```

The first deploy creates the Lakebase project `project-intake` (override with `--var lakebase_project_id=...`). It is protected with `prevent_destroy`.

If the workspace already has the project (or a migrated Lakebase Provisioned instance of the same name), bind it instead of creating a new one:

```bash
databricks bundle deployment bind project-intake-db projects/project-intake
```

Always deploy before running locally, so the service principal (not you) owns the `project_intake` schema.

## Local preview

Uses your own Lakebase identity (project owners already have access):

```bash
export DATABRICKS_CONFIG_PROFILE=<your-profile>
export LAKEBASE_ENDPOINT=projects/project-intake/branches/production/endpoints/primary
export DATABRICKS_SQL_WAREHOUSE_ID=<warehouse-id>   # optional, enables ai_classify

# backend
PYTHONPATH=src .venv/bin/uvicorn project_intake.backend.app:app --reload --host 127.0.0.1 --port 8000

# frontend
apx bun x vite --config vite.config.ts
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## 🛠️ Tech Stack

This application leverages a powerful, modern tech stack:

- **Backend** 🐍 Python + [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend** ⚛️ React + [shadcn/ui](https://ui.shadcn.com/)
- **API Client** 🔄 Auto-generated TypeScript client from OpenAPI schema

## 🚀 Quick Start

### Development Mode

Start all development servers (backend, frontend, and OpenAPI watcher) in detached mode:

```bash
apx dev start
```

This will start an apx development server, which in it's turn runs backend, frontend and OpenAPI watcher.
All servers run in the background, with logs kept in-memory of the apx dev server.

### 📊 Monitoring & Logs

```bash
# View all logs
apx dev logs

# Stream logs in real-time
apx dev logs -f

# Check server status
apx dev status

# Stop all servers
apx dev stop
```

## ✅ Code Quality

Run type checking and linting for both TypeScript and Python:

```bash
apx dev check
```

## 📦 Build

Create a production-ready build:

```bash
apx build
```

## 🚢 Deployment

Deploy to Databricks:

```bash
databricks bundle deploy -p <your-profile>
```

---

<p align="center">Built with ❤️ using <a href="https://github.com/databricks-solutions/apx">apx</a></p>
