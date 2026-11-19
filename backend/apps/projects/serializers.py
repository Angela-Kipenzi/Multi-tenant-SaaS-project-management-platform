from __future__ import annotations

from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "key",
            "description",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")


class ProjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    key = serializers.RegexField(r"^[A-Za-z][A-Za-z0-9]{1,7}$")
    description = serializers.CharField(required=False, allow_blank=True, default="")
