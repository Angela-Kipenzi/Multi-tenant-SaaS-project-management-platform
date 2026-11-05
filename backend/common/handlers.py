"""DRF exception handler — converts domain errors to stable API shapes."""
from __future__ import annotations
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_handler
from .exceptions import (
    DomainError, NotFound, Forbidden, Conflict, PlanLimitExceeded,
)


def exception_handler(exc, context):
    # Handle DRF-native errors first (validation, auth, permission).
    response = drf_handler(exc, context)
    if response is not None:
        return response

    if isinstance(exc, PlanLimitExceeded):
        return Response(
            {"detail": exc.message, "code": exc.code, "resource": exc.resource},
            status=402,
        )
    if isinstance(exc, NotFound):
        return Response({"detail": exc.message, "code": exc.code}, status=404)
    if isinstance(exc, Forbidden):
        return Response({"detail": exc.message, "code": exc.code}, status=403)
    if isinstance(exc, Conflict):
        return Response({"detail": exc.message, "code": exc.code}, status=409)
    if isinstance(exc, DomainError):
        return Response({"detail": exc.message, "code": exc.code}, status=400)

    return None  # unhandled → Django 500