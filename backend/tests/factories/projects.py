import factory
from factory.django import DjangoModelFactory

from apps.projects.models import Project


class ProjectFactory(DjangoModelFactory):
    class Meta:
        model = Project

    workspace = factory.SubFactory("tests.factories.accounts.WorkspaceFactory")
    name = factory.Sequence(lambda n: f"Project {n}")
    key = factory.Sequence(lambda n: f"PRJ{n:03d}"[:8])