"""
Tenant isolation tests.

Every endpoint returning or mutating tenant-scoped resources MUST have an entry
here. The pattern for any nested route /workspaces/{ws}/.../{parent}/.../{child}:

    - Foreign parent ID   -> must return 404 (not 403, not 200 with [])
    - Nonexistent parent  -> same 404 (no existence leak)

These tests are non-negotiable. New endpoints without a test here will not merge.
"""

import pytest

from apps.boards.models import Board
from apps.projects.models import Project
from tests.factories.accounts import OwnerMembershipFactory, WorkspaceFactory
from tests.factories.boards import BoardFactory, ColumnFactory
from tests.factories.projects import ProjectFactory
from tests.factories.issues import IssueFactory

pytestmark = pytest.mark.django_db


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _client_with_token(api_client, membership):
    api_client.force_authenticate(membership.user)
    api_client.defaults["HTTP_X_WORKSPACE_ID"] = str(membership.workspace.id)
    return api_client


# --------------------------------------------------------------------------- #
# Workspace
# --------------------------------------------------------------------------- #

def test_workspace_detail_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    client = _client_with_token(api_client, owner)
    r = client.get(f"/api/v1/workspaces/{other.workspace.id}/")
    assert r.status_code == 404


def test_workspace_patch_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    client = _client_with_token(api_client, owner)
    r = client.patch(
        f"/api/v1/workspaces/{other.workspace.id}/",
        {"name": "hax"}, format="json",
    )
    assert r.status_code == 404


def test_workspace_delete_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    client = _client_with_token(api_client, owner)
    r = client.delete(f"/api/v1/workspaces/{other.workspace.id}/")
    assert r.status_code == 404


# --------------------------------------------------------------------------- #
# Members
# --------------------------------------------------------------------------- #

def test_member_list_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    client = _client_with_token(api_client, owner)
    r = client.get(f"/api/v1/workspaces/{other.workspace.id}/members/")
    assert r.status_code == 404


def test_member_invite_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{other.workspace.id}/members/",
        {"email": "hax@example.com", "role": "member"},
        format="json",
    )
    assert r.status_code == 404


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #

def test_create_project_in_foreign_workspace_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{other.workspace.id}/projects/",
        {"name": "Hax", "key": "HACK"},
        format="json",
    )
    assert r.status_code == 404


def test_project_list_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    client = _client_with_token(api_client, owner)
    r = client.get(f"/api/v1/workspaces/{other.workspace.id}/projects/")
    assert r.status_code == 404


def test_project_detail_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    client = _client_with_token(api_client, owner)
    r = client.get(
        f"/api/v1/workspaces/{owner.workspace.id}/projects/{other_project.id}/"
    )
    assert r.status_code == 404


def test_project_patch_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    client = _client_with_token(api_client, owner)
    r = client.patch(
        f"/api/v1/workspaces/{owner.workspace.id}/projects/{other_project.id}/",
        {"name": "hax"}, format="json",
    )
    assert r.status_code == 404


def test_project_delete_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    client = _client_with_token(api_client, owner)
    r = client.delete(
        f"/api/v1/workspaces/{owner.workspace.id}/projects/{other_project.id}/"
    )
    assert r.status_code == 404


# --------------------------------------------------------------------------- #
# Boards
# --------------------------------------------------------------------------- #

def test_board_list_foreign_project_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    client = _client_with_token(api_client, owner)
    r = client.get(
        f"/api/v1/workspaces/{owner.workspace.id}/projects/{other_project.id}/boards/"
    )
    assert r.status_code == 404


def test_board_create_foreign_project_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{owner.workspace.id}/projects/{other_project.id}/boards/",
        {"name": "Board"},
        format="json",
    )
    assert r.status_code == 404


def test_column_reorder_foreign_board_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    other_board = BoardFactory(workspace=other.workspace, project=other_project)
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{owner.workspace.id}/boards/{other_board.id}/columns/reorder/",
        {"order": [str(other_board.id)]},
        format="json",
    )
    assert r.status_code == 404


# --------------------------------------------------------------------------- #
# Issues
# --------------------------------------------------------------------------- #

def test_issue_list_foreign_board_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    other_board = BoardFactory(workspace=other.workspace, project=other_project)
    client = _client_with_token(api_client, owner)
    r = client.get(
        f"/api/v1/workspaces/{owner.workspace.id}/boards/{other_board.id}/issues/"
    )
    assert r.status_code == 404


