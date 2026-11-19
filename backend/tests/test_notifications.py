import pytest

from apps.issues import services
from apps.notifications.models import Notification
from apps.notifications.tasks import notify_assignment
from tests.factories.accounts import MembershipFactory, OwnerMembershipFactory
from tests.factories.boards import BoardFactory, ColumnFactory
from tests.factories.issues import IssueFactory
from tests.factories.projects import ProjectFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def board_setup(owner):
    project = ProjectFactory(workspace=owner.workspace)
    board = BoardFactory(workspace=owner.workspace, project=project)
    column = ColumnFactory(workspace=owner.workspace, board=board, order=0)
    return board, column


def test_task_creates_notification(owner, board_setup):
    board, column = board_setup
    assignee = MembershipFactory(workspace=owner.workspace).user
    issue = IssueFactory(workspace=owner.workspace, board=board, column=column)

    notify_assignment(
        user_id=str(assignee.id),
        workspace_id=str(owner.workspace.id),
        issue_id=str(issue.id),
    )

    notif = Notification.objects.filter(user=assignee, workspace=owner.workspace).first()
    assert notif is not None
    assert notif.kind == Notification.Kind.ASSIGNED
    assert notif.issue_id == issue.id


def test_task_skips_if_user_removed(owner, board_setup):
    board, column = board_setup
    stranger = OwnerMembershipFactory().user  # not in owner.workspace
    issue = IssueFactory(workspace=owner.workspace, board=board, column=column)

    notify_assignment(
        user_id=str(stranger.id),
        workspace_id=str(owner.workspace.id),
        issue_id=str(issue.id),
    )
    assert Notification.objects.count() == 0


def test_assignment_triggers_notification(owner, board_setup):
    """End-to-end: update_issue assigns a user -> task fires -> notification exists."""
    board, column = board_setup
    assignee = MembershipFactory(workspace=owner.workspace).user
    issue = IssueFactory(workspace=owner.workspace, board=board, column=column)

    services.update_issue(
        actor_membership=owner,
        issue_id=issue.id,
        assignee_id=assignee.id,
    )

    assert Notification.objects.filter(user=assignee).exists()
