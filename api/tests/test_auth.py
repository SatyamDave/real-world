"""Email sign-in, sessions, sign-out and account deletion (product/accounts.md)."""

import re
import sqlite3
import urllib.request
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from rw import settings
from rw_api import app as api
from rw_api import auth

ORIGIN = "http://localhost:5173"
JSON = {"Origin": ORIGIN}
NOW = datetime(2026, 10, 12, 12, 0, tzinfo=UTC)


@pytest.fixture(autouse=True)
def home(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path))
    for name in ("ANTHROPIC_API_KEY", "RW_EMAIL_API_KEY", "RW_EMAIL_FROM", "RW_ALLOWED_ORIGINS"):
        monkeypatch.delenv(name, raising=False)
    at(monkeypatch, NOW)
    return tmp_path


def at(mp, when):
    mp.setattr(api, "_clock", lambda: when)


@pytest.fixture
def client():
    with TestClient(api.app, base_url="http://localhost") as c:
        yield c


def request_email(client, email="ada@example.org", headers=JSON):
    return client.post("/v1/auth/email", json={"email": email}, headers=headers)


def outbox(home):
    """(token, code) from the newest email in the outbox."""
    path = max((home / "outbox").glob("*.eml"), key=lambda p: p.stat().st_mtime_ns)
    found = re.search(
        r"#token=(\S+)\n\nOr type this code on the sign-in page: (\d{6})", path.read_text()
    )
    assert found, path.read_text()
    return found.group(1), found.group(2)


def verify(client, **body):
    return client.post("/v1/auth/verify", json=body, headers=JSON)


def sign_in(client, home, email="ada@example.org"):
    assert request_email(client, email).status_code == 202
    token, _ = outbox(home)
    r = verify(client, token=token)
    assert r.status_code == 200, r.text
    return r


def test_without_a_provider_key_the_email_lands_in_the_outbox(client, home):
    r = request_email(client, "Ada@Example.org")
    assert r.status_code == 202 and r.json() == {"email": "ada@example.org", "ttl_minutes": 15}
    [path] = (home / "outbox").glob("*.eml")
    text = path.read_text()
    assert "To: ada@example.org" in text and f"{ORIGIN}/sign-in/confirm#token=" in text
    token, code = outbox(home)
    with api.connect() as conn:
        row = conn.execute("SELECT * FROM sign_in_tokens").fetchone()
    assert token not in str(tuple(row)) and code not in str(tuple(row))
    assert row["token_sha256"] == auth.sha(token)


def test_a_token_works_once_and_not_after_expiry(client, home, monkeypatch):
    request_email(client)
    token, code = outbox(home)
    assert verify(client, token=token).json()["email"] == "ada@example.org"
    again = verify(client, token=token)
    assert again.status_code == 400 and again.json()["code"] == "sign_in_invalid"
    assert verify(client, email="ada@example.org", code=code).status_code == 400

    request_email(client)
    token, code = outbox(home)
    at(monkeypatch, NOW + timedelta(minutes=settings.SIGN_IN_TTL_MINUTES, seconds=1))
    assert verify(client, token=token).status_code == 400
    assert verify(client, email="ada@example.org", code=code).status_code == 400


def test_a_code_signs_in_once(client, home):
    request_email(client)
    _, code = outbox(home)
    assert verify(client, email="ada@example.org", code=code).status_code == 200
    assert verify(client, email="ada@example.org", code=code).status_code == 400


def test_five_wrong_codes_end_the_token(client, home):
    request_email(client)
    token, code = outbox(home)
    wrong = f"{(int(code) + 1) % 10**6:06d}"
    for _ in range(settings.SIGN_IN_CODE_ATTEMPTS):
        r = verify(client, email="ada@example.org", code=wrong)
        assert r.status_code == 400 and r.json()["code"] == "sign_in_invalid"
    assert verify(client, email="ada@example.org", code=code).status_code == 400
    assert verify(client, token=token).status_code == 400


