-- Waitlist storage for the pre-launch landing page.
-- Applied to the Neon project real-world-landing, database "landing", on the
-- dev branch first, then main. No IP addresses are stored anywhere.
-- Spec: product/landing-page.md; decision research/decisions/0003-prelaunch-landing-and-waitlist.md.

CREATE EXTENSION IF NOT EXISTS citext;

-- One row per email. The app lowercases and trims the email before insert;
-- citext makes the unique index case-insensitive as a second guard.
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 citext NOT NULL UNIQUE,
  created_at            timestamptz NOT NULL DEFAULT now(),

  -- acquisition context
  headline_variant      text,
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  utm_content           text,
  utm_term              text,
  referrer              text,
  landing_path          text,
  amplitude_device_id   text,
  country               text,              -- from the CF-IPCountry header; no IP stored
  consent_text_version  text,

  -- filled by the Typeform step (all nullable)
  typeform_response_id  text,
  role                  text,
  forecast_question_id  text,
  forecast_probability  numeric CHECK (forecast_probability >= 0 AND forecast_probability <= 1),
  completed_at          timestamptz
);

-- Append-only raw log of every Typeform webhook request. The id is the
-- Typeform event id, so a replayed delivery conflicts and is ignored.
CREATE TABLE IF NOT EXISTS typeform_events (
  id               text PRIMARY KEY,
  received_at      timestamptz NOT NULL DEFAULT now(),
  signature_valid  boolean NOT NULL,
  payload          jsonb NOT NULL
);
