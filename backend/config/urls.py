from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

api_v1_patterns = [
    path("auth/", include("apps.accounts.urls_auth")),
    path("", include("apps.accounts.urls_members")),
    path("", include("apps.tenants.urls")),
    # Enabled as each phase lands:
    # path("", include("apps.projects.urls")),       # Phase C
    # path("", include("apps.boards.urls")),         # Phase C
    # path("", include("apps.issues.urls")),         # Phase C
    # path("", include("apps.audit.urls")),          # Phase E
    # path("", include("apps.notifications.urls")),  # Phase E
    # path("", include("apps.billing.urls")),        # Phase F
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema")),
]