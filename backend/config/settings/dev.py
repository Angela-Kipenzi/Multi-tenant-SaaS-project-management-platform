import os

from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

# Add workspace-context middleware LAST (after auth resolves user)
MIDDLEWARE = MIDDLEWARE + [  # noqa: F405
    "common.middleware.workspace_context.WorkspaceContextMiddleware",
]

# Relax security in dev only
SECURE_SSL_REDIRECT = False

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = False