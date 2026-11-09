from __future__ import annotations

from django.db import models
from simple_history.models import HistoricalRecords

from common.models import SoftDeleteModel, TenantModel


class Sprint(TenantModel):
    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="sprints"
    )
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="sprints"
    )
    name = models.CharField(max_length=120)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=models.Q(is_active=True),
                name="uniq_active_sprint_per_project",
            ),
        ]
        indexes = [
            models.Index(
                fields=["workspace", "project", "is_active"],
                name="idx_sprint_ws_project_active",
            ),
        ]
        ordering = ["-start_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.name}{' (active)' if self.is_active else ''}"


class Issue(TenantModel, SoftDeleteModel):
    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        REVIEW = "review", "Review"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="issues"
    )
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="issues"
    )
    board = models.ForeignKey(
        "boards.Board", on_delete=models.CASCADE, related_name="issues"
    )
    column = models.ForeignKey(
        "boards.Column", on_delete=models.PROTECT, related_name="issues"
    )
    sprint = models.ForeignKey(
        Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name="issues"
    )
    key = models.CharField(max_length=20)
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(
        max_length=20, choices=Priority.choices, default=Priority.MEDIUM
    )
    assignee = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_issues",
    )
    reporter = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reported_issues",
    )
    order = models.PositiveIntegerField(default=0)

    history = HistoricalRecords()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "number"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_issue_number_per_project",
            ),
        ]
        indexes = [
            models.Index(
                fields=["workspace", "board", "column", "order"],
                name="idx_issue_kanban",
            ),
            models.Index(fields=["workspace", "sprint"], name="idx_issue_ws_sprint"),
            models.Index(
                fields=["workspace", "assignee"], name="idx_issue_ws_assignee"
            ),
            models.Index(
                fields=["workspace", "updated_at"], name="idx_issue_ws_updated"
            ),
        ]
        ordering = ["order", "created_at"]

    def __str__(self) -> str:
        return f"{self.key}: {self.title}"