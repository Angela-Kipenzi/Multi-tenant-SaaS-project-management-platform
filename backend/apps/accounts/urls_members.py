from django.urls import path

from .views_members import MemberDetailView, MemberListView

urlpatterns = [
    path("workspaces/<uuid:workspace_id>/members/", MemberListView.as_view()),
    path("workspaces/<uuid:workspace_id>/members/<uuid:user_id>/", MemberDetailView.as_view()),
]