from __future__ import annotations

from celery import shared_task

from .models import Notification


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    acks_late=True,
)
def notify_assignment(self, *, user_id, workspace_id, issue_id, actor_id=None) -> None:
    """Create an 'assigned' notification for the target user."""
    from apps.accounts.models import WorkspaceMembership
    from apps.issues.models import Issue

    if not WorkspaceMembership.objects.filter(user_id=user_id, workspace_id=workspace_id).exists():
        return  # user removed from workspace before task ran

    issue = (
        Issue.objects.select_related("project")
        .filter(id=issue_id, workspace_id=workspace_id)
        .first()
    )
    if not issue:
        return  # issue deleted before task ran

    Notification.objects.create(
        user_id=user_id,
        workspace_id=workspace_id,
        actor_id=actor_id,
        kind=Notification.Kind.ASSIGNED,
        issue=issue,
        payload={
            "issue_key": issue.key,
            "issue_title": issue.title,
            "project_id": str(issue.project_id),
            "board_id": str(issue.board_id),
        },
    )


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    acks_late=True,
)
def notify_comment(
    self,
    *,
    user_id,
    workspace_id,
    issue_id,
    actor_id,
    preview: str,
) -> None:
    """Create a 'commented' notification for the issue assignee (or reporter)."""
    from apps.accounts.models import WorkspaceMembership
    from apps.issues.models import Issue

    if not WorkspaceMembership.objects.filter(user_id=user_id, workspace_id=workspace_id).exists():
        return

    issue = (
        Issue.objects.select_related("project")
        .filter(id=issue_id, workspace_id=workspace_id)
        .first()
    )
    if not issue:
        return

    Notification.objects.create(
        user_id=user_id,
        workspace_id=workspace_id,
        actor_id=actor_id,
        kind=Notification.Kind.COMMENTED,
        issue=issue,
        payload={
            "issue_key": issue.key,
            "issue_title": issue.title,
            "project_id": str(issue.project_id),
            "board_id": str(issue.board_id),
            "preview": preview[:140],
        },
    )
