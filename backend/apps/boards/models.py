from __future__ import annotations

from django.db import models

from common.models import SoftDeleteModel, TenantModel


class Board(TenantModel, SoftDeleteModel):
    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="boards"
    )
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="boards"
    )
    name = models.CharField(max_length=120)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_board_name_per_project",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "project"], name="idx_board_ws_project"),
        ]

    def __str__(self) -> str:
        return self.name


class Column(TenantModel):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="columns")
    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="columns"
    )
    name = models.CharField(max_length=60)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["board", "name"], name="uniq_column_name_per_board"),
        ]
        indexes = [
            models.Index(fields=["board", "order"], name="idx_column_board_order"),
        ]
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.board.name} / {self.name} ({self.order})"