from django.contrib import admin

from .models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "plan", "subscription_status", "created_at")
    list_filter = ("plan", "subscription_status")
    search_fields = ("name", "slug", "stripe_customer_id")
    prepopulated_fields = {"slug": ("name",)}