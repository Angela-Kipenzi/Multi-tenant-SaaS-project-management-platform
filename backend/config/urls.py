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
    
    path("", include("apps.projects.urls")),       
    path("", include("apps.boards.urls")),         
    path("", include("apps.issues.urls")),         
    # path("", include("apps.audit.urls")),          
    path("", include("apps.notifications.urls")), 
    # path("", include("apps.billing.urls")),        
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema")),
]