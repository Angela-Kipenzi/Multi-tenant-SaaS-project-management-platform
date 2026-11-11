from __future__ import annotations

from django.db import models

from common.models import TenantModel


class Subscription(TenantModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past Due"
        CANCELED = "canceled", "Canceled"
        INCOMPLETE = "incomplete", "Incomplete"

    workspace = models.OneToOneField(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="subscription"
    )
    stripe_subscription_id = models.CharField(max_length=120, unique=True)
    stripe_customer_id = models.CharField(max_length=120)
    stripe_price_id = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=Status.choices)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.workspace_id} → {self.status}"