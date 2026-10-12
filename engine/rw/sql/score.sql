CREATE TABLE IF NOT EXISTS resolutions (
    question_id TEXT PRIMARY KEY,
    outcome INTEGER NOT NULL CHECK (outcome IN (0, 1)),
    resolved_on TEXT NOT NULL,
    source_url TEXT NOT NULL,
    read_on TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS resolutions_no_update BEFORE UPDATE ON resolutions
BEGIN
    SELECT RAISE(ABORT, 'resolutions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS resolutions_no_delete BEFORE DELETE ON resolutions
BEGIN
    SELECT RAISE(ABORT, 'resolutions are append-only');
END;

CREATE TABLE IF NOT EXISTS scores (
    date TEXT NOT NULL,
    question_id TEXT NOT NULL,
    forecaster TEXT NOT NULL,
    brier REAL NOT NULL,
    log_score REAL NOT NULL,
    PRIMARY KEY (date, question_id, forecaster)
);
