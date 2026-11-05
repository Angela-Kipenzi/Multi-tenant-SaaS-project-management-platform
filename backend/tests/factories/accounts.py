import factory
from factory.django import DjangoModelFactory

from apps.accounts.models import User, WorkspaceMembership
from apps.accounts.roles import Role
from apps.tenants.models import Plan, Workspace


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    password = factory.PostGenerationMethodCall("set_password", "correct-horse-battery")


class WorkspaceFactory(DjangoModelFactory):
    class Meta:
        model = Workspace

    name = factory.Sequence(lambda n: f"Acme {n}")
    slug = factory.Sequence(lambda n: f"acme-{n}")
    plan = Plan.FREE


class MembershipFactory(DjangoModelFactory):
    class Meta:
        model = WorkspaceMembership

    user = factory.SubFactory(UserFactory)
    workspace = factory.SubFactory(WorkspaceFactory)
    role = Role.MEMBER


class OwnerMembershipFactory(MembershipFactory):
    role = Role.OWNER