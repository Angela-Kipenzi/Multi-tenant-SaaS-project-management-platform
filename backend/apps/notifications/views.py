from __future__ import annotations

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.exceptions import NotFound
from common.permissions import HasWorkspaceContext

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id):
        unread_only = request.query_params.get("unread") == "true"
        qs = Notification.objects.filter(
            workspace=request.workspace, user=request.user
        )
        if unread_only:
            qs = qs.filter(read_at__isnull=True)
        return Response(NotificationSerializer(qs[:100], many=True).data)


class NotificationReadView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id, notification_id):
        notif = Notification.objects.filter(
            workspace=request.workspace,
            user=request.user,
            id=notification_id,
        ).first()
        if not notif:
            raise NotFound("Notification not found.")
        notif.read_at = timezone.now()
        notif.save(update_fields=["read_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)