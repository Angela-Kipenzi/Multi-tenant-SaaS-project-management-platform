from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from . import services
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


REFRESH_COOKIE = "refresh_token"


def _set_refresh_cookie(response: Response, refresh: str) -> None:
    # HttpOnly prevents JS access; Secure + SameSite=Strict prevents CSRF and cleartext leakage.
    response.set_cookie(
        REFRESH_COOKIE,
        refresh,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Strict",
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path="/api/v1/auth/",
    )


def _tokens_for(user) -> tuple[str, str]:
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = services.register_user(**ser.validated_data)
        access, refresh = _tokens_for(user)
        resp = Response(
            {"access": access, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        _set_refresh_cookie(resp, refresh)
        return resp


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        from django.contrib.auth import authenticate
        user = authenticate(
            request._request,
            username=ser.validated_data["email"],
            password=ser.validated_data["password"],
        )
        if not user:
            return Response(
                {"detail": "Invalid credentials.", "code": "auth_failed"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        access, refresh = _tokens_for(user)
        resp = Response({"access": access, "user": UserSerializer(user).data})
        _set_refresh_cookie(resp, refresh)
        return resp


class CookieRefreshView(TokenRefreshView):
    """Reads refresh from the HttpOnly cookie instead of the request body."""

    def post(self, request, *args, **kwargs):
        token = request.COOKIES.get(REFRESH_COOKIE)
        if not token:
            return Response(
                {"detail": "Missing refresh token.", "code": "no_refresh"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        request.data["refresh"] = token
        response = super().post(request, *args, **kwargs)
        new_refresh = response.data.pop("refresh", None)
        if new_refresh:
            _set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.COOKIES.get(REFRESH_COOKIE)
        if token:
            try:
                RefreshToken(token).blacklist()
            except Exception:
                pass
        resp = Response(status=status.HTTP_204_NO_CONTENT)
        resp.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth/")
        return resp


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)