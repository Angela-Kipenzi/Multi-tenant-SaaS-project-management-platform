from django.urls import path

from .views import NotificationListView, NotificationReadView

urlpatterns = [
    path("workspaces/<uuid:workspace_id>/notifications/", NotificationListView.as_view()),
    path(
        "workspaces/<uuid:workspace_id>/notifications/<uuid:notification_id>/read/",
        NotificationReadView.as_view(),
    ),
]
