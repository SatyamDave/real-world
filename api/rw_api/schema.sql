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

CREATE TABLE IF NOT EXISTS daily_answers (
    question_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    date TEXT NOT NULL,
    probability REAL NOT NULL CHECK (probability BETWEEN 0 AND 1),
    created_at TEXT NOT NULL,
    PRIMARY KEY (question_id, player_id)
);

CREATE INDEX IF NOT EXISTS daily_answers_player ON daily_answers (player_id, date);
