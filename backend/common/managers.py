"""
Tenant-aware manager.

Design goal: make `Model.objects.filter(...)` on tenant-scoped models
REQUIRE a workspace_id in the filter, or raise. Fails loud, not silent.
"""
from __future__ import annotations
from django.db import models
from django.core.exceptions import ImproperlyConfigured


class MissingTenantFilter(ImproperlyConfigured):
    """Raised when a tenant-scoped queryset is queried without a workspace filter."""


class TenantQuerySet(models.QuerySet):
    _tenant_checked = False

    def for_workspace(self, workspace_id):
        return self.filter(workspace_id=workspace_id)

    def _validate_tenant(self):
        if self._tenant_checked:
            return
        # An empty queryset (e.g. `.none()`) is allowed.
        if self.query.is_empty():
            self._tenant_checked = True
            return
        where = self.query.where
        has_tenant = any(
            "workspace_id" in str(child)
            for child in getattr(where, "children", [])
        )
        if not has_tenant:
            raise MissingTenantFilter(
                f"Tenant-scoped query on {self.model.__name__} must filter by workspace_id. "
                "Use .for_workspace(workspace_id) or include workspace_id=... in .filter()."
            )
        self._tenant_checked = True

    def _fetch_all(self):
        self._validate_tenant()
        return super()._fetch_all()


class TenantManager(models.Manager.from_queryset(TenantQuerySet)):
    pass