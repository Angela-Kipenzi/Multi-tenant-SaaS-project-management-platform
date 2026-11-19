import factory
from factory.django import DjangoModelFactory

from apps.issues.models import Issue


class IssueFactory(DjangoModelFactory):
    class Meta:
        model = Issue
        skip_postgeneration_save = True

    workspace = factory.SelfAttribute("board.workspace")
    board = factory.SubFactory("tests.factories.boards.BoardFactory")
    project = factory.SelfAttribute("board.project")
    column = factory.SubFactory(
        "tests.factories.boards.ColumnFactory", board=factory.SelfAttribute("..board")
    )
    key = factory.Sequence(lambda n: f"TEST-{n}")
    number = factory.Sequence(lambda n: n + 1)
    title = factory.Sequence(lambda n: f"Issue {n}")
    description = ""
    order = 0
