from django.urls import path

from .views import BillingPlanView, CheckoutView, PortalView, StripeWebhookView

urlpatterns = [
    path("workspaces/<uuid:workspace_id>/billing/plan/", BillingPlanView.as_view()),
    path("workspaces/<uuid:workspace_id>/billing/checkout/", CheckoutView.as_view()),
    path("workspaces/<uuid:workspace_id>/billing/portal/", PortalView.as_view()),
    path("billing/webhook/", StripeWebhookView.as_view()),
]