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
