from __future__ import annotations

import stripe
from django.conf import settings
from django.db import transaction
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone
from apps.accounts.models import WorkspaceMembership
from apps.accounts.roles import has_capability
from apps.tenants.models import Plan, Workspace
from common.exceptions import Forbidden, NotFound

from .models import Subscription

stripe.api_key = settings.STRIPE_SECRET_KEY


def _get_workspace_for_billing(actor_membership: WorkspaceMembership) -> Workspace:
    if not has_capability(actor_membership.role, "billing.manage"):
        raise Forbidden("Only owners can manage billing.")
    return actor_membership.workspace


def create_checkout_session(
    *, actor_membership: WorkspaceMembership
) -> str:
    workspace = _get_workspace_for_billing(actor_membership)

    # Idempotency: if already subscribed, refuse. Owner should use portal.
    if workspace.plan != Plan.FREE:
        raise Forbidden("Workspace already on a paid plan. Use the portal.")

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.STRIPE_PRICE_PRO, "quantity": 1}],
        success_url=settings.STRIPE_SUCCESS_URL,
        cancel_url=settings.STRIPE_CANCEL_URL,
        customer_email=actor_membership.user.email,
        client_reference_id=str(workspace.id),
        subscription_data={
            "metadata": {"workspace_id": str(workspace.id)},
        },
        # Stripe deduplicates retries of the same request within 24h.
        idempotency_key=f"checkout-{workspace.id}",
    )
    return session.url


def create_portal_session(
    *, actor_membership: WorkspaceMembership
) -> str:
    workspace = _get_workspace_for_billing(actor_membership)

    if not workspace.stripe_customer_id:
        raise NotFound("No billing account. Subscribe first.")

    session = stripe.billing_portal.Session.create(
        customer=workspace.stripe_customer_id,
        return_url=settings.STRIPE_SUCCESS_URL,
    )
    return session.url


@transaction.atomic
def handle_checkout_completed(event: dict) -> None:
    session = event["data"]["object"]
    workspace_id = session.get("client_reference_id")
    if not workspace_id:
        return

    workspace = Workspace.objects.filter(id=workspace_id).first()
    if not workspace:
        return

    workspace.stripe_customer_id = session["customer"]
    workspace.stripe_subscription_id = session["subscription"]
    workspace.plan = Plan.PRO
    workspace.subscription_status = Subscription.Status.ACTIVE
    workspace.save(
        update_fields=[
            "stripe_customer_id", "stripe_subscription_id",
            "plan", "subscription_status",
        ]
    )

    stripe_sub = stripe.Subscription.retrieve(session["subscription"])
    Subscription.objects.update_or_create(
        workspace=workspace,
        defaults={
            "stripe_subscription_id": session["subscription"],
            "stripe_customer_id": session["customer"],
            "stripe_price_id": stripe_sub["items"]["data"][0]["price"]["id"],
            "status": Subscription.Status.ACTIVE,
            "current_period_end": datetime.fromtimestamp(
                stripe_sub["current_period_end"], tz=dt_timezone.utc
            ),
        },
    )


@transaction.atomic
def handle_subscription_updated(event: dict) -> None:
    sub = event["data"]["object"]
    workspace = Workspace.objects.filter(
        stripe_subscription_id=sub["id"]
    ).first()
    if not workspace:
        return

    status = sub["status"]
    workspace.subscription_status = status

    if status == Subscription.Status.CANCELED:
        workspace.plan = Plan.FREE
    elif status == Subscription.Status.ACTIVE:
        workspace.plan = Plan.PRO

    workspace.save(update_fields=["subscription_status", "plan"])

    Subscription.objects.filter(
        stripe_subscription_id=sub["id"]
    ).update(
        status=status,
        current_period_end=datetime.fromtimestamp(
            sub["current_period_end"], tz=dt_timezone.utc
        ),
        cancel_at_period_end=sub.get("cancel_at_period_end", False),
    )


@transaction.atomic
def handle_subscription_deleted(event: dict) -> None:
    sub = event["data"]["object"]
    workspace = Workspace.objects.filter(
        stripe_subscription_id=sub["id"]
    ).first()
    if not workspace:
        return

    workspace.plan = Plan.FREE
    workspace.subscription_status = Subscription.Status.CANCELED
    workspace.save(update_fields=["plan", "subscription_status"])

    Subscription.objects.filter(
        stripe_subscription_id=sub["id"]
    ).update(status=Subscription.Status.CANCELED)


def handle_webhook_event(event: dict) -> None:
    """Dispatch by event type. Unknown events are ignored (Stripe sends many)."""
    event_type = event.get("type")
    if event_type == "checkout.session.completed":
        handle_checkout_completed(event)
    elif event_type == "customer.subscription.updated":
        handle_subscription_updated(event)
    elif event_type == "customer.subscription.deleted":
        handle_subscription_deleted(event)
    # All other events are no-ops; Stripe tolerates 200 for anything.