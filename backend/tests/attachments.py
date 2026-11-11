import pytest

from apps.issues import services
from common.exceptions import DomainError, Forbidden, NotFound
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


def _valid_key(issue):
    return f"{issue.workspace_id}/{issue.id}/abc.png"


def test_create_attachment(owner, issue):
    att = services.create_attachment(
        actor_membership=owner, issue_id=issue.id,
        file_key=_valid_key(issue), file_name="screenshot.png",
        file_size=1024, content_type="image/png",
    )
    assert att.file_name == "screenshot.png"


def test_wrong_prefix_rejected(owner, issue):
    with pytest.raises(DomainError) as exc:
        services.create_attachment(
            actor_membership=owner, issue_id=issue.id,
            file_key="other-ws/other-issue/abc.png",
            file_name="x.png", file_size=1, content_type="image/png",
        )
    assert exc.value.code == "bad_file_key"


def test_disallowed_content_type(owner, issue):
    with pytest.raises(DomainError) as exc:
        services.create_attachment(
            actor_membership=owner, issue_id=issue.id,
            file_key=_valid_key(issue), file_name="x.exe",
            file_size=1, content_type="application/x-msdownload",
        )
    assert exc.value.code == "bad_content_type"


def test_viewer_cannot_attach(issue):
    viewer = MembershipFactory(workspace=issue.workspace, role="viewer")
    with pytest.raises(Forbidden):
        services.create_attachment(
            actor_membership=viewer, issue_id=issue.id,
            file_key=_valid_key(issue), file_name="x.png",
            file_size=1, content_type="image/png",
        )