from __future__ import annotations

from django.db import transaction

from apps.accounts.models import WorkspaceMembership
from apps.accounts.roles import has_capability
from apps.boards.models import Board, Column
from apps.projects.models import Project
from common.exceptions import Forbidden, NotFound

from .models import Issue, Sprint
from .sequence import next_issue_number


def create_sprint(
    *, actor_membership: WorkspaceMembership, project_id, name: str,
    start_date=None, end_date=None,
) -> Sprint:
    if not has_capability(actor_membership.role, "board.create"):
        raise Forbidden("Role cannot create sprints.")

    workspace = actor_membership.workspace
    project = Project.objects.filter(workspace=workspace, id=project_id).first()
    if not project:
        raise NotFound("Project not found.")

    return Sprint.objects.create(
        workspace=workspace, project=project, name=name,
        start_date=start_date, end_date=end_date,
    )


@transaction.atomic
def activate_sprint(*, actor_membership: WorkspaceMembership, sprint_id) -> Sprint:
    if not has_capability(actor_membership.role, "board.create"):
        raise Forbidden("Role cannot activate sprints.")

    workspace = actor_membership.workspace
    sprint = Sprint.objects.select_for_update().filter(
        workspace=workspace, id=sprint_id
    ).first()
    if not sprint:
        raise NotFound("Sprint not found.")

    Sprint.objects.filter(
        workspace=workspace, project_id=sprint.project_id, is_active=True
    ).exclude(id=sprint.id).update(is_active=False)

    sprint.is_active = True
    sprint.save(update_fields=["is_active", "updated_at"])
    return sprint


def create_issue(
    *, actor_membership: WorkspaceMembership, board_id, column_id,
    title: str, description: str = "", priority: str = "medium",
    sprint_id=None, assignee_id=None,
) -> Issue:
    if not has_capability(actor_membership.role, "issue.create"):
        raise Forbidden("Role cannot create issues.")

    workspace = actor_membership.workspace
    board = Board.objects.select_related("project").filter(
        workspace=workspace, id=board_id
    ).first()
    if not board:
        raise NotFound("Board not found.")

    column = Column.objects.filter(workspace=workspace, board=board, id=column_id).first()
    if not column:
        raise NotFound("Column not found.")

    if sprint_id is not None:
        if not Sprint.objects.filter(
            workspace=workspace, project=board.project, id=sprint_id
        ).exists():
            raise NotFound("Sprint not found on this project.")

    number = next_issue_number(board.project_id)
    key = f"{board.project.key}-{number}"

    max_order = Issue.objects.filter(
        workspace=workspace, column=column
    ).count()

    return Issue.objects.create(
        workspace=workspace,
        project=board.project,
        board=board,
        column=column,
        sprint_id=sprint_id,
        assignee_id=assignee_id,
        reporter=actor_membership.user,
        key=key,
        number=number,
        title=title,
        description=description,
        priority=priority,
        order=max_order,
    )