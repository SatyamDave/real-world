CREATE TABLE IF NOT EXISTS simulations (
    input_hash TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    result_json TEXT NOT NULL
);
