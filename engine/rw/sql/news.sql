CREATE TABLE IF NOT EXISTS signals (
    date TEXT NOT NULL,
    cluster_id TEXT NOT NULL,
    iso3 TEXT NOT NULL,
    title TEXT NOT NULL,
    salience REAL NOT NULL CHECK (salience BETWEEN 0 AND 1),
    topic TEXT NOT NULL,
    value REAL NOT NULL CHECK (value BETWEEN -1 AND 1),
    PRIMARY KEY (cluster_id, topic)
);

CREATE INDEX IF NOT EXISTS signals_date ON signals (date, iso3);

CREATE TABLE IF NOT EXISTS observations (
    date TEXT NOT NULL,
    iso3 TEXT NOT NULL,
    topic TEXT NOT NULL,
    share REAL NOT NULL CHECK (share BETWEEN 0 AND 1),
    n INTEGER NOT NULL CHECK (n > 0),
    source_id TEXT NOT NULL,
    PRIMARY KEY (date, iso3, topic, source_id)
);
