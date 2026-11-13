from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.accounts.services import create_workspace
from apps.boards.services import create_board
from apps.projects.services import create_project


class Command(BaseCommand):
    help = "Seed demo user, workspace, project, and a starter board."

    def handle(self, *args, **options):
        email = "demo@example.com"
        password = "correct-horse-battery"

        user, created = User.objects.get_or_create(
            email=email, defaults={"username": email}
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(f"Created user: {email}")
        else:
            self.stdout.write(f"User exists: {email}")

        membership = user.memberships.first()
        if not membership:
            workspace = create_workspace(creator=user, name="Acme", slug="acme-demo")
            membership = user.memberships.first()
            self.stdout.write(f"Created workspace: {workspace.slug}")
        else:
            self.stdout.write(f"Workspace exists: {membership.workspace.slug}")

        # Create project if none exists
        from apps.projects.models import Project
        project = Project.objects.filter(workspace=membership.workspace).first()
        if not project:
            project = create_project(
                actor_membership=membership,
                name="Engineering",
                key="ENG",
                description="Demo project",
            )
            self.stdout.write(f"Created project: {project.key}")
        else:
            self.stdout.write(f"Project exists: {project.key}")

        # Create board if none exists
        from apps.boards.models import Board
        board = Board.objects.filter(project=project).first()
        if not board:
            board = create_board(
                actor_membership=membership,
                project_id=project.id,
                name="Sprint 1",
            )
            self.stdout.write(f"Created board: {board.name} (with {board.columns.count()} columns)")
        else:
            self.stdout.write(f"Board exists: {board.name}")

        self.stdout.write(self.style.SUCCESS(
            f"\nLogin with:\n  email: {email}\n  password: {password}"
        ))