-- One row per promoted or re-pinned recalibration map; record_json is what its version hashes.
CREATE TABLE IF NOT EXISTS engine_versions (
    version TEXT PRIMARY KEY,
    parent TEXT NOT NULL,
    effective_from TEXT NOT NULL,
    params_json TEXT NOT NULL,
    record_json TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS engine_versions_no_update BEFORE UPDATE ON engine_versions
BEGIN
    SELECT RAISE(ABORT, 'engine_versions is append-only');
END;

CREATE TRIGGER IF NOT EXISTS engine_versions_no_delete BEFORE DELETE ON engine_versions
BEGIN
    SELECT RAISE(ABORT, 'engine_versions is append-only');
END;

CREATE TRIGGER IF NOT EXISTS engine_versions_no_replace BEFORE INSERT ON engine_versions
WHEN EXISTS (SELECT 1 FROM engine_versions WHERE version = NEW.version)
BEGIN
    SELECT RAISE(ABORT, 'engine_versions is append-only');
END;
