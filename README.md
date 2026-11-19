# FlowForge — Multi-Tenant Project Management SaaS

A Jira-like project management platform where every company gets its own isolated
workspace with projects, boards, sprints, issues, comments, role-based permissions,
real-time notifications, and Stripe billing.

Built as a portfolio project to demonstrate production-grade multi-tenant
architecture, security, and modern full-stack engineering.

---

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Quickstart](#quickstart)
- [Development workflow](#development-workflow)
- [Testing](#testing)
- [Security model](#security-model)
- [Multi-tenancy design](#multi-tenancy-design)
- [API](#api)
- [Project structure](#project-structure)
- [Design decisions](#design-decisions)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

### Core
- **Multi-tenant workspaces** — every company is fully isolated with its own
  projects, members, boards, and billing
- **Projects & boards** — organize work with projects (like `ENG`), each with
  boards, columns, and a drag-and-drop Kanban view
- **Sprints** — create, activate, and close time-boxed iterations; incomplete
  work returns to the backlog automatically
- **Issues** — full CRUD with title, description, priority, assignee, tags, and
  per-project key generation (`ENG-42`, `ENG-43`, …)
- **Kanban with optimistic updates** — drag a card between columns; the UI
  updates instantly and reconciles with the server
- **Optimistic concurrency** — moves carry `expected_updated_at`; conflicting
  edits return `409` instead of silently overwriting
- **Comments** — threaded discussion per issue, with notifications to
  assignee and reporter
- **Attachments** — metadata + presigned S3 URLs (bytes never touch Django)
- **History** — `django-simple-history` tracks every issue field change

### Collaboration
- **Inbox** — notification center; assignment and comment events surface here
- **Notification bell** — live unread badge with dropdown preview
- **My Tasks** — every issue assigned to you across all boards
- **Overview** — workspace dashboard with project/task/unread counts

### Access control
- **Role-based permissions** — Owner, Admin, Member, Viewer with a capability
  matrix enforced at the API, service, and DB layers
- **Last-owner protection** — you cannot demote or remove the final workspace
  owner (enforced with `SELECT … FOR UPDATE`)

### Billing
- **Stripe Billing** in test mode — Checkout, Customer Portal, webhook-driven
  subscription state
- **Plan-based limits** — Free (3 projects / 5 members), Pro (50 / 25),
  Enterprise (500 / 200)
- **Local subscription mirror** — billing state is served from your DB, never
  queried live from Stripe on the request path

### Analytics
- **Board reports** — status breakdown, priority mix, workload by assignee,
  completion percentage
- **Timeline** — Gantt-style view of issues over time with day/week navigation

---

## Screenshots

See `docs/screenshots/` for the full set. Highlights:

| | |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Kanban board](docs/screenshots/kanban.png) |
| ![Issue detail](docs/screenshots/issue-detail.png) | ![Reports](docs/screenshots/reports.png) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React + TS)                     │
│  TanStack Query · Zustand · React Router · @dnd-kit              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS (JWT bearer)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Nginx (TLS, static, reverse proxy)             │
└─────┬─────────────────────────────────────────────┬─────────────┘
      │ /api/*                                       │ /static
      ▼                                              ▼
┌─────────────────────────────────────┐   ┌─────────────────┐
│  Django + DRF (Gunicorn)             │   │ React build     │
│  ┌───────────────────────────────┐   │   └─────────────────┘
│  │ Middleware                    │   │
│  │  · CORS · CSP · Security      │   │
│  │  · JWT auth                   │   │
│  │  · Axes (login throttle)      │   │
│  ├───────────────────────────────┤   │
│  │ Views → Services → Models     │   │
│  │ (thin)  (logic)   (domain)    │   │
│  └───────────────────────────────┘   │
└─────┬──────────────────┬─────────────┘
      │                  │
      ▼                  ▼
┌──────────┐      ┌──────────────┐
│ Postgres │      │ Redis        │
│ + trigger│      │ · cache      │
│ for ten. │      │ · celery brk │
│ isolation│      └──────┬───────┘
└──────────┘             │
                         ▼
              ┌────────────────────┐
              │ Celery workers     │
              │ · notifications    │
              │ · future: webhooks │
              └────────────────────┘
```

Full architecture notes and ADRs are in `docs/architecture.md` and `docs/adr/`.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Backend** | Django 5.0, Django REST Framework, Python 3.12 |
| **Database** | PostgreSQL 16 (with `plpgsql` triggers for tenant isolation) |
| **Cache / broker** | Redis 7 |
| **Async tasks** | Celery 5.4 |
| **Auth** | `djangorestframework-simplejwt` — access in body, refresh in HttpOnly cookie |
| **Frontend** | React 18, TypeScript, Vite |
| **Data fetching** | TanStack Query |
| **Client state** | Zustand |
| **Routing** | React Router v6 |
| **Drag-and-drop** | `@dnd-kit/core` + `@dnd-kit/sortable` |
| **Styling** | Tailwind CSS 3 |
| **Billing** | Stripe Billing (test mode) |
| **Containers** | Docker, Docker Compose |
| **CI** | GitHub Actions |
| **Testing** | Pytest, factory-boy (backend); Vitest, RTL (frontend) |

---

## Quickstart

### Prerequisites

- Docker Desktop
- Python 3.12+
- Node.js 20+
- (Optional) Stripe CLI for testing webhooks locally

### Setup

```bash
git clone https://github.com/<your-username>/saas-pm.git
cd saas-pm

# Environment files (two required — Docker reads the root one, Django reads the backend one)
cp .env.example .env
cp .env.example backend/.env

# Backend dependencies
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
cd ..

# Frontend dependencies
cd frontend && npm install && cd ..

# Start databases
docker compose up -d db redis
docker compose ps             # wait for "healthy"

# Migrate and seed
cd backend
python manage.py migrate
python manage.py seed_demo
cd ..
```

### Run

Three terminals:

**Terminal 1 — Databases:**
```bash
docker compose up -d db redis
```

**Terminal 2 — Django:**
```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```

**Terminal 3 — React:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Demo credentials** (created by `seed_demo`):
```
email:    demo@example.com
password: correct-horse-battery
```

---

## Development workflow

### One-time environment

```bash
cp .env.example .env
cp .env.example backend/.env
```

Both files must exist:
- **`.env`** (repo root) — read by Docker Compose for Postgres/Redis credentials
- **`backend/.env`** — read by Django at startup via `load_dotenv(BASE_DIR / ".env")`

### Reset the database

```bash
docker compose down -v          # WIPES ALL DATA
docker compose up -d db redis
cd backend && python manage.py migrate && python manage.py seed_demo
```

### Testing Stripe locally

```bash
# Terminal 4
stripe listen --forward-to localhost:8000/api/v1/billing/webhook/ \
  --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted
```

Copy the printed `whsec_...` into `backend/.env` as `STRIPE_WEBHOOK_SECRET`. Restart Django.

---

## Testing

### Backend

```bash
cd backend
pytest --no-cov -q               # fast: 64 tests in ~4s
pytest --cov=apps --cov=common   # with coverage
```

Coverage targets:
- **100%** on `apps/*/services.py`
- **100%** on tenant isolation tests (every endpoint × foreign workspace → 404)
- **~85%** overall

### Frontend

```bash
cd frontend
npx tsc -p tsconfig.app.json --noEmit    # type-check
npm run lint                              # ESLint
npm run build                             # production build
```

---

## Security model

### Tenant isolation (3 layers)

Every request must prove that the workspace it's operating on belongs to the
authenticated user. This is enforced at three independent layers:

1. **`TenantManager`** — the ORM queryset fails loudly if a tenant-scoped query
   runs without a `workspace_id` filter.
2. **`HasWorkspaceContext` permission** — resolves the request's workspace from
   the URL/header and returns **404** for non-members. Never 403 — a 403 leaks
   existence of the resource.
3. **PostgreSQL trigger** — the database itself rejects any cross-workspace FK
   relationship on `issues_issue`, even if a future code path tries to bypass
   the application layer.

See `docs/adr/0002-shared-schema-tenancy.md` for the full decision record.

### Auth

- **Access token** — short-lived (15 min), sent in the `Authorization: Bearer`
  header. Held **in memory** on the client (never `localStorage`) to defeat XSS.
- **Refresh token** — long-lived (7 days), `HttpOnly; Secure; SameSite=Strict`
  cookie. Rotated on every use; the previous token is blacklisted.
- **Password hashing** — Argon2 (falls back to PBKDF2).
- **Rate limiting** — DRF throttling on auth endpoints; `django-axes` locks out
  after repeated failed logins per IP.

### Other

- **CSRF** — stateless JWT in headers is CSRF-immune; the refresh cookie uses
  `SameSite=Strict`.
- **Webhooks** — Stripe signature verified with `stripe.Webhook.construct_event`.
  Rejects unsigned requests with `400`.
- **File uploads** — MIME allowlist, size cap, presigned S3 URLs, client-supplied
  keys validated against the workspace prefix.
- **CSP** — `django-csp` with a `default-src 'self'` policy.
- **HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff** — enabled in
  `prod.py`.

---

## Multi-tenancy design

**Strategy:** shared database, shared schema, `workspace_id` on every
tenant-scoped table.

**Why this and not schema-per-tenant:**

| | Shared schema | Schema-per-tenant |
|---|---|---|
| **Tenants at 10k** | One migration, one backup | 10k migrations to orchestrate |
| **Cost** | Fits in a single $200/mo instance | Requires schema orchestration |
| **Cross-tenant analytics** | Trivial `GROUP BY workspace_id` | Hard — requires querying N schemas |
| **Migration path** | `django-tenants` for enterprise tier | — |

**Defense-in-depth:** the three isolation layers above mean a bug in one layer
is caught by the next. The composite-FK trigger in Postgres is the "even if
Python is wrong, the database isn't" guarantee.

**Migration to schema-per-tenant (future):** every tenant-scoped model already
has `workspace_id` as a first-class column, and every foreign key carries it.
When an enterprise customer needs physical isolation, the migration path is:

1. Add `django-tenants` and route by workspace slug
2. Move that workspace's rows to a dedicated schema
3. Route requests from `Host` header to the correct schema

No application code changes.

---

## API

The API is versioned at `/api/v1/`. Full OpenAPI 3.1 spec is served at:

- **Swagger UI** — `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc** — `http://localhost:8000/api/schema/redoc/`
- **YAML snapshot** — `docs/api/openapi.yaml` (regenerate with `make schema`)

### Sample endpoints

```
POST   /api/v1/auth/register/                        Create account
POST   /api/v1/auth/login/                           Get JWT pair
POST   /api/v1/auth/refresh/                         Refresh via HttpOnly cookie
GET    /api/v1/me/memberships/                       List workspaces you belong to

GET    /api/v1/workspaces/                           List workspaces
POST   /api/v1/workspaces/                           Create workspace
GET    /api/v1/workspaces/{id}/members/              List members
POST   /api/v1/workspaces/{id}/members/              Invite

GET    /api/v1/workspaces/{id}/projects/             List projects
POST   /api/v1/workspaces/{id}/projects/             Create project (plan limit enforced)
GET    /api/v1/workspaces/{id}/projects/{pid}/boards/
GET    /api/v1/workspaces/{id}/boards/{bid}/issues/  List issues
POST   /api/v1/workspaces/{id}/boards/{bid}/issues/  Create issue
POST   /api/v1/workspaces/{id}/issues/{iid}/move/    Move on Kanban (with concurrency check)
GET    /api/v1/workspaces/{id}/issues/{iid}/history/ Field-level change history

GET    /api/v1/workspaces/{id}/boards/{bid}/reports/ Aggregated analytics
GET    /api/v1/workspaces/{id}/notifications/        Notification inbox
POST   /api/v1/workspaces/{id}/notifications/{nid}/read/

GET    /api/v1/workspaces/{id}/billing/plan/         Current plan + usage
POST   /api/v1/workspaces/{id}/billing/checkout/     Start Stripe Checkout
POST   /api/v1/workspaces/{id}/billing/portal/       Stripe Customer Portal
POST   /api/v1/billing/webhook/                      Stripe webhook (signature-verified)
```

---

## Project structure

```
saas-pm/
├── backend/
│   ├── config/                  Django settings (base/dev/prod/test)
│   ├── common/                  Cross-cutting: exceptions, permissions, managers
│   ├── apps/
│   │   ├── accounts/            User, membership, JWT auth, RBAC
│   │   ├── tenants/             Workspace, plan limits
│   │   ├── projects/            Project CRUD with plan enforcement
│   │   ├── boards/              Board + Column, atomic reorder
│   │   ├── issues/              Issue, Sprint, Comment, Attachment
│   │   ├── notifications/       Notification model + Celery tasks
│   │   ├── billing/             Stripe integration, subscription mirror
│   │   └── analytics/           (scaffolded for future reporting)
│   ├── tests/                   Pytest suite — 64 tests
│   └── requirements/
├── frontend/
│   ├── src/
│   │   ├── components/          Shared UI (Button, Modal, Avatar, …)
│   │   ├── features/            One folder per feature
│   │   ├── lib/                 API client, toast, helpers
│   │   ├── services/            Typed API functions
│   │   ├── store/               Zustand stores (auth, workspace)
│   │   └── types/               Shared TypeScript types
│   └── public/
├── docs/
│   ├── adr/                     Architecture Decision Records
│   ├── api/                     OpenAPI snapshot
│   └── screenshots/
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
├── .github/workflows/           CI: backend, frontend, security
├── docker-compose.yml           Dev orchestration
├── docker-compose.prod.yml      Production orchestration
└── .env.example
```

---

## Design decisions

Six ADRs capture the major architectural choices. Read them before reviewing:

| ADR | Decision |
|---|---|
| [0001](docs/adr/0001-record-architecture-decisions.md) | Use ADRs to record architectural decisions |
| [0002](docs/adr/0002-shared-schema-tenancy.md) | Shared schema + `workspace_id` for tenancy |
| [0003](docs/adr/0003-audit-log-design.md) | Split field history (`simple-history`) from security audit events |

### Why UUIDs everywhere

Every primary key is a UUID v4. This prevents:
- Sequential ID enumeration attacks (`/api/workspaces/1/` → `/api/workspaces/2/`)
- ID collision when merging data from external systems
- Information leakage from ID timestamps or counts

The cost — slightly larger indexes and slower joins — is negligible at this
scale.

### Why a service layer

Business logic lives in `apps/*/services.py`, not in views or serializers. This
makes it:
- **Testable** without HTTP (64 tests, most call services directly)
- **Reusable** by admin commands, Celery tasks, future GraphQL endpoints
- **Auditable** — every state change goes through one named function

Views are ~15 lines each. Serializers validate input shapes only.

### Why `404` for cross-tenant access (never `403`)

A `403 Forbidden` reveals that the resource exists but you can't see it.
An attacker can enumerate IDs. A `404 Not Found` is indistinguishable from
"resource doesn't exist at all" — no information leak.

This is enforced at the middleware/permission level and tested for every
endpoint.

### Why the Notifications use Celery

Sending notifications inside the request would add 20–50ms to every issue
update. Celery defers the work to a worker. The tradeoff: if Redis is down, no
notifications. That's acceptable — a missed notification is far better than a
slow or failed issue update.

The task dispatch is wrapped in `_enqueue()`, which logs failures but never
raises. User actions always succeed even if the notification queue is broken.

### Why `django-simple-history` instead of a custom audit log

Every model change is a full row insert in a shadow table. It's a 2× write cost
but:
- Zero code to maintain
- Every field is captured by default
- Queryable like any other model
- Reverting to a prior state is trivial

For a security audit event stream (logins, permission denials), that's a
separate concern — see ADR-0003.

---

## Roadmap

### Completed
-  Multi-tenant workspaces with 3-layer isolation
-  RBAC with capability matrix
-  JWT auth with HttpOnly refresh cookie
-  Projects, boards, columns, sprints, issues
-  Kanban drag-and-drop with optimistic concurrency
-  Comments, attachments, notifications
-  Field-level history via `simple-history`
-  Stripe Checkout + Customer Portal + webhook
-  Timeline and Reports analytics
- 64 backend tests, TypeScript strict frontend

### Not yet built (documented as future work)
- **Webhooks** — outbound webhooks to external systems with SSRF hardening,
  retry policy, and delivery log (ADR pending)
- **Email notifications** — currently in-app only; email digest deferred
- **File upload flow** — presigned URL endpoint built, actual upload UI deferred
- **Real-time updates** — WebSocket / SSE for multi-user collaboration
- **Usage-based billing** — meter events for metered pricing tiers
- **Audit event stream** — separate `AuditEvent` model for security-relevant
  actions (logins, permission denials) — see ADR-0003
- **MFA** — TOTP or WebAuthn for the owner role
- **Stripe Tax** — US state + international VAT calculation

### Known limitations
- **Reports query is N+1-ish** — loops over issues to aggregate. Fine at
  hundreds per board; needs `GROUP BY` aggregation at scale. Documented.
- **My Tasks** — fetches all boards' issues client-side, filters by assignee.
  Fine up to a few thousand issues; needs a dedicated endpoint at scale.
- **Notification table unbounded** — should be partitioned by month at 10k
  tenants. Documented.
- **No Stripe webhook idempotency table** — a retried webhook may double-process
  `checkout.session.completed`. Real risk; see Roadmap.

---

## License

MIT
```

---

