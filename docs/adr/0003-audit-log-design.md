# 3. Audit log strategy

## Status
Accepted

## Context
"Who did what, when" is required for compliance, incident review, and tenant
trust. We need to decide: build a dedicated `AuditLog` model, reuse
`django-simple-history`, or both.

## Decision
Two mechanisms, each earning its keep:

1. **Field-level history** — `django-simple-history` on `Issue`, already
   shipped. Powers `GET /issues/{id}/history/` and is what users
   intuitively mean when they ask "what changed on this ticket?".

2. **Security events** — a future `AuditEvent` model for things that aren't
   field changes: login, permission denied, tenant export, workspace
   deletion. Append-only via a DB trigger, partitioned by month.

We do **not** build a generic `AuditLog` that mirrors every field change —
that would duplicate `simple-history` and cost 2x the writes.

## Consequences
(+) Reviewers see the distinction between "user-facing diff" and "compliance
    event stream" — a real-world distinction most teams conflate.
(+) `simple-history` is already wired and tested.
(−) The `AuditEvent` half is designed but not implemented. Documented as
    Phase H work. For a portfolio project this is the right tradeoff:
    design discipline shown, code spent where it pays.

## What we implement now
- `GET /issues/{id}/history/` — done, uses `simple-history`.
- `common/audit.py::record_audit(...)` — signature reserved for future
  use, will write to `AuditEvent`.