def test_wrong_codes_are_throttled_per_address(client, monkeypatch):
    monkeypatch.setattr(settings, "SIGN_IN_WRONG_CODES_PER_ADDRESS_PER_HOUR", 3)
    for n in range(3):
        assert verify(client, email=f"p{n}@example.org", code="000000").status_code == 400
    r = verify(client, email="p9@example.org", code="000000")
    assert r.status_code == 429 and r.json()["code"] == "sign_in_throttled"


def test_a_get_on_the_confirm_page_signs_nobody_in(client, home):
    request_email(client)
    token, _ = outbox(home)
    assert client.get(f"/v1/auth/verify?token={token}").status_code == 405
    assert verify(client, token=token).status_code == 200


def test_sign_in_does_not_reveal_whether_an_account_exists(client, home):
    sign_in(client, home, "known@example.org")
    known, unknown = request_email(client, "known@example.org"), request_email(client, "new@x.org")
    assert known.status_code == unknown.status_code == 202
    assert set(known.json()) == set(unknown.json()) and known.json()["ttl_minutes"] == 15
    assert request_email(client, "not-an-email").status_code == 422


def test_sign_in_emails_are_throttled_per_email_and_per_address(client, monkeypatch):
    for _ in range(settings.SIGN_IN_PER_EMAIL_PER_HOUR):
        assert request_email(client).status_code == 202
    r = request_email(client)
    assert r.status_code == 429 and r.json()["code"] == "sign_in_throttled"
    assert r.json()["detail"] == "too many sign-in emails for this email; try again after 13:00 UTC"
    for n in range(settings.SIGN_IN_PER_ADDRESS_PER_HOUR - settings.SIGN_IN_PER_EMAIL_PER_HOUR):
        assert request_email(client, f"p{n}@example.org").status_code == 202
    assert request_email(client, "other@example.org").status_code == 429
    at(monkeypatch, NOW + timedelta(hours=1, seconds=1))
    assert request_email(client).status_code == 202


def test_an_unreadable_throttle_refuses_with_503(client, home, monkeypatch):
    def broken(*_args):
        raise sqlite3.OperationalError("no attempts table")

    monkeypatch.setattr(auth, "_throttled", broken)
    r = request_email(client)
    assert r.status_code == 503 and r.json()["code"] == "account_unreadable"
    assert not (home / "outbox").exists()


def test_a_failed_provider_call_says_so_and_shows_nothing_sent(client, home, monkeypatch):
    monkeypatch.setenv("RW_EMAIL_API_KEY", "re_test")
    monkeypatch.setenv("RW_EMAIL_FROM", "sign-in@example.org")
    sent = []

    def down(request, timeout):
        sent.append(request)
        raise OSError("provider down")

    monkeypatch.setattr(urllib.request, "urlopen", down)
    r = request_email(client)
    assert r.status_code == 503 and r.json()["code"] == "email_unavailable"
    assert sent[0].headers["Authorization"] == "Bearer re_test"
    assert not (home / "outbox").exists()


def test_the_session_cookie_has_its_attributes(home):
    with TestClient(api.app, base_url="http://localhost") as local:
        cookie = sign_in(local, home).headers["set-cookie"]
    assert cookie.startswith(f"{auth.COOKIE}=") and "HttpOnly" in cookie
    assert "SameSite=lax" in cookie and "Path=/" in cookie
    assert f"Max-Age={settings.SESSION_DAYS * 86400}" in cookie and "Secure" not in cookie
    with TestClient(api.app, base_url="https://api.example.org") as public:
        assert request_email(public, "b@example.org").status_code == 202
        token, _ = outbox(home)
        assert "Secure" in verify(public, token=token).headers["set-cookie"]


def test_a_new_session_is_issued_at_every_sign_in(client, home):
    sign_in(client, home)
    first = client.cookies[auth.COOKIE]
    sign_in(client, home)
    assert client.cookies[auth.COOKIE] != first
    with api.connect() as conn:
        assert conn.execute("SELECT count(*) FROM sessions").fetchone()[0] == 1


