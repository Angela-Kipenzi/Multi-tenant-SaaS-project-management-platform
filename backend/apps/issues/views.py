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
from .serializers import CommentCreateSerializer, CommentSerializer
from .serializers import AttachmentCreateSerializer, AttachmentSerializer



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


class CommentListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, issue_id):
        # Verify issue belongs to workspace, then list comments.
        issue = Issue.objects.filter(
            workspace=request.workspace, id=issue_id
        ).first()
        if not issue:
            raise NotFound("Issue not found.")

        comments = (
            issue.comments
            .select_related("author")
            .order_by("created_at")
        )
        return Response(CommentSerializer(comments, many=True).data)

    def post(self, request, workspace_id, issue_id):
        ser = CommentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        comment = services.create_comment(
            actor_membership=request.membership,
            issue_id=issue_id,
            body=ser.validated_data["body"],
        )
        return Response(
            CommentSerializer(comment).data, status=status.HTTP_201_CREATED
        )


class CommentDeleteView(APIView):
    permission_classes = [HasWorkspaceContext]

    def delete(self, request, workspace_id, comment_id):
        services.delete_comment(
            actor_membership=request.membership, comment_id=comment_id
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

class AttachmentListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, issue_id):
        issue = Issue.objects.filter(
            workspace=request.workspace, id=issue_id
        ).first()
        if not issue:
            raise NotFound("Issue not found.")
        attachments = issue.attachments.all()
        return Response(AttachmentSerializer(attachments, many=True).data)

    def post(self, request, workspace_id, issue_id):
        ser = AttachmentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        attachment = services.create_attachment(
            actor_membership=request.membership,
            issue_id=issue_id,
            **ser.validated_data,
        )
        return Response(
            AttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )


class AttachmentDeleteView(APIView):
    permission_classes = [HasWorkspaceContext]

    def delete(self, request, workspace_id, attachment_id):
        services.delete_attachment(
            actor_membership=request.membership, attachment_id=attachment_id
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

class IssueHistoryView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, issue_id):
        issue = Issue.objects.filter(
            workspace=request.workspace, id=issue_id
        ).first()
        if not issue:
            raise NotFound("Issue not found.")

        history = issue.history.select_related("history_user").order_by("-history_date")[:100]
        data = [
            {
                "history_id": h.history_id,
                "history_date": h.history_date,
                "history_user": h.history_user.email if h.history_user else None,
                "history_type": h.history_type,   # "+", "~", "-"
                "title": h.title,
                "status": h.status,
                "priority": h.priority,
                "assignee_id": str(h.assignee_id) if h.assignee_id else None,
                "column_id": str(h.column_id),
            }
            for h in history
        ]
        return Response(data)