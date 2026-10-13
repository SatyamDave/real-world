"""Email sign-in and sessions: POST /v1/auth/email, /v1/auth/verify and /v1/auth/sign-out.

Contract: product/accounts.md. Method: research/engineering/106-sign-in-methods.md.
"""

import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import sqlite3
import urllib.request
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Annotated, Any
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from rw import settings
from rw_api import app as api

log = logging.getLogger("rw_api.auth")
router = APIRouter(tags=["account"])
COOKIE = "rw_session"
LOCAL_HOSTS = ("localhost", "127.0.0.1")
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
# The provider named as the example in research/engineering/106; which provider to use is a
# founder decision (company/decisions-needed.md).
PROVIDER_URL = "https://api.resend.com/emails"
SUBJECT = "Sign in to Real World"


def sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _local(origin: str) -> bool:
    return urlsplit(origin).hostname in LOCAL_HOSTS


def require_email_transport(origins: list[str]) -> None:
    """Without RW_EMAIL_API_KEY, sign-in emails go to the local outbox, which is allowed only when
    every allowed origin is local. Raises so the API does not start otherwise."""
    if os.environ.get("RW_EMAIL_API_KEY"):
        if not os.environ.get("RW_EMAIL_FROM"):
            raise RuntimeError("RW_EMAIL_FROM is not set; email sign-in has no sender address.")
        return
    public = [o for o in origins if not _local(o)]
    if public:
        raise RuntimeError(f"RW_EMAIL_API_KEY is not set; email sign-in cannot run on {public[0]}.")


def send(email: str, link: str, code: str) -> None:
    """Send the sign-in email through the provider, or write it to $RW_HOME/outbox/ and the log
    when no provider key is set. Raises when it could not be sent."""
    text = (
        f"Sign in to Real World: {link}\n\nOr type this code on the sign-in page: {code}\n\n"
        f"The link and the code work for {settings.SIGN_IN_TTL_MINUTES} minutes. If you did not"
        " ask to sign in, ignore this email.\n"
    )
    key = os.environ.get("RW_EMAIL_API_KEY")
    if key:
        body = {
            "from": os.environ["RW_EMAIL_FROM"],
            "to": [email],
            "subject": SUBJECT,
            "text": text,
        }
        request = urllib.request.Request(
            PROVIDER_URL,
            data=json.dumps(body).encode(),
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=settings.EMAIL_TIMEOUT_S):
            return
    msg = EmailMessage()
    msg["To"], msg["Subject"] = email, SUBJECT
    msg.set_content(text, cte="7bit")
    outbox = settings.rw_home() / "outbox"
    outbox.mkdir(parents=True, exist_ok=True)
    stamp = api._clock().strftime("%Y%m%dT%H%M%S%fZ")
    path = outbox / f"{stamp}-{sha(email)[:16]}.eml"
    path.write_text(msg.as_string())
    log.warning("sign-in email written to %s: link %s, code %s", path, link, code)


def _origin(request: Request) -> str | None:
    origin = request.headers.get("origin")
    if origin and (origin in api.allowed_origins() or re.fullmatch(api.CORS_ORIGIN_REGEX, origin)):
        return origin
    return None


def same_origin(request: Request) -> None:
    """State-changing account routes take only JSON from an allowed Origin, so a cross-site form
    cannot post them. A request with no Origin is refused."""
    json_body = request.headers.get("content-type", "").split(";")[0].strip() == "application/json"
    if _origin(request) is None or not json_body:
        raise CrossOrigin


class CrossOrigin(Exception):
    pass


def cross_origin_response() -> JSONResponse:
    return api._refuse(
        403,
        "cross_origin",
        "account changes are accepted only as JSON from an allowed origin",
    )


def _set_session(conn: sqlite3.Connection, request: Request, response: Response, email: str):
    """Make the account on first sign-in, end the session the browser already had and issue a new
    one."""
    now = api._clock()
    conn.execute(
        "INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING",
        (f"usr_{secrets.token_hex(8)}", email, api._now()),
    )
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    old = request.cookies.get(COOKIE)
    if old:
        conn.execute("DELETE FROM sessions WHERE token_sha256 = ?", (sha(old),))
    token = secrets.token_urlsafe(32)
    expires = now + timedelta(days=settings.SESSION_DAYS)
    conn.execute(
        "INSERT INTO sessions (token_sha256, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (sha(token), user["id"], api._now(), expires.isoformat(timespec="seconds")),
    )
    response.set_cookie(
        COOKIE,
        token,
        max_age=settings.SESSION_DAYS * 86400,
        path="/",
        httponly=True,
        samesite="lax",
        secure=request.url.hostname not in LOCAL_HOSTS,
    )
    return user


