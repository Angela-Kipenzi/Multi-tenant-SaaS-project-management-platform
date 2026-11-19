import pytest
from rest_framework.test import APIClient

from tests.factories.accounts import (
    MembershipFactory,
    OwnerMembershipFactory,
    UserFactory,
    WorkspaceFactory,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def owner(db):
    owner_membership = OwnerMembershipFactory()
    owner_membership.user.refresh_from_db()
    return owner_membership


@pytest.fixture
def owner_client(owner):
    client = APIClient()
    client.force_authenticate(owner.user)
    client.defaults["HTTP_X_WORKSPACE_ID"] = str(owner.workspace.id)
    return client


@pytest.fixture
def member(db):
    return MembershipFactory()


@pytest.fixture
def other_workspace(db):
    """Independent tenant used in every isolation test."""
    ws = WorkspaceFactory()
    user = UserFactory()
    OwnerMembershipFactory(user=user, workspace=ws)
    return ws
