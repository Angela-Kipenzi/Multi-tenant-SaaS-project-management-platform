from django.urls import path

from .views import ProjectDetailView, ProjectListCreateView

urlpatterns = [
    path("workspaces/<uuid:workspace_id>/projects/", ProjectListCreateView.as_view()),
    path("workspaces/<uuid:workspace_id>/projects/<uuid:project_id>/", ProjectDetailView.as_view()),
]