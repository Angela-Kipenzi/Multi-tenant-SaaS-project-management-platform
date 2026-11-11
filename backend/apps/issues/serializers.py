from __future__ import annotations

from rest_framework import serializers

from .models import Comment, Issue, Sprint, Attachment


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ("id", "name", "project", "start_date", "end_date", "is_active",
                  "created_at")
        read_only_fields = ("id", "project", "created_at")


class SprintCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)


class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = (
            "id", "key", "number", "project", "board", "column", "sprint",
            "title", "description", "status", "priority",
            "assignee", "reporter", "order", "created_at", "updated_at",
        )
        read_only_fields = ("id", "key", "number", "project", "board", "reporter",
                            "created_at", "updated_at")


class IssueCreateSerializer(serializers.Serializer):
    column_id = serializers.UUIDField()
    title = serializers.CharField(max_length=200, min_length=3)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    priority = serializers.ChoiceField(choices=Issue.Priority.choices, default=Issue.Priority.MEDIUM)
    sprint_id = serializers.UUIDField(required=False, allow_null=True)
    assignee_id = serializers.UUIDField(required=False, allow_null=True)

class IssueUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, min_length=3, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.ChoiceField(choices=Issue.Priority.choices, required=False)
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    sprint_id = serializers.UUIDField(required=False, allow_null=True)


class IssueMoveSerializer(serializers.Serializer):
    column_id = serializers.UUIDField()
    order = serializers.IntegerField(min_value=0)
    expected_updated_at = serializers.DateTimeField()

class CommentSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source="author.email", read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "issue", "author", "author_email", "body", "created_at")
        read_only_fields = ("id", "issue", "author", "created_at")


class CommentCreateSerializer(serializers.Serializer):
    body = serializers.CharField(min_length=1, max_length=10000)

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = (
            "id", "issue", "file_name", "file_size", "content_type",
            "uploaded_by", "created_at",
        )
        read_only_fields = fields


class AttachmentCreateSerializer(serializers.Serializer):
    file_key = serializers.CharField(max_length=512)
    file_name = serializers.CharField(max_length=255)
    file_size = serializers.IntegerField(min_value=1, max_value=25 * 1024 * 1024)
    content_type = serializers.CharField(max_length=100)