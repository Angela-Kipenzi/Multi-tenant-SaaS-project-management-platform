from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = ["*"]
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]  # speed only
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Middleware active in tests so tenant enforcement is exercised
MIDDLEWARE = MIDDLEWARE + [  # noqa: F405
    "common.middleware.workspace_context.WorkspaceContextMiddleware",
]
AXES_ENABLED = False
DEBUG = False
DEBUG_PROPAGATE_EXCEPTIONS = True