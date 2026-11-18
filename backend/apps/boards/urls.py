from django.urls import path

from .views import BoardDetailView, BoardListCreateView, ColumnReorderView

urlpatterns = [
    path(
        "workspaces/<uuid:workspace_id>/projects/<uuid:project_id>/boards/",
        BoardListCreateView.as_view(),
    ),
    path(
        "workspaces/<uuid:workspace_id>/boards/<uuid:board_id>/columns/reorder/",
        ColumnReorderView.as_view(),
    ),
    path(
    "workspaces/<uuid:workspace_id>/boards/<uuid:board_id>/",
    BoardDetailView.as_view(),
),
]