from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.boards.models import Board
from common.exceptions import NotFound
from common.permissions import HasWorkspaceContext

from . import services
from .models import Issue
from .serializers import (
    IssueCreateSerializer, IssueSerializer, IssueUpdateSerializer, IssueMoveSerializer, SprintSerializer
)



def _get_own_board(request, board_id) -> Board:
    """Fetches the board, raising 404 if not in the request's workspace."""
    board = (
        Board.objects.filter(workspace=request.workspace, id=board_id)
        .select_related("project")
        .first()
    )
    if not board:
        raise NotFound("Board not found.")
    return board


class IssueListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, board_id):
        board = _get_own_board(request, board_id)
        issues = (
            Issue.objects.filter(workspace=request.workspace, board=board)
            .select_related("assignee", "reporter", "sprint", "column")
            .order_by("column__order", "order", "created_at")
        )
        return Response(IssueSerializer(issues, many=True).data)

    def post(self, request, workspace_id, board_id):
        # Service also re-checks board, but the pre-check here is 404-safe
        # and keeps the failure consistent with GET.
        _get_own_board(request, board_id)
        ser = IssueCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        issue = services.create_issue(
            actor_membership=request.membership,
            board_id=board_id,
            **ser.validated_data,
        )
        return Response(IssueSerializer(issue).data, status=status.HTTP_201_CREATED)


class IssueDetailView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, issue_id):
        issue = Issue.objects.filter(
            workspace=request.workspace, id=issue_id
        ).select_related("assignee", "reporter", "sprint", "column").first()
        if not issue:
            raise NotFound("Issue not found.")
        return Response(IssueSerializer(issue).data)

    def patch(self, request, workspace_id, issue_id):
        ser = IssueUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        issue = services.update_issue(
            actor_membership=request.membership,
            issue_id=issue_id,
            **ser.validated_data,
        )
        return Response(IssueSerializer(issue).data)


class IssueMoveView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id, issue_id):
        ser = IssueMoveSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        issue = services.move_issue(
            actor_membership=request.membership,
            issue_id=issue_id,
            **ser.validated_data,
        )
        return Response(IssueSerializer(issue).data)


class SprintCloseView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id, sprint_id):
        sprint = services.close_sprint(
            actor_membership=request.membership, sprint_id=sprint_id
        )
        return Response(SprintSerializer(sprint).data)