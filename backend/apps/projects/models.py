from __future__ import annotations

from django.db import models

from common.models import SoftDeleteModel, TenantModel


class Project(TenantModel, SoftDeleteModel):
    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="projects"
    )
    name = models.CharField(max_length=120)
    key = models.CharField(max_length=8)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "key"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_project_key_per_workspace",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "created_at"], name="idx_project_ws_created"),
        ]

    def __str__(self) -> str:
        return f"[{self.key}] {self.name}"
