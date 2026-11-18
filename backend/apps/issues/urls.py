from django.urls import path

from .views import AttachmentListCreateView, AttachmentDeleteView, CommentListCreateView, CommentDeleteView, IssueHistoryView, IssueListCreateView, IssueDetailView, IssueMoveView, SprintActivateView, SprintCloseView, SprintListCreateView, SprintDeleteView

urlpatterns = [
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
    "workspaces/<uuid:workspace_id>/sprints/<uuid:sprint_id>/close/",
    SprintCloseView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/comments/",
    CommentListCreateView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/comments/<uuid:comment_id>/",
    CommentDeleteView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/attachments/",
    AttachmentListCreateView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/attachments/<uuid:attachment_id>/",
    AttachmentDeleteView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/issues/<uuid:issue_id>/history/",
    IssueHistoryView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/projects/<uuid:project_id>/sprints/",
    SprintListCreateView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/sprints/<uuid:sprint_id>/activate/",
    SprintActivateView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/sprints/<uuid:sprint_id>/close/",
    SprintCloseView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/sprints/<uuid:sprint_id>/",
    SprintDeleteView.as_view(),
),
]
