from __future__ import annotations

from django.db import transaction

from apps.accounts.models import WorkspaceMembership
from apps.accounts.roles import has_capability
from apps.projects.models import Project
from common.exceptions import Conflict, Forbidden, NotFound

from .models import Board, Column


def create_board(*, actor_membership: WorkspaceMembership, project_id, name: str) -> Board:
    if not has_capability(actor_membership.role, "board.create"):
        raise Forbidden("Role cannot create boards.")

    workspace = actor_membership.workspace
    project = Project.objects.filter(workspace=workspace, id=project_id).first()
    if not project:
        raise NotFound("Project not found.")

    if Board.objects.filter(workspace=workspace, project=project, name__iexact=name).exists():
        raise Conflict("Board name already used in this project.", code="board_name_taken")

    board = Board.objects.create(workspace=workspace, project=project, name=name)

    # Seed default columns — every board gets a minimal workflow.
    for i, col_name in enumerate(["To Do", "In Progress", "Done"]):
        Column.objects.create(workspace=workspace, board=board, name=col_name, order=i)
    return board


def reorder_columns(
    *, actor_membership: WorkspaceMembership, board_id, column_order: list[str]
) -> None:
    """column_order is a list of column IDs in the desired final order."""
    if not has_capability(actor_membership.role, "board.create"):
        raise Forbidden("Role cannot reorder columns.")

    workspace = actor_membership.workspace
    board = Board.objects.filter(workspace=workspace, id=board_id).first()
    if not board:
        raise NotFound("Board not found.")

    columns = {str(c.id): c for c in board.columns.all()}
    if set(column_order) != set(columns.keys()):
        raise Conflict(
            "Column list must contain exactly the board's columns.",
            code="column_order_mismatch",
        )

    with transaction.atomic():
        for i, col_id in enumerate(column_order):
            col = columns[col_id]
            if col.order != i:
                col.order = i
                col.save(update_fields=["order"])