def clear_session(response: Response) -> None:
    response.delete_cookie(COOKIE, path="/", httponly=True, samesite="lax")


def signed_in(conn: sqlite3.Connection, request: Request) -> sqlite3.Row | JSONResponse:
    """The live account behind the session cookie. A missing, unknown, expired or ended session
    is signed out; it never falls back to another identity."""
    token = request.cookies.get(COOKIE)
    if not token:
        return api._refuse(401, "signed_out", "you are signed out; sign in to continue")
    try:
        row = conn.execute(
            "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id"
            " WHERE s.token_sha256 = ? AND s.expires_at > ? AND u.deleted_at IS NULL",
            (sha(token), api._now()),
        ).fetchone()
    except Exception:
        log.exception("session lookup failed")
        return api._refuse(503, "account_unreadable", "the session could not be checked")
    if row is None:
        return api._refuse(401, "signed_out", "this session has ended; sign in again")
    return row


class EmailRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(max_length=254, pattern=EMAIL_PATTERN)


class SignInSent(BaseModel):
    email: str
    ttl_minutes: int = Field(description="How long the link and the code work.")


class VerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    token: str | None = Field(default=None, max_length=128, description="From the link's #token=.")
    email: str | None = Field(default=None, max_length=254, pattern=EMAIL_PATTERN)
    code: str | None = Field(default=None, pattern=r"^\d{6}$")


class Person(BaseModel):
    id: str
    email: str
    created_at: str


def person(row: sqlite3.Row) -> Person:
    return Person(id=row["id"], email=row["email"], created_at=row["created_at"])


def _ago(hours: int) -> str:
    return (api._clock() - timedelta(hours=hours)).isoformat(timespec="seconds")


def _throttled(
    conn: sqlite3.Connection, kind: str, column: str, value: str, limit: int, what: str
) -> JSONResponse | None:
    rows = conn.execute(
        f"SELECT count(*), min(created_at) FROM sign_in_attempts"
        f" WHERE kind = ? AND {column} = ? AND created_at > ?",
        (kind, value, _ago(1)),
    ).fetchone()
    if rows[0] < limit:
        return None
    after = datetime.fromisoformat(rows[1]) + timedelta(hours=1)
    return api._refuse(
        429, "sign_in_throttled", f"too many {what}; try again after {after:%H:%M} UTC"
    )


ACCOUNT_ERRORS: dict[int | str, dict[str, Any]] = {
    403: {"model": api.Refused, "description": "Not JSON, or not from an allowed origin"},
    422: api.INVALID,
}
UNREADABLE = {"model": api.Refused, "description": "The sign-in state could not be read"}


@router.post(
    "/v1/auth/email",
    summary="Email a sign-in link and a six-digit code",
    status_code=202,
    response_model=SignInSent,
    dependencies=[Depends(same_origin)],
    responses={
        **ACCOUNT_ERRORS,
        429: {"model": api.Refused, "description": "Too many sign-in emails this hour"},
        503: {
            "model": api.Refused,
            "description": "The email could not be sent, or a throttle could not be read",
        },
    },
)
def email_sign_in(body: EmailRequest, request: Request) -> SignInSent | JSONResponse:
    email = body.email.lower()
    client = api._client(request)
    origin = _origin(request)
    if client is None or origin is None:
        return api._refuse(503, "client_unknown", "the caller's address could not be read")
    token = secrets.token_urlsafe(32)
    code = f"{secrets.randbelow(10**6):06d}"
    now = api._clock()
    expires = (now + timedelta(minutes=settings.SIGN_IN_TTL_MINUTES)).isoformat(timespec="seconds")
    conn = api.connect()
    try:
        with conn:
            conn.execute("BEGIN IMMEDIATE")
            refusal = _throttled(
                conn,
                "email",
                "email_sha256",
                sha(email),
                settings.SIGN_IN_PER_EMAIL_PER_HOUR,
                "sign-in emails for this email",
            ) or _throttled(
                conn,
                "email",
                "client_sha256",
                client,
                settings.SIGN_IN_PER_ADDRESS_PER_HOUR,
                "sign-in emails from this address",
            )
            if refusal is not None:
                return refusal
            conn.execute("DELETE FROM sign_in_tokens WHERE expires_at <= ?", (api._now(),))
            conn.execute("DELETE FROM sign_in_attempts WHERE created_at <= ?", (_ago(1),))
            conn.execute(
                "INSERT INTO sign_in_attempts (kind, email_sha256, client_sha256, created_at)"
                " VALUES ('email', ?, ?, ?)",
                (sha(email), client, api._now()),
            )
            conn.execute(
                "INSERT INTO sign_in_tokens"
                " (email, token_sha256, code_sha256, created_at, expires_at)"
                " VALUES (?, ?, ?, ?, ?)",
                (email, sha(token), sha(sha(token) + code), api._now(), expires),
            )
    except Exception:
        log.exception("sign-in throttle failed")
        return api._refuse(503, "account_unreadable", "the sign-in throttle could not be read")
    try:
        send(email, f"{origin}/sign-in/confirm#token={token}", code)
    except Exception:
        log.exception("sign-in email failed")
        return api._refuse(
            503,
            "email_unavailable",
            "the sign-in email could not be sent; try again in a few minutes",
        )
    return SignInSent(email=email, ttl_minutes=settings.SIGN_IN_TTL_MINUTES)


