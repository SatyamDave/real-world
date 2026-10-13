CREATE TABLE IF NOT EXISTS ledger_leaves (
    date TEXT NOT NULL,
    leaf_hash TEXT PRIMARY KEY,
    entry_json TEXT NOT NULL,
    salt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ledger_leaves_date ON ledger_leaves (date);

CREATE TABLE IF NOT EXISTS ledger_days (
    date TEXT PRIMARY KEY,
    prev_root TEXT NOT NULL,
    root TEXT NOT NULL,
    leaf_count INTEGER NOT NULL,
    protocol_hash TEXT NOT NULL,
    engine_version TEXT NOT NULL,
    record_hash TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS ledger_leaves_no_update BEFORE UPDATE ON ledger_leaves
BEGIN
    SELECT RAISE(ABORT, 'ledger_leaves is append-only');
END;

CREATE TRIGGER IF NOT EXISTS ledger_leaves_no_delete BEFORE DELETE ON ledger_leaves
BEGIN
    SELECT RAISE(ABORT, 'ledger_leaves is append-only');
END;

CREATE TRIGGER IF NOT EXISTS ledger_days_no_update BEFORE UPDATE ON ledger_days
BEGIN
    SELECT RAISE(ABORT, 'ledger_days is append-only');
END;

CREATE TRIGGER IF NOT EXISTS ledger_days_no_delete BEFORE DELETE ON ledger_days
BEGIN
    SELECT RAISE(ABORT, 'ledger_days is append-only');
END;

-- INSERT OR REPLACE deletes the old row without firing BEFORE DELETE unless recursive_triggers is on.
CREATE TRIGGER IF NOT EXISTS ledger_leaves_no_replace BEFORE INSERT ON ledger_leaves
WHEN EXISTS (SELECT 1 FROM ledger_leaves WHERE leaf_hash = NEW.leaf_hash)
BEGIN
    SELECT RAISE(ABORT, 'ledger_leaves is append-only');
END;

CREATE TRIGGER IF NOT EXISTS ledger_days_no_replace BEFORE INSERT ON ledger_days
WHEN EXISTS (SELECT 1 FROM ledger_days WHERE date = NEW.date)
BEGIN
    SELECT RAISE(ABORT, 'ledger_days is append-only');
END;

-- proof is the TSA's whole TimeStampResp for rfc3161, or the calendar's pending timestamp for
-- opentimestamps; anchor status is recomputed from it on every read, never stored.
CREATE TABLE IF NOT EXISTS ledger_anchors (
    date TEXT NOT NULL REFERENCES ledger_days (date),
    kind TEXT NOT NULL CHECK (kind IN ('rfc3161', 'opentimestamps')),
    service TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    proof BLOB NOT NULL,
    UNIQUE (date, kind)
);

CREATE TRIGGER IF NOT EXISTS ledger_anchors_no_update BEFORE UPDATE ON ledger_anchors
BEGIN
    SELECT RAISE(ABORT, 'ledger_anchors is append-only');
END;

CREATE TRIGGER IF NOT EXISTS ledger_anchors_no_delete BEFORE DELETE ON ledger_anchors
BEGIN
    SELECT RAISE(ABORT, 'ledger_anchors is append-only');
END;

CREATE TRIGGER IF NOT EXISTS ledger_anchors_no_replace BEFORE INSERT ON ledger_anchors
WHEN EXISTS (SELECT 1 FROM ledger_anchors WHERE date = NEW.date AND kind = NEW.kind)
BEGIN
    SELECT RAISE(ABORT, 'ledger_anchors is append-only');
END;
