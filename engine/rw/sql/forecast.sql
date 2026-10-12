CREATE TABLE IF NOT EXISTS forecasts (
    date TEXT NOT NULL,
    question_id TEXT NOT NULL,
    forecaster TEXT NOT NULL CHECK (forecaster IN ('sim', 'plain_llm', 'market')),
    probability REAL NOT NULL CHECK (probability BETWEEN 0 AND 1),
    -- Only the sim forecast has an ensemble to draw an interval from.
    p10 REAL CHECK (p10 BETWEEN 0 AND probability),
    p90 REAL CHECK (p90 BETWEEN probability AND 1),
    market_price_at_commit REAL NOT NULL CHECK (market_price_at_commit BETWEEN 0 AND 1),
    model TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (date, question_id, forecaster)
);
