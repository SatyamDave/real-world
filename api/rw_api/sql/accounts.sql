-- A deleted account keeps its row with email NULL, so later rows that reference it (key spend,
-- fork jobs) stay valid and carry no personal data. UNIQUE allows many NULLs.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE CHECK (email = lower(email)),
    created_at TEXT NOT NULL,
    deleted_at TEXT,
    CHECK ((email IS NULL) = (deleted_at IS NOT NULL))
);

-- One row per sign-in email. Only hashes of the link token and the code are kept; the email is
-- kept until the token is used or the account is deleted, because the first sign-in makes the
-- account from it.
CREATE TABLE IF NOT EXISTS sign_in_tokens (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    token_sha256 TEXT NOT NULL UNIQUE,
    code_sha256 TEXT NOT NULL,
    wrong_codes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT
);

CREATE INDEX IF NOT EXISTS sign_in_tokens_email ON sign_in_tokens (email, id);

CREATE TABLE IF NOT EXISTS sessions (
    token_sha256 TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

-- Sign-in emails sent and wrong codes, for the hourly throttles. Only hashes of the email and the
-- caller's address are kept.
CREATE TABLE IF NOT EXISTS sign_in_attempts (
    id INTEGER PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('email', 'wrong_code')),
    email_sha256 TEXT NOT NULL,
    client_sha256 TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sign_in_attempts_email ON sign_in_attempts (kind, email_sha256, created_at);
CREATE INDEX IF NOT EXISTS sign_in_attempts_client ON sign_in_attempts (kind, client_sha256, created_at);
