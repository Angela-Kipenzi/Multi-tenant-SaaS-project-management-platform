import pytest

from apps.issues import services
from apps.issues.models import Comment
from common.exceptions import Forbidden, NotFound
from tests.factories.accounts import MembershipFactory, OwnerMembershipFactory
from tests.factories.boards import BoardFactory, ColumnFactory
from tests.factories.issues import IssueFactory
from tests.factories.projects import ProjectFactory


pytestmark = pytest.mark.django_db


@pytest.fixture
def issue(owner):
    project = ProjectFactory(workspace=owner.workspace)
    board = BoardFactory(workspace=owner.workspace, project=project)
    column = ColumnFactory(workspace=owner.workspace, board=board, order=0)
    return IssueFactory(workspace=owner.workspace, board=board, column=column)


def test_create_comment_on_own_issue(owner, issue):
    comment = services.create_comment(
        actor_membership=owner, issue_id=issue.id, body="Looks good."
    )
    assert comment.body == "Looks good."
    assert comment.author_id == owner.user_id


def test_member_can_comment(issue):
    member = MembershipFactory(workspace=issue.workspace)
    comment = services.create_comment(
        actor_membership=member, issue_id=issue.id, body="Me too."
    )
    assert comment.body == "Me too."


def test_viewer_cannot_comment(issue):
    viewer = MembershipFactory(workspace=issue.workspace, role="viewer")
    with pytest.raises(Forbidden):
        services.create_comment(
            actor_membership=viewer, issue_id=issue.id, body="nope"
        )


def test_delete_own_comment(owner, issue):
    comment = services.create_comment(
        actor_membership=owner, issue_id=issue.id, body="del"
    )
    services.delete_comment(actor_membership=owner, comment_id=comment.id)
    assert Comment.objects.filter(id=comment.id).exists() is False


def test_member_cannot_delete_others_comment(owner, issue):
    member = MembershipFactory(workspace=issue.workspace)
    comment = services.create_comment(
        actor_membership=owner, issue_id=issue.id, body="admin's"
    )
    with pytest.raises(Forbidden):
        services.delete_comment(actor_membership=member, comment_id=comment.id)