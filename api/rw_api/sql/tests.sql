-- Sealed message tests (product/will-it-land.md, decision 0016). body_json is the canonical JSON
-- the seal hashes. The triggers make every sealed column immutable and let the mark (outcome,
-- optional real metric, optional note) be written once, in one update; the checks keep a metric
-- whole and keep metric and note off an unmarked test.
CREATE TABLE IF NOT EXISTS post_tests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id),
    body_json TEXT NOT NULL,
    seal_sha256 TEXT NOT NULL UNIQUE,
    sealed_at TEXT NOT NULL,
    intent REAL NOT NULL CHECK (intent BETWEEN 0 AND 1),
    baseline_intent REAL NOT NULL CHECK (baseline_intent BETWEEN 0 AND 1),
    gut TEXT CHECK (gut IN ('lands', 'flops')),
    outcome TEXT CHECK (outcome IN ('landed', 'flopped')),
    marked_at TEXT,
    metric_name TEXT,
    metric_value REAL,
    metric_unit TEXT,
    note TEXT,
    CHECK ((outcome IS NULL) = (marked_at IS NULL)),
    CHECK ((metric_name IS NULL) = (metric_value IS NULL) AND (metric_name IS NULL) = (metric_unit IS NULL)),
    CHECK (outcome IS NOT NULL OR (metric_name IS NULL AND note IS NULL))
);

CREATE INDEX IF NOT EXISTS post_tests_user ON post_tests (user_id, sealed_at);

CREATE TRIGGER IF NOT EXISTS post_tests_sealed BEFORE UPDATE ON post_tests
WHEN NEW.id IS NOT OLD.id OR NEW.user_id IS NOT OLD.user_id OR NEW.body_json IS NOT OLD.body_json
    OR NEW.seal_sha256 IS NOT OLD.seal_sha256 OR NEW.sealed_at IS NOT OLD.sealed_at
    OR NEW.intent IS NOT OLD.intent OR NEW.baseline_intent IS NOT OLD.baseline_intent
    OR NEW.gut IS NOT OLD.gut OR OLD.outcome IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'a sealed post test cannot change');
END;

CREATE TRIGGER IF NOT EXISTS post_tests_kept BEFORE DELETE ON post_tests
BEGIN
    SELECT RAISE(ABORT, 'a sealed post test cannot be deleted');
END;

-- Signed-out post tests per address and UTC day, for TEST_ANON_PER_DAY. Only the address hash.
CREATE TABLE IF NOT EXISTS test_clients (
    id INTEGER PRIMARY KEY,
    client_sha256 TEXT NOT NULL,
    day TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS test_clients_day ON test_clients (client_sha256, day);
