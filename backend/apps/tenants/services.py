from __future__ import annotations

from django.db import transaction

from apps.accounts.models import WorkspaceMembership
from apps.accounts.roles import has_capability
from common.exceptions import Forbidden

from .models import Workspace


def update_workspace(
    *, actor_membership: WorkspaceMembership, name: str | None = None
) -> Workspace:
    if not has_capability(actor_membership.role, "workspace.update"):
        raise Forbidden("Role cannot update workspace.")
    workspace = actor_membership.workspace
    if name is not None:
        workspace.name = name
        workspace.save(update_fields=["name", "updated_at"])
    return workspace


@transaction.atomic
def delete_workspace(*, actor_membership: WorkspaceMembership) -> None:
    if not has_capability(actor_membership.role, "workspace.delete"):
        raise Forbidden("Only owners can delete a workspace.")
    actor_membership.workspace.soft_delete()
