from django.urls import path

from .views import MyMembershipsView, WorkspaceDetailView, WorkspaceListCreateView
from .views_health import HealthView

urlpatterns = [
    path("workspaces/", WorkspaceListCreateView.as_view()),
    path("workspaces/<uuid:workspace_id>/", WorkspaceDetailView.as_view()),
    path("me/memberships/", MyMembershipsView.as_view()),
    path("health/", HealthView.as_view()),
]
