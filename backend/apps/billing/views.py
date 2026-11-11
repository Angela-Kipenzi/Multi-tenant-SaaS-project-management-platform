from __future__ import annotations

import stripe
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tenants.models import PLAN_LIMITS
from common.permissions import HasWorkspaceContext

from . import services


class BillingPlanView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id):
        ws = request.workspace
        limits = PLAN_LIMITS[ws.plan]
        return Response({
            "plan": ws.plan,
            "subscription_status": ws.subscription_status,
            "max_projects": limits["max_projects"],
            "max_members": limits["max_members"],
            "current_projects": ws.projects.count(),
            "current_members": ws.memberships.count(),
        })


class CheckoutView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id):
        url = services.create_checkout_session(actor_membership=request.membership)
        return Response({"url": url})


class PortalView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id):
        url = services.create_portal_session(actor_membership=request.membership)
        return Response({"url": url})


class StripeWebhookView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request, workspace_id=None):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            # 400 tells Stripe to retry with a fresh signature.
            return Response(
                {"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST
            )

        services.handle_webhook_event(event)
        return Response(status=status.HTTP_200_OK)