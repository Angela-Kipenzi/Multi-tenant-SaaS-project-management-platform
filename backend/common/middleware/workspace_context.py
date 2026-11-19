from __future__ import annotations

from django.utils.deprecation import MiddlewareMixin


class WorkspaceContextMiddleware(MiddlewareMixin):
    """Kept for compatibility with future use cases (session auth, cookie auth)."""

    def process_request(self, request):
        request.workspace = None
        request.membership = None
        return None
