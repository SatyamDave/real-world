CREATE TABLE IF NOT EXISTS stage_runs (
    date TEXT NOT NULL,
    step TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'ok', 'failed')),
    started_at TEXT NOT NULL,
    finished_at TEXT,
    detail TEXT,
    PRIMARY KEY (date, step)
);

CREATE TABLE IF NOT EXISTS nudges (
    date TEXT NOT NULL,
    iso3 TEXT NOT NULL,
    topic TEXT NOT NULL,
    wanted REAL NOT NULL,
    applied REAL NOT NULL,
    PRIMARY KEY (date, iso3, topic)
);

CREATE TABLE IF NOT EXISTS audits (
    date TEXT NOT NULL,
    iso3 TEXT NOT NULL,
    topic TEXT NOT NULL,
    sim_sd REAL NOT NULL,
    survey_sd REAL NOT NULL,
    ratio REAL NOT NULL,
    in_band INTEGER NOT NULL CHECK (in_band IN (0, 1)),
    PRIMARY KEY (date, iso3, topic)
);

CREATE TABLE IF NOT EXISTS country_status (
    date TEXT NOT NULL,
    iso3 TEXT NOT NULL,
    tier TEXT NOT NULL,
    experimental INTEGER NOT NULL CHECK (experimental IN (0, 1)),
    PRIMARY KEY (date, iso3)
);
