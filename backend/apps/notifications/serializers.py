from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(
        source="actor.email", read_only=True, allow_null=True
    )
    actor_display_name = serializers.CharField(
        source="actor.display_name", read_only=True, allow_null=True
    )
    issue_key = serializers.CharField(
        source="payload.issue_key", read_only=True, default=None
    )

    class Meta:
        model = Notification
        fields = (
            "id", "kind", "issue", "issue_key",
            "actor_email", "actor_display_name",
            "payload", "read_at", "created_at",
        )
        read_only_fields = fields