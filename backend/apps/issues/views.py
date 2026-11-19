from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.boards.models import Board
from apps.projects.models import Project
from common.exceptions import NotFound
from common.permissions import HasWorkspaceContext

from . import services
from .models import Issue, Sprint
from .serializers import (
    AttachmentCreateSerializer,
    AttachmentSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    IssueCreateSerializer,
    IssueMoveSerializer,
    IssueSerializer,
    IssueUpdateSerializer,
    SprintCreateSerializer,
    SprintSerializer,
)


def _get_own_board(request, board_id) -> Board:
    board = (
        Board.objects.filter(workspace=request.workspace, id=board_id)
        .select_related("project")
        .first()
    )
    if not board:
        raise NotFound("Board not found.")
    return board


def _get_own_project(request, project_id) -> Project:
    project = Project.objects.filter(
        workspace=request.workspace, id=project_id
    ).first()
    if not project:
        raise NotFound("Project not found.")
    return project


class IssueListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, board_id):
        _get_own_board(request, board_id)
        issues = (
            Issue.objects.filter(workspace=request.workspace, board=board_id)
            .select_related("assignee", "reporter", "sprint", "column")
            .order_by("column__order", "order", "created_at")
        )
        return Response(IssueSerializer(issues, many=True).data)

    def post(self, request, workspace_id, board_id):
        _get_own_board(request, board_id)
        ser = IssueCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        issue = services.create_issue(
            actor_membership=request.membership,
            board_id=board_id,
            **ser.validated_data,
        )
        return Response(
            IssueSerializer(issue).data, status=status.HTTP_201_CREATED
        )


class IssueDetailView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, issue_id):
        issue = (
            Issue.objects.filter(workspace=request.workspace, id=issue_id)
            .select_related("assignee", "reporter", "sprint", "column")
            .first()
        )
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

    def delete(self, request, workspace_id, issue_id):
        services.delete_issue(
            actor_membership=request.membership, issue_id=issue_id
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class IssueHistoryView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, issue_id):
        issue = Issue.objects.filter(
            workspace=request.workspace, id=issue_id
        ).first()
        if not issue:
            raise NotFound("Issue not found.")
        history = (
            issue.history.select_related("history_user")
            .order_by("-history_date")[:100]
        )
        data = [
            {
                "history_id": h.history_id,
                "history_date": h.history_date,
                "history_user": h.history_user.email if h.history_user else None,
                "history_type": h.history_type,
                "title": h.title,
                "status": h.status,
                "priority": h.priority,
                "assignee_id": str(h.assignee_id) if h.assignee_id else None,
                "column_id": str(h.column_id),
            }
            for h in history
        ]
        return Response(data)


class CommentListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, issue_id):
        issue = Issue.objects.filter(
            workspace=request.workspace, id=issue_id
        ).first()
        if not issue:
            raise NotFound("Issue not found.")
        comments = issue.comments.select_related("author").order_by("created_at")
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
        return Response(AttachmentSerializer(issue.attachments.all(), many=True).data)

    def post(self, request, workspace_id, issue_id):
        ser = AttachmentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        attachment = services.create_attachment(
            actor_membership=request.membership,
            issue_id=issue_id,
            **ser.validated_data,
        )
        return Response(
            AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED
        )


class AttachmentDeleteView(APIView):
    permission_classes = [HasWorkspaceContext]

    def delete(self, request, workspace_id, attachment_id):
        services.delete_attachment(
            actor_membership=request.membership, attachment_id=attachment_id
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class SprintListCreateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, project_id):
        _get_own_project(request, project_id)
        sprints = Sprint.objects.filter(
            workspace=request.workspace, project_id=project_id
        ).order_by("-created_at")
        return Response(SprintSerializer(sprints, many=True).data)

    def post(self, request, workspace_id, project_id):
        _get_own_project(request, project_id)
        ser = SprintCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        sprint = services.create_sprint(
            actor_membership=request.membership,
            project_id=project_id,
            **ser.validated_data,
        )
        return Response(
            SprintSerializer(sprint).data, status=status.HTTP_201_CREATED
        )


class SprintActivateView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id, sprint_id):
        sprint = services.activate_sprint(
            actor_membership=request.membership, sprint_id=sprint_id
        )
        return Response(SprintSerializer(sprint).data)


class SprintCloseView(APIView):
    permission_classes = [HasWorkspaceContext]

    def post(self, request, workspace_id, sprint_id):
        sprint = services.close_sprint(
            actor_membership=request.membership, sprint_id=sprint_id
        )
        return Response(SprintSerializer(sprint).data)


class SprintDeleteView(APIView):
    permission_classes = [HasWorkspaceContext]

    def delete(self, request, workspace_id, sprint_id):
        services.delete_sprint(
            actor_membership=request.membership, sprint_id=sprint_id
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

from apps.accounts.models import User


class BoardReportView(APIView):
    permission_classes = [HasWorkspaceContext]

    def get(self, request, workspace_id, board_id):
        _get_own_board(request, board_id)

        issues = Issue.objects.filter(
            workspace=request.workspace, board_id=board_id
        )

        by_status: dict[str, int] = {}
        by_priority: dict[str, int] = {}
        by_assignee: dict[str, int] = {}
        by_column: dict[str, int] = {}

        for issue in issues:
            by_status[issue.status] = by_status.get(issue.status, 0) + 1
            by_priority[issue.priority] = by_priority.get(issue.priority, 0) + 1
            by_column[str(issue.column_id)] = by_column.get(str(issue.column_id), 0) + 1
            key = str(issue.assignee_id) if issue.assignee_id else "unassigned"
            by_assignee[key] = by_assignee.get(key, 0) + 1

        assignee_ids = [k for k in by_assignee.keys() if k != "unassigned"]
        assignee_lookup = {
            str(u.id): u.email
            for u in User.objects.filter(id__in=assignee_ids)
        }

        total = issues.count()
        done = by_status.get("done", 0)

        return Response({
            "total": total,
            "done": done,
            "completion_pct": round((done / total) * 100) if total else 0,
            "by_status": [
                {"key": k, "label": k.replace("_", " ").title(), "count": v}
                for k, v in by_status.items()
            ],
            "by_priority": [
                {"key": k, "label": k.title(), "count": v}
                for k, v in by_priority.items()
            ],
            "by_assignee": [
                {
                    "key": k,
                    "email": assignee_lookup.get(k, "Unassigned"),
                    "count": v,
                }
                for k, v in by_assignee.items()
            ],
            "by_column": by_column,
        })