-- Per-visitor rate limit for POST /api/signup. The key is a salted hash of the
-- client IP and the window start; the raw IP is never stored. Rows older than a
-- day are pruned by the function. Spec: product/landing-page.md.
CREATE TABLE IF NOT EXISTS signup_rate_limit (
  ip_hash       text NOT NULL,
  window_start  timestamptz NOT NULL,
  attempts      integer NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);
