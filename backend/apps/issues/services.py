from __future__ import annotations

from django.db import transaction

from apps.accounts.models import WorkspaceMembership
from apps.accounts.roles import has_capability
from apps.boards.models import Board, Column
from apps.projects.models import Project
from common.exceptions import Conflict, Forbidden, NotFound, DomainError

from .models import Issue, Sprint, Comment, Attachment
from .sequence import next_issue_number

from datetime import datetime
from django.db import transaction
from django.utils import timezone
from common.exceptions import Conflict, Forbidden, NotFound
from django.db import models
from apps.notifications.tasks import notify_assignment
from apps.notifications.tasks import notify_comment

import logging

_logger = logging.getLogger(__name__)


def _enqueue(fn, **kwargs) -> None:
    """Enqueue a Celery task, logging failures instead of raising.

    A failed notification should not break the user's action.
    """
    try:
        fn.delay(**kwargs)
    except Exception as exc:
        _logger.exception("Failed to enqueue %s: %s", fn.name, exc)

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

    if Sprint.objects.filter(project=project, name=name).exists():
        raise Conflict(
            f"A sprint named '{name}' already exists in this project.",
            code="sprint_name_taken",
        )

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

def delete_sprint(*, actor_membership: WorkspaceMembership, sprint_id) -> None:
    if not has_capability(actor_membership.role, "board.create"):
        raise Forbidden("Role cannot delete sprints.")

    workspace = actor_membership.workspace
    sprint = Sprint.objects.filter(workspace=workspace, id=sprint_id).first()
    if not sprint:
        raise NotFound("Sprint not found.")
    if sprint.is_active:
        raise Conflict(
            "Cannot delete an active sprint. Close it first.",
            code="sprint_active",
        )

    # Issues in this sprint go back to the backlog.
    sprint.issues.update(sprint=None)
    sprint.delete()

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

def update_issue(
    *, actor_membership: WorkspaceMembership, issue_id,
    title: str | None = None, description: str | None = None,
    priority: str | None = None, assignee_id=None, sprint_id=None,
) -> Issue:
    workspace = actor_membership.workspace
    issue = Issue.objects.filter(workspace=workspace, id=issue_id).first()
    if not issue:
        raise NotFound("Issue not found.")

    # Field-level permission: only assignee can update own; admins can update any.
    previous_assignee_id = issue.assignee_id

    if title is not None:
        issue.title = title
    if description is not None:
        issue.description = description
    if priority is not None:
        issue.priority = priority
    if assignee_id is not None:
        issue.assignee_id = assignee_id
    if sprint_id is not None:
        issue.sprint_id = sprint_id
    issue.save()

    if assignee_id is not None and assignee_id != previous_assignee_id:
        _enqueue(
            notify_assignment,
            user_id=str(assignee_id),
            workspace_id=str(workspace.id),
            issue_id=str(issue.id),
            actor_id=str(actor_membership.user_id),
            )
        return issue


def move_issue(
    *, actor_membership: WorkspaceMembership, issue_id,
    column_id, order: int, expected_updated_at: datetime,
) -> Issue:
    workspace = actor_membership.workspace

    with transaction.atomic():
        # Lock the row to serialize concurrent moves of the same issue.
        issue = (
            Issue.objects.select_for_update()
            .filter(workspace=workspace, id=issue_id)
            .first()
        )
        if not issue:
            raise NotFound("Issue not found.")

        if not has_capability(actor_membership.role, "issue.update_any") and \
           issue.assignee_id != actor_membership.user_id:
            raise Forbidden("Role cannot move this issue.")

        # Optimistic concurrency: client's expected_updated_at must match
        # current, else another user moved it since they loaded.
        if issue.updated_at != expected_updated_at:
            raise Conflict(
                "Issue was modified by another user.",
                code="stale_write",
            )

        target_column = (
            Column.objects.filter(workspace=workspace, id=column_id)
            .select_related("board")
            .first()
        )
        if not target_column:
            raise NotFound("Column not found.")
        if target_column.board_id != issue.board_id:
            raise Conflict(
                "Target column is on a different board.",
                code="wrong_board",
            )

        source_column_id = issue.column_id
        source_order = issue.order
        target_order = max(0, min(order, _column_max_order(workspace, target_column.id)))

        if source_column_id == target_column.id:
            # Reorder within the same column.
            _shift_within_column(workspace, source_column_id, source_order, target_order)
        else:
            # Move across columns: compact source, insert into target.
            _shift_source_column(workspace, source_column_id, source_order)
            _shift_target_column(workspace, target_column.id, target_order)

        issue.column = target_column
        issue.order = target_order
        issue.save()
        return issue

def delete_issue(*, actor_membership: WorkspaceMembership, issue_id) -> None:
    if not has_capability(actor_membership.role, "issue.delete"):
        raise Forbidden("Role cannot delete issues.")

    workspace = actor_membership.workspace
    issue = Issue.objects.filter(workspace=workspace, id=issue_id).first()
    if not issue:
        raise NotFound("Issue not found.")

    issue.soft_delete()


def _column_max_order(workspace, column_id) -> int:
    return (
        Issue.objects
        .filter(workspace=workspace, column_id=column_id)
        .count()
    )


