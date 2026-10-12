CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
    request_json TEXT NOT NULL,
    result_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    finished_at TEXT
);

CREATE TABLE IF NOT EXISTS job_events (
    id INTEGER PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs (id),
    data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS job_events_job ON job_events (job_id, id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    body_sha256 TEXT NOT NULL,
    job_id TEXT NOT NULL REFERENCES jobs (id),
    created_at TEXT NOT NULL
);

-- One row per fork started, for the anonymous per-address daily cap. Only a hash of the address
-- is kept.
CREATE TABLE IF NOT EXISTS fork_clients (
    job_id TEXT PRIMARY KEY REFERENCES jobs (id),
    client_sha256 TEXT NOT NULL,
    day TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS fork_clients_day ON fork_clients (client_sha256, day);

CREATE TABLE IF NOT EXISTS daily_answers (
    question_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    date TEXT NOT NULL,
    probability REAL NOT NULL CHECK (probability BETWEEN 0 AND 1),
    created_at TEXT NOT NULL,
    PRIMARY KEY (question_id, player_id)
);

CREATE INDEX IF NOT EXISTS daily_answers_player ON daily_answers (player_id, date);

-- A key is shown once when it is made; only its hash is kept.
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY,
    label TEXT NOT NULL,
    key_sha256 TEXT NOT NULL UNIQUE,
    cap_usd REAL NOT NULL CHECK (cap_usd > 0),
    created_at TEXT NOT NULL,
    revoked_at TEXT
);

-- One row per fork started with a key. spent_usd is what its model calls cost, written when it
-- finishes; until then, or if it never finishes, the fork counts at its max_cost_usd.
CREATE TABLE IF NOT EXISTS key_forks (
    job_id TEXT PRIMARY KEY REFERENCES jobs (id),
    api_key_id INTEGER NOT NULL REFERENCES api_keys (id),
    spent_usd REAL
);

CREATE INDEX IF NOT EXISTS key_forks_key ON key_forks (api_key_id);

-- One row per acceptable-use screen call a keyed caller paid for, refused or not; a refused event
-- has no job, so its cost cannot sit in key_forks.
CREATE TABLE IF NOT EXISTS key_screens (
    id INTEGER PRIMARY KEY,
    api_key_id INTEGER NOT NULL REFERENCES api_keys (id),
    spent_usd REAL NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS key_screens_key ON key_screens (api_key_id);
