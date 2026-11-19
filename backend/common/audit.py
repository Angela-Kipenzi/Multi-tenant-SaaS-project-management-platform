"""Audit log writer. Append-only by DB trigger (Phase E)."""
from __future__ import annotations

from typing import Any


# Implemented in Phase E — this is the stable signature services will call.
def record_audit(
    *,
    workspace_id,
    actor_id,
    action: str,
    target_type: str,
    target_id: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    from apps.audit.models import AuditLog  # late import
    AuditLog.objects.create(
        workspace_id=workspace_id,
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        metadata=metadata or {},
    )