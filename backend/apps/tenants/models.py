from __future__ import annotations

from django.db import models

from common.models import SoftDeleteModel, TimestampedModel, UUIDModel


class Plan(models.TextChoices):
    FREE = "free", "Free"
    PRO = "pro", "Pro"
    ENTERPRISE = "enterprise", "Enterprise"


PLAN_LIMITS: dict[str, dict[str, int]] = {
    Plan.FREE: {"max_projects": 3, "max_members": 5},
    Plan.PRO: {"max_projects": 50, "max_members": 25},
    Plan.ENTERPRISE: {"max_projects": 500, "max_members": 200},
}


class Workspace(UUIDModel, TimestampedModel, SoftDeleteModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)
    stripe_customer_id = models.CharField(max_length=120, blank=True)
    stripe_subscription_id = models.CharField(max_length=120, blank=True)
    subscription_status = models.CharField(max_length=40, default="inactive")

    class Meta:
        indexes = [
            models.Index(fields=["plan", "subscription_status"], name="idx_ws_plan_status"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.plan})"

    @property
    def max_projects(self) -> int:
        return PLAN_LIMITS[self.plan]["max_projects"]

    @property
    def max_members(self) -> int:
        return PLAN_LIMITS[self.plan]["max_members"]
