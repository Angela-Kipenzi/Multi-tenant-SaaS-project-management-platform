from __future__ import annotations

from rest_framework import serializers

from .models import Board, Column


class ColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ("id", "name", "order")


class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ("id", "project", "name", "columns", "created_at")
        read_only_fields = ("id", "project", "created_at")


class BoardCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)


class ColumnReorderSerializer(serializers.Serializer):
    order = serializers.ListField(
        child=serializers.UUIDField(), min_length=1, max_length=20
    )

class BoardUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, required=False)