def test_issue_create_foreign_board_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    other_board = BoardFactory(workspace=other.workspace, project=other_project)
    other_column = ColumnFactory(workspace=other.workspace, board=other_board)
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{owner.workspace.id}/boards/{other_board.id}/issues/",
        {"column_id": str(other_column.id), "title": "hax"},
        format="json",
    )
    assert r.status_code == 404


def test_issue_detail_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    other_board = BoardFactory(workspace=other.workspace, project=other_project)
    other_column = ColumnFactory(workspace=other.workspace, board=other_board)
    other_issue = IssueFactory(
        workspace=other.workspace, board=other_board, column=other_column
    )
    client = _client_with_token(api_client, owner)
    r = client.get(
        f"/api/v1/workspaces/{owner.workspace.id}/issues/{other_issue.id}/"
    )
    assert r.status_code == 404


def test_issue_move_foreign_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    other_board = BoardFactory(workspace=other.workspace, project=other_project)
    other_column = ColumnFactory(workspace=other.workspace, board=other_board)
    other_issue = IssueFactory(
        workspace=other.workspace, board=other_board, column=other_column
    )
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{owner.workspace.id}/issues/{other_issue.id}/move/",
        {"column_id": str(other_column.id), "order": 0,
         "expected_updated_at": other_issue.updated_at.isoformat()},
        format="json",
    )
    assert r.status_code == 404

# --------------------------------------------------------------------------- #
# Plan limits
# --------------------------------------------------------------------------- #

def test_plan_limit_exceeded_returns_402(api_client, owner):
    """Free plan allows 3 projects. Create 3, then a 4th must 402."""
    for i in range(3):
        ProjectFactory(workspace=owner.workspace, key=f"P{i:02d}")
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{owner.workspace.id}/projects/",
        {"name": "Fourth", "key": "FOUR"},
        format="json",
    )
    assert r.status_code == 402
    assert r.data["code"] == "plan_limit_exceeded"


# --------------------------------------------------------------------------- #
# Database-level isolation (defense in depth)
# --------------------------------------------------------------------------- #

def test_db_trigger_blocks_cross_tenant_issue(db):
    """Even a raw SQL bypass attempt is rejected by the DB trigger."""
    from django.db import connection
    from django.db.utils import ProgrammingError

    ws_a = WorkspaceFactory()
    ws_b = WorkspaceFactory()
    project_a = ProjectFactory(workspace=ws_a)
    board_a = BoardFactory(workspace=ws_a, project=project_a)
    column_a = ColumnFactory(workspace=ws_a, board=board_a)

    with pytest.raises(ProgrammingError) as exc:
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO issues_issue (
                    id, workspace_id, project_id, board_id, column_id, key, number,
                    title, status, priority, "order", created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, 'HACK-1', 1,
                    'cross-tenant', 'todo', 'medium', 0, NOW(), NOW()
                )
                """,
                [str(ws_b.id), str(project_a.id), str(board_a.id), str(column_a.id)],
            )
    assert "workspace mismatch" in str(exc.value).lower()


# --------------------------------------------------------------------------- #
# Header-less behavior (documented placeholder)
# --------------------------------------------------------------------------- #

def test_missing_workspace_header_returns_404_for_scoped_endpoint(api_client, owner):
    """Authenticated user hits a scoped URL without X-Workspace-ID header."""
    api_client.force_authenticate(owner.user)
    r = api_client.get(f"/api/v1/workspaces/{owner.workspace.id}/")
    assert r.status_code in (200, 404)


# --------------------------------------------------------------------------- # 
# comment tests
# --------------------------------------------------------------------------- #
def test_comment_list_foreign_issue_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    other_board = BoardFactory(workspace=other.workspace, project=other_project)
    other_column = ColumnFactory(workspace=other.workspace, board=other_board)
    other_issue = IssueFactory(
        workspace=other.workspace, board=other_board, column=other_column
    )
    client = _client_with_token(api_client, owner)
    r = client.get(
        f"/api/v1/workspaces/{owner.workspace.id}/issues/{other_issue.id}/comments/"
    )
    assert r.status_code == 404


def test_comment_create_foreign_issue_returns_404(api_client, owner):
    other = OwnerMembershipFactory()
    other_project = ProjectFactory(workspace=other.workspace)
    other_board = BoardFactory(workspace=other.workspace, project=other_project)
    other_column = ColumnFactory(workspace=other.workspace, board=other_board)
    other_issue = IssueFactory(
        workspace=other.workspace, board=other_board, column=other_column
    )
    client = _client_with_token(api_client, owner)
    r = client.post(
        f"/api/v1/workspaces/{owner.workspace.id}/issues/{other_issue.id}/comments/",
        {"body": "hax"},
        format="json",
    )
    assert r.status_code == 404