INVALID_SIGN_IN = "that link or code is not valid; request a new email"


@router.post(
    "/v1/auth/verify",
    summary="Redeem a sign-in link token or an email and code; sets the session cookie",
    response_model=Person,
    dependencies=[Depends(same_origin)],
    responses={
        **ACCOUNT_ERRORS,
        400: {"model": api.Refused, "description": "The token or code is wrong, used or expired"},
        429: {"model": api.Refused, "description": "Too many wrong codes from this address"},
        503: UNREADABLE,
    },
)
def verify(body: VerifyRequest, request: Request, response: Response) -> Person | JSONResponse:
    by_token = body.token is not None
    if by_token == (body.email is not None and body.code is not None) or (
        by_token and (body.email or body.code)
    ):
        return api._refuse(422, "invalid_request", "send either token, or email and code")
    client = api._client(request)
    if client is None:
        return api._refuse(503, "client_unknown", "the caller's address could not be read")
    live = "used_at IS NULL AND expires_at > ? AND wrong_codes < ?"
    conn = api.connect()
    try:
        with conn:
            conn.execute("BEGIN IMMEDIATE")
            if by_token:
                row = conn.execute(
                    f"SELECT * FROM sign_in_tokens WHERE token_sha256 = ? AND {live}",
                    (sha(body.token or ""), api._now(), settings.SIGN_IN_CODE_ATTEMPTS),
                ).fetchone()
                ok = row is not None
            else:
                email = (body.email or "").lower()
                refusal = _throttled(
                    conn,
                    "wrong_code",
                    "client_sha256",
                    client,
                    settings.SIGN_IN_WRONG_CODES_PER_ADDRESS_PER_HOUR,
                    "wrong codes from this address",
                )
                if refusal is not None:
                    return refusal
                row = conn.execute(
                    f"SELECT * FROM sign_in_tokens WHERE email = ? AND {live}"
                    " ORDER BY id DESC LIMIT 1",
                    (email, api._now(), settings.SIGN_IN_CODE_ATTEMPTS),
                ).fetchone()
                expected = row["code_sha256"] if row else sha("")
                got = sha((row["token_sha256"] if row else "") + (body.code or ""))
                ok = hmac.compare_digest(expected, got) and row is not None
                if not ok:
                    conn.execute(
                        "INSERT INTO sign_in_attempts"
                        " (kind, email_sha256, client_sha256, created_at)"
                        " VALUES ('wrong_code', ?, ?, ?)",
                        (sha(email), client, api._now()),
                    )
                    if row is not None:
                        conn.execute(
                            "UPDATE sign_in_tokens SET wrong_codes = wrong_codes + 1 WHERE id = ?",
                            (row["id"],),
                        )
            if not ok or row is None:
                return api._refuse(400, "sign_in_invalid", INVALID_SIGN_IN)
            used = conn.execute(
                "UPDATE sign_in_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL",
                (api._now(), row["id"]),
            )
            if used.rowcount != 1:
                return api._refuse(400, "sign_in_invalid", INVALID_SIGN_IN)
            user = _set_session(conn, request, response, row["email"])
    except Exception:
        log.exception("sign-in verify failed")
        return api._refuse(503, "account_unreadable", "the sign-in could not be checked")
    return person(user)


@router.post(
    "/v1/auth/sign-out",
    summary="End this session, or every session of the account with everywhere=true",
    status_code=204,
    dependencies=[Depends(same_origin)],
    responses={
        **ACCOUNT_ERRORS,
        401: {"model": api.Refused, "description": "Signed out already"},
        503: UNREADABLE,
    },
)
def sign_out(request: Request, everywhere: Annotated[bool, Query()] = False) -> Response:
    conn = api.connect()
    user = signed_in(conn, request)
    if isinstance(user, JSONResponse):
        return user
    token = request.cookies.get(COOKIE) or ""
    with conn:
        if everywhere:
            conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
        else:
            conn.execute("DELETE FROM sessions WHERE token_sha256 = ?", (sha(token),))
    response = Response(status_code=204)
    clear_session(response)
    return response
