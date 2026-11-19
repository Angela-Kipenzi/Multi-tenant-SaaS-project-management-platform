from django.urls import path

from .views import (
    AttachmentDeleteView,
    AttachmentListCreateView,
    BoardReportView,
    CommentDeleteView,
    CommentListCreateView,
    IssueDetailView,
    IssueHistoryView,
    IssueListCreateView,
    IssueMoveView,
    SprintActivateView,
    SprintCloseView,
    SprintDetailView,
    SprintListCreateView,
)

urlpatterns = [
    # ---- Issues ----
    path(
        "workspaces/<uuid:workspace_id>/boards/<uuid:board_id>/issues/",
        IssueListCreateView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/",
        IssueDetailView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/move/",
        IssueMoveView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/history/",
        IssueHistoryView.as_view(),
    ),

    # ---- Comments ----
    path(
        "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/comments/",
        CommentListCreateView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/comments/<uuid:comment_id>/",
        CommentDeleteView.as_view(),
    ),

    # ---- Attachments ----
    path(
        "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/attachments/",
        AttachmentListCreateView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/attachments/<uuid:attachment_id>/",
        AttachmentDeleteView.as_view(),
    ),

    # ---- Sprints ----
    path(
        "workspaces/<uuid:workspace_id>/projects/<uuid:project_id>/sprints/",
        SprintListCreateView.as_view(),
    ),
    # GET returns detail; DELETE removes the sprint — both handled by SprintDetailView
    path(
        "workspaces/<uuid:workspace_id>/sprints/<uuid:sprint_id>/",
        SprintDetailView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/sprints/<uuid:sprint_id>/activate/",
        SprintActivateView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/sprints/<uuid:sprint_id>/close/",
        SprintCloseView.as_view(),
    ),

    # ---- Reports ----
    path(
        "workspaces/<uuid:workspace_id>/boards/<uuid:board_id>/reports/",
        BoardReportView.as_view(),
    ),
]