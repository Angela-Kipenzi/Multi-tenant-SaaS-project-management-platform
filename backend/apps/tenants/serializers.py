from __future__ import annotations

from rest_framework import serializers

from .models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = (
            "id",
            "name",
            "slug",
            "plan",
            "subscription_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "plan",
            "subscription_status",
            "created_at",
            "updated_at",
        )


class WorkspaceCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    slug = serializers.SlugField(max_length=140)