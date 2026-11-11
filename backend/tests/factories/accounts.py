import factory
from factory.django import DjangoModelFactory

from apps.accounts.models import User, WorkspaceMembership
from apps.accounts.roles import Role
from apps.tenants.models import Plan, Workspace


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@example.com")

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if not create:
            return
        self.set_password(extracted or "correct-horse-battery")
        self.save()
        
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