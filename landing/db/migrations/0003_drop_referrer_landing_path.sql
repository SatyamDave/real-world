-- Reviewer asked for referrer and landing_path to go: referrer is unneeded complexity and
-- landing_path is always "/" on a one-page site. Add them back in a new migration if a use appears.
-- Applied to the dev and staging branches first; the main branch gets 0001 to 0003 together at go-live.
ALTER TABLE waitlist_signups DROP COLUMN IF EXISTS referrer;
ALTER TABLE waitlist_signups DROP COLUMN IF EXISTS landing_path;
