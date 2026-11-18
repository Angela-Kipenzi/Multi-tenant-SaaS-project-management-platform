from __future__ import annotations

from amqp import NotFound
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import HasWorkspaceContext, RequireCapability

from . import services
from .models import Invitation, WorkspaceMembership
from .serializers import ChangeRoleSerializer, InviteSerializer, MembershipSerializer


class MemberListView(APIView):
    permission_classes = [HasWorkspaceContext, RequireCapability]
    required_capability = "member.invite"  # Admins+ can view; tweak if read should be broader

    def get(self, request, workspace_id):
        qs = WorkspaceMembership.objects.filter(
            workspace=request.workspace
        ).select_related("user").order_by("created_at")
        return Response(MembershipSerializer(qs, many=True).data)

    def post(self, request, workspace_id):
        ser = InviteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = services.invite_member(
            actor_membership=request.membership, **ser.validated_data
        )
        payload = {
            "membership": (
                MembershipSerializer(result.membership).data
                if result.membership else None
            ),
            "invitation": (
                {"id": str(result.invitation.id), "email": result.invitation.email}
                if result.invitation else None
            ),
        }
        return Response(payload, status=status.HTTP_201_CREATED)


class MemberDetailView(APIView):
    permission_classes = [HasWorkspaceContext, RequireCapability]
    required_capability = "member.change_role"

    def patch(self, request, workspace_id, user_id):
        ser = ChangeRoleSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        membership = services.change_member_role(
            actor_membership=request.membership,
            target_user_id=user_id,
            new_role=ser.validated_data["role"],
        )
        return Response(MembershipSerializer(membership).data)

    def delete(self, request, workspace_id, user_id):
        services.remove_member(
            actor_membership=request.membership, target_user_id=user_id
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

class InvitationDetailView(APIView):
    """Returns the current invitation details for an email — used by the invitee UI."""
    permission_classes = [HasWorkspaceContext]
    required_capability = "member.invite"

    def get(self, request, workspace_id, invitation_id):
        invitation = Invitation.objects.filter(
            workspace=request.workspace, id=invitation_id
        ).first()
        if not invitation:
            raise NotFound("Invitation not found.")
        return Response({
            "id": str(invitation.id),
            "email": invitation.email,
            "role": invitation.role,
            "token": str(invitation.token),
            "expires_at": invitation.expires_at,
        })