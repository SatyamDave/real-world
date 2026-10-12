CREATE TABLE IF NOT EXISTS llm_calls (
    id INTEGER PRIMARY KEY,
    at TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    purpose TEXT NOT NULL,
    prompt_sha256 TEXT NOT NULL,
    schema_sha256 TEXT NOT NULL,
    prompt TEXT NOT NULL,
    -- NULL when the provider answered but the answer failed the schema; the cost still happened.
    output_json TEXT,
    in_tokens INTEGER NOT NULL,
    out_tokens INTEGER NOT NULL,
    cost_usd REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS llm_calls_memo
    ON llm_calls (provider, model, schema_sha256, prompt_sha256);

CREATE INDEX IF NOT EXISTS llm_calls_at ON llm_calls (at);
