"""All account/membership business logic. Views and serializers must not implement any of this."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.tenants.models import Plan, Workspace
from common.exceptions import Conflict, DomainError, Forbidden, NotFound, PlanLimitExceeded

from .models import Invitation, User, WorkspaceMembership
from .roles import Role, has_capability, rank


INVITATION_TTL = timedelta(days=7)


@dataclass(frozen=True)
class InviteResult:
    membership: WorkspaceMembership | None
    invitation: Invitation | None


def register_user(*, email: str, password: str) -> User:
    if User.objects.filter(email__iexact=email).exists():
        raise Conflict("An account with this email already exists.", code="email_taken")
    return User.objects.create_user(email=email, password=password)


def create_workspace(*, creator: User, name: str, slug: str) -> Workspace:
    if Workspace.objects.filter(slug=slug).exists():
        raise Conflict("Slug already in use.", code="slug_taken")
    with transaction.atomic():
        workspace = Workspace.objects.create(name=name, slug=slug, plan=Plan.FREE)
        WorkspaceMembership.objects.create(
            user=creator, workspace=workspace, role=Role.OWNER
        )
        creator.active_workspace = workspace
        creator.save(update_fields=["active_workspace"])
    return workspace


def _assert_capability(membership: WorkspaceMembership, capability: str) -> None:
    if not has_capability(membership.role, capability):
        raise Forbidden(f"Role '{membership.role}' cannot perform '{capability}'.")


def invite_member(
    *, actor_membership: WorkspaceMembership, email: str, role: str
) -> InviteResult:
    _assert_capability(actor_membership, "member.invite")
    workspace = actor_membership.workspace

    if role not in Role.values:
        raise DomainError(f"Unknown role '{role}'.", code="invalid_role")
    if rank(role) > rank(actor_membership.role):
        raise Forbidden("Cannot invite a member with a higher role than your own.")
    if rank(role) == rank(Role.OWNER) and actor_membership.role != Role.OWNER:
        raise Forbidden("Only owners can grant ownership.")

    if WorkspaceMembership.objects.filter(
        workspace=workspace, user__email__iexact=email
    ).exists():
        raise Conflict("User is already a member.", code="already_member")

    if WorkspaceMembership.objects.filter(workspace=workspace).count() >= workspace.max_members:
        raise PlanLimitExceeded(
            f"Plan limit reached ({workspace.max_members} members).",
            resource="members",
        )

    existing_user = User.objects.filter(email__iexact=email).first()
    if existing_user:
        membership = WorkspaceMembership.objects.create(
            user=existing_user, workspace=workspace, role=role
        )
        return InviteResult(membership=membership, invitation=None)

    invitation = Invitation.objects.create(
        workspace=workspace,
        email=email.lower(),
        role=role,
        invited_by=actor_membership.user,
        expires_at=timezone.now() + INVITATION_TTL,
    )
    return InviteResult(membership=None, invitation=invitation)


def _active_owner_count(workspace: Workspace) -> int:
    return WorkspaceMembership.objects.filter(
        workspace=workspace, role=Role.OWNER
    ).count()


@transaction.atomic
def change_member_role(
    *, actor_membership: WorkspaceMembership, target_user_id, new_role: str
) -> WorkspaceMembership:
    _assert_capability(actor_membership, "member.change_role")
    if new_role not in Role.values:
        raise DomainError(f"Unknown role '{new_role}'.", code="invalid_role")
    if new_role == Role.OWNER:
        _assert_capability(actor_membership, "member.assign_owner")
    if rank(new_role) > rank(actor_membership.role):
        raise Forbidden("Cannot assign a role higher than your own.")

    workspace = actor_membership.workspace
    # select_for_update serializes concurrent role changes to prevent racing the last-owner invariant.
    membership = (
        WorkspaceMembership.objects
        .select_for_update()
        .filter(workspace=workspace, user_id=target_user_id)
        .first()
    )
    if not membership:
        raise NotFound("Membership not found.")

    if membership.role == Role.OWNER and new_role != Role.OWNER:
        if _active_owner_count(workspace) <= 1:
            raise Conflict("Cannot demote the last owner.", code="last_owner")

    membership.role = new_role
    membership.save(update_fields=["role", "updated_at"])
    return membership


@transaction.atomic
def remove_member(
    *, actor_membership: WorkspaceMembership, target_user_id
) -> None:
    _assert_capability(actor_membership, "member.remove")
    workspace = actor_membership.workspace
    membership = (
        WorkspaceMembership.objects
        .select_for_update()
        .filter(workspace=workspace, user_id=target_user_id)
        .first()
    )
    if not membership:
        raise NotFound("Membership not found.")
    if rank(membership.role) > rank(actor_membership.role):
        raise Forbidden("Cannot remove a member with a higher role than your own.")
    if membership.role == Role.OWNER and _active_owner_count(workspace) <= 1:
        raise Conflict("Cannot remove the last owner.", code="last_owner")

    membership.delete()


@transaction.atomic
def accept_invitation(*, token, user: User) -> WorkspaceMembership:
    invite = (
        Invitation.objects
        .select_for_update()
        .filter(token=token, accepted_at__isnull=True)
        .first()
    )
    if not invite:
        raise NotFound("Invitation not found.")
    if invite.expires_at < timezone.now():
        raise Conflict("Invitation expired.", code="invitation_expired")
    if invite.email.lower() != user.email.lower():
        raise Forbidden("Invitation was issued to a different email.")

    membership, _ = WorkspaceMembership.objects.get_or_create(
        user=user, workspace=invite.workspace,
        defaults={"role": invite.role},
    )
    invite.accepted_at = timezone.now()
    invite.save(update_fields=["accepted_at", "updated_at"])
    return membership