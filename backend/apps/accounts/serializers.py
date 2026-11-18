from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User, WorkspaceMembership
from .roles import Role


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)
    initials = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name",
            "display_name", "initials",
            "active_workspace", "date_joined",
        )
        read_only_fields = fields

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=12)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = WorkspaceMembership
        fields = ("id", "user", "role", "created_at")
        read_only_fields = fields


class InviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Role.choices)


class ChangeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Role.choices)