def test_a_cross_origin_form_post_is_refused(client, home):
    form = client.post(
        "/v1/auth/email", data={"email": "ada@example.org"}, headers={"Origin": ORIGIN}
    )
    evil = request_email(client, headers={"Origin": "https://evil.example"})
    bare = request_email(client, headers={})
    for r in (form, evil, bare):
        assert r.status_code == 403 and r.json()["code"] == "cross_origin", r.text
    assert not (home / "outbox").exists()
    sign_in(client, home)
    gone = client.delete("/v1/me", headers={"Origin": "https://evil.example"})
    assert gone.status_code == 403 and client.get("/v1/me").status_code == 200


def test_a_bad_session_cookie_is_refused_not_treated_as_anonymous(client, home, monkeypatch):
    assert client.get("/v1/me").json()["code"] == "signed_out"
    client.cookies.set(auth.COOKIE, "forged", domain="localhost")
    r = client.get("/v1/me")
    assert r.status_code == 401 and r.json()["code"] == "signed_out"
    client.cookies.clear()
    sign_in(client, home)
    assert client.get("/v1/me").status_code == 200
    at(monkeypatch, NOW + timedelta(days=settings.SESSION_DAYS, seconds=1))
    assert client.get("/v1/me").status_code == 401


def test_sign_out_everywhere_ends_every_session(home):
    with (
        TestClient(api.app, base_url="http://localhost") as a,
        TestClient(api.app, base_url="http://localhost") as b,
        TestClient(api.app, base_url="http://localhost") as c,
    ):
        for browser in (a, b, c):
            sign_in(browser, home)
        stolen = a.cookies[auth.COOKIE]
        assert a.post("/v1/auth/sign-out", headers=JSON).status_code == 403
        r = a.post("/v1/auth/sign-out", headers={**JSON, "Content-Type": "application/json"})
        assert r.status_code == 204 and a.get("/v1/me").status_code == 401
        a.cookies.set(auth.COOKIE, stolen, domain="localhost")
        assert a.get("/v1/me").status_code == 401 and b.get("/v1/me").status_code == 200
        r = b.post(
            "/v1/auth/sign-out?everywhere=true",
            headers={**JSON, "Content-Type": "application/json"},
        )
        assert r.status_code == 204
        assert b.get("/v1/me").status_code == 401 and c.get("/v1/me").status_code == 401


def test_deleting_an_account_removes_its_personal_data(client, home):
    email = "ada@example.org"
    user_id = sign_in(client, home, email).json()["id"]
    request_email(client, email)
    r = client.delete("/v1/me", headers={**JSON, "Content-Type": "application/json"})
    assert r.status_code == 204 and client.get("/v1/me").status_code == 401
    with api.connect() as conn:
        dump = "\n".join(conn.iterdump())
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    assert email not in dump and auth.sha(email) not in dump
    assert row["email"] is None and row["deleted_at"] is not None
    again = sign_in(client, home, email).json()
    assert again["id"] != user_id


def test_the_database_holds_one_account_per_email(client, home):
    sign_in(client, home)
    with api.connect() as conn, pytest.raises(sqlite3.IntegrityError):
        conn.execute(
            "INSERT INTO users (id, email, created_at) VALUES ('usr_x', 'ada@example.org', '')"
        )


def test_the_api_refuses_to_start_on_a_public_origin_without_an_email_key(monkeypatch):
    monkeypatch.setenv("RW_ALLOWED_ORIGINS", "https://realworld.example")
    with pytest.raises(RuntimeError, match="RW_EMAIL_API_KEY is not set; email sign-in cannot run"):
        with TestClient(api.app):
            pass
    monkeypatch.setenv("RW_EMAIL_API_KEY", "re_test")
    with pytest.raises(RuntimeError, match="RW_EMAIL_FROM is not set"):
        with TestClient(api.app):
            pass
    monkeypatch.setenv("RW_EMAIL_FROM", "sign-in@realworld.example")
    with TestClient(api.app) as c:
        assert c.get("/healthz").status_code == 200
