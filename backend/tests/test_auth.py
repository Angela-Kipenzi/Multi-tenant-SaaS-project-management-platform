import pytest
from django.urls import reverse


pytestmark = pytest.mark.django_db


def test_register_sets_refresh_cookie_and_returns_access(api_client):
    r = api_client.post(
        "/api/v1/auth/register/",
        {"email": "a@b.com", "password": "correct-horse-battery"},
        format="json",
    )
    assert r.status_code == 201
    assert "access" in r.data
    assert r.cookies["refresh_token"]["httponly"]


def test_register_rejects_duplicate_email(api_client, owner):
    r = api_client.post(
        "/api/v1/auth/register/",
        {"email": owner.user.email, "password": "correct-horse-battery"},
        format="json",
    )
    assert r.status_code == 409
    assert r.data["code"] == "email_taken"


def test_login_wrong_password_returns_401(api_client, owner):
    r = api_client.post(
        "/api/v1/auth/login/",
        {"email": owner.user.email, "password": "wrong"},
        format="json",
    )
    assert r.status_code == 401


def test_refresh_reads_from_cookie_not_body(api_client, owner):
    login = api_client.post(
        "/api/v1/auth/login/",
        {"email": owner.user.email, "password": "correct-horse-battery"},
        format="json",
    )
    assert login.status_code == 200
    api_client.cookies["refresh_token"] = login.cookies["refresh_token"].value
    r = api_client.post("/api/v1/auth/refresh/", {}, format="json")
    assert r.status_code == 200
    assert "access" in r.data