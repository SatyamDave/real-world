"""GET /v1/me and DELETE /v1/me: the signed-in account (product/accounts.md)."""

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse

from rw_api import app as api
from rw_api import auth

router = APIRouter(tags=["account"])
SIGNED_OUT = {"model": api.Refused, "description": "No live session"}


@router.get(
    "/v1/me",
    summary="The signed-in account",
    response_model=auth.Person,
    responses={401: SIGNED_OUT, 503: auth.UNREADABLE},
)
def me(request: Request) -> auth.Person | JSONResponse:
    user = auth.signed_in(api.connect(), request)
    return user if isinstance(user, JSONResponse) else auth.person(user)


@router.delete(
    "/v1/me",
    summary="Delete the account: its email, sessions and sign-in tokens are removed",
    status_code=204,
    dependencies=[Depends(auth.same_origin)],
    responses={**auth.ACCOUNT_ERRORS, 401: SIGNED_OUT, 503: auth.UNREADABLE},
)
def delete_me(request: Request) -> Response:
    conn = api.connect()
    user = auth.signed_in(conn, request)
    if isinstance(user, JSONResponse):
        return user
    email = user["email"]
    # The row stays with no email, so rows that reference it keep no personal data.
    with conn:
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
        conn.execute("DELETE FROM sign_in_tokens WHERE email = ?", (email,))
        conn.execute("DELETE FROM sign_in_attempts WHERE email_sha256 = ?", (auth.sha(email),))
        conn.execute(
            "UPDATE users SET email = NULL, deleted_at = ? WHERE id = ?", (api._now(), user["id"])
        )
    response = Response(status_code=204)
    auth.clear_session(response)
    return response
