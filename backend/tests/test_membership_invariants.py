import pytest

from apps.accounts import services
from apps.accounts.models import WorkspaceMembership
from apps.accounts.roles import Role
from common.exceptions import Conflict, Forbidden, PlanLimitExceeded
from tests.factories.accounts import MembershipFactory, UserFactory

pytestmark = pytest.mark.django_db


def test_cannot_demote_last_owner(owner):
    with pytest.raises(Conflict) as exc:
        services.change_member_role(
            actor_membership=owner,
            target_user_id=owner.user.id,
            new_role=Role.ADMIN,
        )
    assert exc.value.code == "last_owner"


def test_cannot_remove_last_owner(owner):
    with pytest.raises(Conflict):
        services.remove_member(actor_membership=owner, target_user_id=owner.user.id)


def test_admin_cannot_grant_owner(owner):
    admin_user = UserFactory()
    admin = MembershipFactory(user=admin_user, workspace=owner.workspace, role=Role.ADMIN)
    target = MembershipFactory(workspace=owner.workspace, role=Role.MEMBER)
    with pytest.raises(Forbidden):
        services.change_member_role(
            actor_membership=admin,
            target_user_id=target.user.id,
            new_role=Role.OWNER,
        )


def test_invite_hits_plan_limit_on_free_workspace(owner):
    for _ in range(4):  # 1 owner + 4 = 5 = free limit
        MembershipFactory(workspace=owner.workspace)
    with pytest.raises(PlanLimitExceeded):
        services.invite_member(
            actor_membership=owner,
            email="new@example.com",
            role=Role.MEMBER,
        )


def test_invite_existing_user_creates_membership(owner):
    existing = UserFactory()
    result = services.invite_member(actor_membership=owner, email=existing.email, role=Role.MEMBER)
    assert result.membership is not None
    assert result.invitation is None
    assert WorkspaceMembership.objects.filter(workspace=owner.workspace, user=existing).exists()


def test_invite_unknown_email_creates_pending_invitation(owner):
    result = services.invite_member(
        actor_membership=owner, email="ghost@example.com", role=Role.MEMBER
    )
    assert result.membership is None
    assert result.invitation is not None
