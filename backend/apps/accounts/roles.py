"""Single source of truth for role → capability mapping.

Services check capabilities via `has_capability(role, capability)`, never
`role == "owner"`. This makes future role changes a one-line edit.
"""

from __future__ import annotations

from .models import WorkspaceMembership

Role = WorkspaceMembership.Role

# Ordered from least to most privileged for comparison checks.
ROLE_RANK: dict[str, int] = {
    Role.VIEWER: 1,
    Role.MEMBER: 2,
    Role.ADMIN: 3,
    Role.OWNER: 4,
}

CAPABILITIES: dict[str, set[str]] = {
    "workspace.update": {Role.OWNER, Role.ADMIN},
    "workspace.delete": {Role.OWNER},
    "member.invite": {Role.OWNER, Role.ADMIN},
    "member.remove": {Role.OWNER, Role.ADMIN},
    "member.change_role": {Role.OWNER, Role.ADMIN},
    "member.assign_owner": {Role.OWNER},
    "project.create": {Role.OWNER, Role.ADMIN},
    "project.update": {Role.OWNER, Role.ADMIN},
    "project.delete": {Role.OWNER, Role.ADMIN},
    "board.create": {Role.OWNER, Role.ADMIN},
    "issue.create": {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "issue.update_any": {Role.OWNER, Role.ADMIN},
    "issue.update_own": {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "issue.delete": {Role.OWNER, Role.ADMIN},
    "comment.create": {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "comment.delete": {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "billing.manage": {Role.OWNER},
}


def has_capability(role: str, capability: str) -> bool:
    return role in CAPABILITIES.get(capability, set())


def rank(role: str) -> int:
    return ROLE_RANK.get(role, 0)
