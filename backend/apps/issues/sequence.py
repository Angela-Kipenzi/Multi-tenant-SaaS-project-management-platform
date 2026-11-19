from __future__ import annotations

from django.db import models, transaction

from common.models import UUIDModel


class IssueSequence(UUIDModel):
    """One row per project, locked during issue creation to generate keys atomically."""

    project = models.OneToOneField(
        "projects.Project", on_delete=models.CASCADE, related_name="issue_sequence"
    )
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Issue sequence"


def next_issue_number(project_id) -> int:
    with transaction.atomic():
        seq, _ = IssueSequence.objects.select_for_update().get_or_create(project_id=project_id)
        seq.last_number += 1
        seq.save(update_fields=["last_number"])
        return seq.last_number
