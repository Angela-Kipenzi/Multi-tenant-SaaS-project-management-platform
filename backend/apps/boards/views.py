from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from common.exceptions import NotFound
from common.permissions import HasWorkspaceContext

from . import services
from .models import Board
from .serializers import (
    BoardCreateSerializer, BoardSerializer, ColumnReorderSerializer,
)


def _get_own_project(request, project_id) -> Project:
    project = Project.objects.filter(
        workspace=request.workspace, id=project_id
    ).first()
    if not project:
        raise NotFound("Project not found.")
    return project


class BoardListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, project_id):
        _get_own_project(request, project_id)
        boards = (
            Board.objects.filter(workspace=request.workspace, project_id=project_id)
            .prefetch_related("columns")
            .order_by("created_at")
        )
        return Response(BoardSerializer(boards, many=True).data)

    def post(self, request, workspace_id, project_id):
        _get_own_project(request, project_id)
        ser = BoardCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        board = services.create_board(
            actor_membership=request.membership,
            project_id=project_id,
            **ser.validated_data,
        )
        return Response(BoardSerializer(board).data, status=status.HTTP_201_CREATED)


class ColumnReorderView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id, board_id):
        # Reorder is scoped by board — verify the board first.
        board = Board.objects.filter(
            workspace=request.workspace, id=board_id
        ).first()
        if not board:
            raise NotFound("Board not found.")
        ser = ColumnReorderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        services.reorder_columns(
            actor_membership=request.membership,
            board_id=board_id,
            column_order=[str(c) for c in ser.validated_data["order"]],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)