def _shift_within_column(workspace, column_id, old_order: int, new_order: int) -> None:
    if old_order == new_order:
        return
    if old_order < new_order:
        Issue.objects.filter(
            workspace=workspace, column_id=column_id,
            order__gt=old_order, order__lte=new_order,
        ).update(order=models.F("order") - 1)
    else:
        Issue.objects.filter(
            workspace=workspace, column_id=column_id,
            order__gte=new_order, order__lt=old_order,
        ).update(order=models.F("order") + 1)


def _shift_source_column(workspace, column_id, old_order: int) -> None:
    Issue.objects.filter(
        workspace=workspace, column_id=column_id, order__gt=old_order
    ).update(order=models.F("order") - 1)


def _shift_target_column(workspace, column_id, target_order: int) -> None:
    Issue.objects.filter(
        workspace=workspace, column_id=column_id, order__gte=target_order
    ).update(order=models.F("order") + 1)


@transaction.atomic
def close_sprint(*, actor_membership: WorkspaceMembership, sprint_id) -> Sprint:
    if not has_capability(actor_membership.role, "board.create"):
        raise Forbidden("Role cannot close sprints.")

    workspace = actor_membership.workspace
    sprint = (
        Sprint.objects.select_for_update()
        .filter(workspace=workspace, id=sprint_id)
        .first()
    )
    if not sprint:
        raise NotFound("Sprint not found.")
    if not sprint.is_active:
        raise Conflict("Sprint is not active.", code="not_active")

    # Return incomplete issues to the backlog (sprint=None).
    Issue.objects.filter(
        workspace=workspace, sprint=sprint, status__in=["todo", "in_progress", "review"]
    ).update(sprint=None)

    sprint.is_active = False
    sprint.save(update_fields=["is_active", "updated_at"])
    return sprint

def create_comment(
    *, actor_membership: WorkspaceMembership, issue_id, body: str,
) -> Comment:
    if not has_capability(actor_membership.role, "comment.create"):
        raise Forbidden("Role cannot comment.")

    workspace = actor_membership.workspace
    issue = Issue.objects.select_related("reporter", "assignee").filter(
        workspace=workspace, id=issue_id
    ).first()
    if not issue:
        raise NotFound("Issue not found.")

    comment = Comment.objects.create(
        workspace=workspace,
        issue=issue,
        author=actor_membership.user,
        body=body,
    )

    # Notify the assignee and reporter (if any, and if not the commenter).
    from apps.notifications.tasks import notify_comment

    recipients = set()
    if issue.assignee_id and issue.assignee_id != actor_membership.user_id:
        recipients.add(issue.assignee_id)
    if issue.reporter_id and issue.reporter_id != actor_membership.user_id:
        recipients.add(issue.reporter_id)

    for recipient_id in recipients:
        _enqueue(
            notify_comment,
            user_id=str(recipient_id),
            workspace_id=str(workspace.id),
            issue_id=str(issue.id),
            actor_id=str(actor_membership.user_id),
            preview=body,
        )

    return comment


def delete_comment(
    *, actor_membership: WorkspaceMembership, comment_id,
) -> None:
    workspace = actor_membership.workspace
    comment = Comment.objects.filter(workspace=workspace, id=comment_id).first()
    if not comment:
        raise NotFound("Comment not found.")

    # Only the author or an admin/owner can delete.
    is_author = comment.author_id == actor_membership.user_id
    can_delete_any = has_capability(actor_membership.role, "issue.delete")
    if not (is_author or can_delete_any):
        raise Forbidden("Role cannot delete this comment.")

    comment.soft_delete()

ATTACHMENT_ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "application/pdf",
    "text/plain", "text/csv",
}


def create_attachment(
    *, actor_membership: WorkspaceMembership, issue_id,
    file_key: str, file_name: str, file_size: int, content_type: str,
) -> Attachment:
    if not has_capability(actor_membership.role, "comment.create"):
        raise Forbidden("Role cannot attach files.")

    if content_type not in ATTACHMENT_ALLOWED_TYPES:
        raise DomainError(
            f"Content type {content_type} not allowed.", code="bad_content_type"
        )

    workspace = actor_membership.workspace
    issue = Issue.objects.filter(workspace=workspace, id=issue_id).first()
    if not issue:
        raise NotFound("Issue not found.")

    # File key must be scoped under this workspace and issue — a client
    # cannot register a key pointing at another workspace's object.
    expected_prefix = f"{workspace.id}/{issue.id}/"
    if not file_key.startswith(expected_prefix):
        raise DomainError("Invalid file_key prefix.", code="bad_file_key")

    return Attachment.objects.create(
        workspace=workspace, issue=issue,
        file_key=file_key, file_name=file_name,
        file_size=file_size, content_type=content_type,
        uploaded_by=actor_membership.user,
    )


def delete_attachment(
    *, actor_membership: WorkspaceMembership, attachment_id,
) -> None:
    workspace = actor_membership.workspace
    attachment = Attachment.objects.filter(
        workspace=workspace, id=attachment_id
    ).first()
    if not attachment:
        raise NotFound("Attachment not found.")

    is_uploader = attachment.uploaded_by_id == actor_membership.user_id
    can_delete_any = has_capability(actor_membership.role, "issue.delete")
    if not (is_uploader or can_delete_any):
        raise Forbidden("Role cannot delete this attachment.")

    attachment.soft_delete()