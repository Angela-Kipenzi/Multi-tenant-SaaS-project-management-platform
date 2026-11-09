from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "workspace", "deleted_at")
    list_filter = ("workspace",)
    search_fields = ("name", "key")