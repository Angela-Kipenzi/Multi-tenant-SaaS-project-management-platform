from __future__ import annotations

from rest_framework import serializers

from .models import Issue, Sprint


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