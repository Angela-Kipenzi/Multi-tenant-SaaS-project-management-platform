from __future__ import annotations

from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission

from apps.accounts.roles import has_capability


class HasWorkspaceContext(BasePermission):
    """Ensures request.workspace is resolved; resolves it from URL/header if not already set."""

    message = "Workspace not found."

    def has_permission(self, request, view) -> bool:
        if getattr(request, "workspace", None) is not None:
            return True

        ws_id = view.kwargs.get("workspace_id") or request.headers.get("X-Workspace-ID")
        if not ws_id:
            raise NotFound("Workspace not found.")

        from apps.accounts.models import WorkspaceMembership

        membership = (
            WorkspaceMembership.objects
            .select_related("workspace")
            .filter(user=request.user, workspace_id=ws_id)
            .first()
        )
        if not membership:
            raise NotFound("Workspace not found.")

        request.workspace = membership.workspace
        request.membership = membership
        return True


class IsWorkspaceMember(BasePermission):
    def has_permission(self, request, view) -> bool:
        return getattr(request, "membership", None) is not None


class RequireCapability(BasePermission):
    def has_permission(self, request, view) -> bool:
        capability: str | None = getattr(view, "required_capability", None)
        if capability is None:
            return True
        membership = getattr(request, "membership", None)
        return bool(membership and has_capability(membership.role, capability))