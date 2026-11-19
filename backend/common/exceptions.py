"""Domain exceptions. Mapped to HTTP in common/handlers.py."""

from __future__ import annotations


class DomainError(Exception):
    """Base — becomes 400."""

    code = "domain_error"

    def __init__(self, message: str, *, code: str | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class NotFound(DomainError):
    code = "not_found"


class Forbidden(DomainError):
    code = "forbidden"


class Conflict(DomainError):
    code = "conflict"


class PlanLimitExceeded(DomainError):
    code = "plan_limit_exceeded"

    def __init__(self, message: str, *, resource: str):
        super().__init__(message, code="plan_limit_exceeded")
        self.resource = resource


class QuotaExceeded(PlanLimitExceeded):
    pass
