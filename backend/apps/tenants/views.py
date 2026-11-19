from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import services as account_services
from apps.accounts.models import WorkspaceMembership
from common.permissions import HasWorkspaceContext

from . import services
from .models import Workspace
from .serializers import WorkspaceCreateSerializer, WorkspaceSerializer


class WorkspaceListCreateView(APIView):
    def get(self, request):
        workspaces = Workspace.objects.filter(
            memberships__user=request.user, deleted_at__isnull=True
        ).distinct()
        return Response(WorkspaceSerializer(workspaces, many=True).data)

    def post(self, request):
        ser = WorkspaceCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        workspace = account_services.create_workspace(
            creator=request.user, **ser.validated_data
        )
        return Response(
            WorkspaceSerializer(workspace).data, status=status.HTTP_201_CREATED
        )


class WorkspaceDetailView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id):
        return Response(WorkspaceSerializer(request.workspace).data)

    def patch(self, request, workspace_id):
        workspace = services.update_workspace(
            actor_membership=request.membership,
            name=request.data.get("name"),
        )
        return Response(WorkspaceSerializer(workspace).data)

    def delete(self, request, workspace_id):
        services.delete_workspace(actor_membership=request.membership)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyMembershipsView(APIView):
    def get(self, request):
        qs = WorkspaceMembership.objects.filter(user=request.user).select_related(
            "workspace"
        )
        data = [
            {
                "workspace": WorkspaceSerializer(m.workspace).data,
                "role": m.role,
                "membership_id": str(m.id),
            }
            for m in qs
        ]
        return Response(data)