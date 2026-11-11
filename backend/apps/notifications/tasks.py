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
def notify_assignment(self, *, user_id, workspace_id, issue_id) -> None:
    """Idempotent-ish: a duplicate notification is acceptable; a missed one is not."""
    from apps.accounts.models import WorkspaceMembership
    from apps.issues.models import Issue

    if not WorkspaceMembership.objects.filter(
        user_id=user_id, workspace_id=workspace_id
    ).exists():
        return  # user was removed from the workspace before the task ran

    issue = Issue.objects.filter(id=issue_id, workspace_id=workspace_id).first()
    if not issue:
        return  # issue deleted before task ran

    Notification.objects.create(
        user_id=user_id,
        workspace_id=workspace_id,
        kind=Notification.Kind.ASSIGNED,
        issue=issue,
        payload={"issue_key": issue.key, "issue_title": issue.title},
    )