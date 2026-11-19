from __future__ import annotations

from django.db import models

from common.models import TenantModel


class Notification(TenantModel):
    class Kind(models.TextChoices):
        ASSIGNED = "assigned", "Assigned to you"
        COMMENTED = "commented", "New comment"
        STATUS_CHANGED = "status_changed", "Status changed"

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="notifications"
    )
    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications_acted",
    )
    kind = models.CharField(max_length=30, choices=Kind.choices)
    issue = models.ForeignKey(
        "issues.Issue",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    payload = models.JSONField(default=dict)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "read_at", "-created_at"],
                name="idx_notif_user_unread",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.kind} → {self.user_id}"
