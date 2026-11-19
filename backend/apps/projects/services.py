from __future__ import annotations

from apps.accounts.models import WorkspaceMembership
from apps.accounts.roles import has_capability
from common.exceptions import Conflict, Forbidden, NotFound, PlanLimitExceeded

from .models import Project


def create_project(
    *, actor_membership: WorkspaceMembership, name: str, key: str, description: str = ""
) -> Project:
    if not has_capability(actor_membership.role, "project.create"):
        raise Forbidden("Role cannot create projects.")

    workspace = actor_membership.workspace
    active_projects = Project.objects.filter(workspace=workspace).count()
    if active_projects >= workspace.max_projects:
        raise PlanLimitExceeded(
            f"Plan limit reached ({workspace.max_projects} projects).",
            resource="projects",
        )

    if Project.objects.filter(workspace=workspace, key__iexact=key).exists():
        raise Conflict("Project key already in use.", code="key_taken")

    return Project.objects.create(
        workspace=workspace,
        name=name,
        key=key.upper(),
        description=description,
        created_by=actor_membership.user,
    )


def update_project(
    *,
    actor_membership: WorkspaceMembership,
    project_id,
    name: str | None = None,
    description: str | None = None,
) -> Project:
    if not has_capability(actor_membership.role, "project.update"):
        raise Forbidden("Role cannot update projects.")

    project = Project.objects.filter(workspace=actor_membership.workspace, id=project_id).first()
    if not project:
        raise NotFound("Project not found.")

    if name is not None:
        project.name = name
    if description is not None:
        project.description = description
    project.save()
    return project


def delete_project(*, actor_membership: WorkspaceMembership, project_id) -> None:
    if not has_capability(actor_membership.role, "project.delete"):
        raise Forbidden("Role cannot delete projects.")

    project = Project.objects.filter(workspace=actor_membership.workspace, id=project_id).first()
    if not project:
        raise NotFound("Project not found.")

    project.soft_delete()
