import factory
from factory.django import DjangoModelFactory

from apps.boards.models import Board, Column


class BoardFactory(DjangoModelFactory):
    class Meta:
        model = Board

    workspace = factory.SelfAttribute("project.workspace")
    project = factory.SubFactory("tests.factories.projects.ProjectFactory")
    name = factory.Sequence(lambda n: f"Board {n}")


class ColumnFactory(DjangoModelFactory):
    class Meta:
        model = Column

    workspace = factory.SelfAttribute("board.workspace")
    board = factory.SubFactory(BoardFactory)
    name = factory.Sequence(lambda n: f"Column {n}")
    order = factory.Sequence(lambda n: n)