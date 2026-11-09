from django.urls import path

from .views import IssueListCreateView

urlpatterns = [
    path(
        "workspaces/<uuid:workspace_id>/boards/<uuid:board_id>/issues/",
        IssueListCreateView.as_view(),
    ),
]