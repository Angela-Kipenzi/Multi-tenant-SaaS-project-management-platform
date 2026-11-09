from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.exceptions import NotFound
from common.permissions import HasWorkspaceContext

from . import services
from .models import Project
from .serializers import ProjectCreateSerializer, ProjectSerializer


def _get_own_project(request, project_id) -> Project:
    project = Project.objects.filter(
        workspace=request.workspace, id=project_id
    ).first()
    if not project:
        raise NotFound("Project not found.")
    return project


class ProjectListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id):
        projects = Project.objects.filter(
            workspace=request.workspace
        ).order_by("-created_at")
        return Response(ProjectSerializer(projects, many=True).data)

    def post(self, request, workspace_id):
        ser = ProjectCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        project = services.create_project(
            actor_membership=request.membership, **ser.validated_data
        )
        return Response(
            ProjectSerializer(project).data, status=status.HTTP_201_CREATED
        )


class ProjectDetailView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, project_id):
        project = _get_own_project(request, project_id)
        return Response(ProjectSerializer(project).data)

    def patch(self, request, workspace_id, project_id):
        project = services.update_project(
            actor_membership=request.membership,
            project_id=project_id,
            name=request.data.get("name"),
            description=request.data.get("description"),
        )
        return Response(ProjectSerializer(project).data)

    def delete(self, request, workspace_id, project_id):
        services.delete_project(
            actor_membership=request.membership, project_id=project_id
        )
        return Response(status=status.HTTP_204_NO_CONTENT)