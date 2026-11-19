from datetime import timedelta

import pytest

from apps.issues import services
from apps.issues.models import Issue
from common.exceptions import Conflict, Forbidden
from tests.factories.accounts import MembershipFactory
from tests.factories.boards import BoardFactory, ColumnFactory
from tests.factories.issues import IssueFactory
from tests.factories.projects import ProjectFactory

pytestmark = pytest.mark.django_db


def _setup_board(owner):
    project = ProjectFactory(workspace=owner.workspace)
    board = BoardFactory(workspace=owner.workspace, project=project)
    todo = ColumnFactory(workspace=owner.workspace, board=board, name="To Do", order=0)
    done = ColumnFactory(workspace=owner.workspace, board=board, name="Done", order=1)
    return project, board, todo, done


def test_move_issue_within_column(owner):
    _, board, todo, done = _setup_board(owner)
    issues = [IssueFactory(workspace=owner.workspace, board=board, column=todo, order=i)
              for i in range(3)]

    moved = services.move_issue(
        actor_membership=owner, issue_id=issues[0].id,
        column_id=todo.id, order=2, expected_updated_at=issues[0].updated_at,
    )
    assert moved.order == 2

    # Orders are re-indexed.
    orders = list(Issue.objects.filter(workspace=owner.workspace, column=todo)
                  .order_by("order").values_list("id", "order"))
    assert [o for _, o in orders] == [0, 1, 2]


def test_move_issue_across_columns(owner):
    _, board, todo, done = _setup_board(owner)
    issue = IssueFactory(workspace=owner.workspace, board=board, column=todo, order=0)

    moved = services.move_issue(
        actor_membership=owner, issue_id=issue.id,
        column_id=done.id, order=0, expected_updated_at=issue.updated_at,
    )
    assert moved.column_id == done.id


def test_move_issue_stale_returns_conflict(owner):
    _, board, todo, done = _setup_board(owner)
    issue = IssueFactory(workspace=owner.workspace, board=board, column=todo, order=0)

    stale = issue.updated_at - timedelta(seconds=1)

    with pytest.raises(Conflict) as exc:
        services.move_issue(
            actor_membership=owner, issue_id=issue.id,
            column_id=done.id, order=0, expected_updated_at=stale,
        )
    assert exc.value.code == "stale_write"


def test_move_issue_to_wrong_board_column_returns_conflict(owner):
    _, board, todo, done = _setup_board(owner)
    other_project = ProjectFactory(workspace=owner.workspace)
    other_board = BoardFactory(workspace=owner.workspace, project=other_project)
    other_column = ColumnFactory(workspace=owner.workspace, board=other_board, order=0)

    issue = IssueFactory(workspace=owner.workspace, board=board, column=todo, order=0)

    with pytest.raises(Conflict) as exc:
        services.move_issue(
            actor_membership=owner, issue_id=issue.id,
            column_id=other_column.id, order=0, expected_updated_at=issue.updated_at,
        )
    assert exc.value.code == "wrong_board"


def test_close_sprint_moves_incomplete_to_backlog(owner):
    from apps.issues.models import Sprint
    project = ProjectFactory(workspace=owner.workspace)
    board = BoardFactory(workspace=owner.workspace, project=project)
    column = ColumnFactory(workspace=owner.workspace, board=board, order=0)
    sprint = Sprint.objects.create(
        workspace=owner.workspace, project=project, name="S1", is_active=True
    )
    done_issue = IssueFactory(workspace=owner.workspace, board=board,
                              column=column, sprint=sprint, status="done")
    open_issue = IssueFactory(workspace=owner.workspace, board=board,
                              column=column, sprint=sprint, status="in_progress")

    services.close_sprint(actor_membership=owner, sprint_id=sprint.id)

    done_issue.refresh_from_db()
    open_issue.refresh_from_db()
    assert done_issue.sprint_id == sprint.id        # done stays
    assert open_issue.sprint_id is None             # incomplete → backlog

def test_issue_history_records_update(owner):
    _, board, column, _ = _setup_board(owner)
    issue = IssueFactory(workspace=owner.workspace, board=board, column=column)

    services.update_issue(
        actor_membership=owner, issue_id=issue.id, title="Renamed"
    )

    history = issue.history.all().order_by("history_date")
    assert history.count() == 2   # create + update
    assert history.last().title == "Renamed"

def test_delete_issue_soft_deletes(owner):
    project = ProjectFactory(workspace=owner.workspace)
    board = BoardFactory(workspace=owner.workspace, project=project)
    column = ColumnFactory(workspace=owner.workspace, board=board)
    issue = IssueFactory(workspace=owner.workspace, board=board, column=column)

    services.delete_issue(actor_membership=owner, issue_id=issue.id)

    issue.refresh_from_db()
    assert issue.deleted_at is not None


def test_member_cannot_delete_issue(owner):
    member = MembershipFactory(workspace=owner.workspace, role="member")
    project = ProjectFactory(workspace=owner.workspace)
    board = BoardFactory(workspace=owner.workspace, project=project)
    column = ColumnFactory(workspace=owner.workspace, board=board)
    issue = IssueFactory(workspace=owner.workspace, board=board, column=column)

    with pytest.raises(Forbidden):
        services.delete_issue(actor_membership=member, issue_id=issue.id)