-- Sealed post tests (product/will-it-land.md). body_json is the canonical JSON the seal hashes;
-- the triggers make every sealed column immutable and let an outcome be set once.
CREATE TABLE IF NOT EXISTS post_tests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id),
    body_json TEXT NOT NULL,
    seal_sha256 TEXT NOT NULL UNIQUE,
    sealed_at TEXT NOT NULL,
    landing_chance REAL NOT NULL CHECK (landing_chance BETWEEN 0 AND 1),
    gut TEXT CHECK (gut IN ('lands', 'flops')),
    outcome TEXT CHECK (outcome IN ('landed', 'flopped')),
    marked_at TEXT,
    CHECK ((outcome IS NULL) = (marked_at IS NULL))
);

CREATE INDEX IF NOT EXISTS post_tests_user ON post_tests (user_id, sealed_at);

CREATE TRIGGER IF NOT EXISTS post_tests_sealed BEFORE UPDATE ON post_tests
WHEN NEW.id IS NOT OLD.id OR NEW.user_id IS NOT OLD.user_id OR NEW.body_json IS NOT OLD.body_json
    OR NEW.seal_sha256 IS NOT OLD.seal_sha256 OR NEW.sealed_at IS NOT OLD.sealed_at
    OR NEW.landing_chance IS NOT OLD.landing_chance OR NEW.gut IS NOT OLD.gut
    OR OLD.outcome IS NOT NULL
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
