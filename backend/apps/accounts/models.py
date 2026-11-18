from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from common.models import TimestampedModel, UUIDModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email: str, password: str | None = None, **extra):
        if not email:
            raise ValueError("email is required")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        if extra["is_staff"] is not True or extra["is_superuser"] is not True:
            raise ValueError("superuser must set is_staff=True and is_superuser=True")
        return self.create_user(email, password, **extra)


class User(UUIDModel, AbstractUser):
    email = models.EmailField(unique=True)
    username = None
    # AbstractUser already has first_name and last_name (max_length=150 each)
    active_workspace = models.ForeignKey(
        "tenants.Workspace",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="active_users",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []
    objects = UserManager()

    def __str__(self) -> str:
        return self.email

    @property
    def display_name(self) -> str:
        full = f"{self.first_name} {self.last_name}".strip()
        return full or self.email.split("@")[0]

    @property
    def initials(self) -> str:
        first = (self.first_name or "").strip()
        last = (self.last_name or "").strip()
        if first and last:
            return f"{first[0]}{last[0]}".upper()
        if first:
            return first[:2].upper()
        return self.email[:2].upper()


class WorkspaceMembership(UUIDModel, TimestampedModel):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.MEMBER)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "workspace"], name="uniq_membership_user_workspace"
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "role"], name="idx_membership_ws_role"),
        ]


class Invitation(UUIDModel, TimestampedModel):
    """Pending invitation for an email that isn't a registered user yet."""
    workspace = models.ForeignKey(
        "tenants.Workspace", on_delete=models.CASCADE, related_name="invitations"
    )
    email = models.EmailField()
    role = models.CharField(max_length=16, choices=WorkspaceMembership.Role.choices)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "email"],
                condition=models.Q(accepted_at__isnull=True),
                name="uniq_pending_invite_per_workspace_email",
            ),
        ]