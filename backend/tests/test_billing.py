import json
from unittest.mock import patch

import pytest

from apps.billing import services
from apps.billing.models import Subscription
from apps.tenants.models import Plan
from common.exceptions import Forbidden, NotFound
from tests.factories.accounts import MembershipFactory

pytestmark = pytest.mark.django_db


# --- Checkout ---


@patch("stripe.checkout.Session.create")
def test_checkout_creates_session_and_returns_url(mock_create, owner):
    mock_create.return_value = type("S", (), {"url": "https://checkout.stripe.com/x"})()

    url = services.create_checkout_session(actor_membership=owner)

    assert url == "https://checkout.stripe.com/x"
    args, kwargs = mock_create.call_args
    assert kwargs["mode"] == "subscription"
    assert kwargs["client_reference_id"] == str(owner.workspace_id)


@patch("stripe.checkout.Session.create")
def test_checkout_requires_owner_role(mock_create):
    admin = MembershipFactory(role="admin")
    with pytest.raises(Forbidden):
        services.create_checkout_session(actor_membership=admin)
    mock_create.assert_not_called()


@patch("stripe.checkout.Session.create")
def test_checkout_refuses_when_already_paid(mock_create, owner):
    owner.workspace.plan = Plan.PRO
    owner.workspace.save()
    with pytest.raises(Forbidden):
        services.create_checkout_session(actor_membership=owner)
    mock_create.assert_not_called()


# --- Portal ---


@patch("stripe.billing_portal.Session.create")
def test_portal_requires_customer(mock_create, owner):
    with pytest.raises(NotFound):
        services.create_portal_session(actor_membership=owner)
    mock_create.assert_not_called()


@patch("stripe.billing_portal.Session.create")
def test_portal_returns_url(mock_create, owner):
    owner.workspace.stripe_customer_id = "cus_123"
    owner.workspace.save()
    mock_create.return_value = type("S", (), {"url": "https://billing.stripe.com/p"})()

    url = services.create_portal_session(actor_membership=owner)
    assert url == "https://billing.stripe.com/p"
    _, kwargs = mock_create.call_args
    assert kwargs["customer"] == "cus_123"


# --- Webhook: checkout completed ---


@patch("stripe.Subscription.retrieve")
def test_checkout_completed_upgrades_plan(mock_retrieve, owner):
    mock_retrieve.return_value = {
        "items": {"data": [{"price": {"id": "price_123"}}]},
        "current_period_end": 1800000000,
    }
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": str(owner.workspace_id),
                "customer": "cus_abc",
                "subscription": "sub_abc",
            }
        },
    }
    services.handle_webhook_event(event)

    owner.workspace.refresh_from_db()
    assert owner.workspace.plan == Plan.PRO
    assert owner.workspace.subscription_status == "active"
    assert Subscription.objects.filter(workspace=owner.workspace).exists()


# --- Webhook: subscription canceled ---


def test_subscription_deleted_downgrades_plan(owner):
    owner.workspace.plan = Plan.PRO
    owner.workspace.stripe_subscription_id = "sub_abc"
    owner.workspace.save()

    event = {
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": "sub_abc"}},
    }
    services.handle_webhook_event(event)

    owner.workspace.refresh_from_db()
    assert owner.workspace.plan == Plan.FREE
    assert owner.workspace.subscription_status == "canceled"


# --- Webhook signature verification (integration-level) ---


def test_webhook_rejects_unsigned_request(api_client):
    r = api_client.post(
        "/api/v1/billing/webhook/",
        data=json.dumps({"type": "checkout.session.completed"}),
        content_type="application/json",
    )
    assert r.status_code == 400
