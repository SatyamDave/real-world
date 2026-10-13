# Sister database (D1) and R1: a proposal, nothing created or run

Names: R1 is the product's main database (SQLite, `users` in `api/rw_api/sql/accounts.sql`, read-only for the landing work). D1 is a Cloudflare D1 database that only the waitlist Functions can reach.

## Decision for Rohit: does D1 replace the Neon waitlist?

Today the waitlist is in Neon (three branches, migrations 0001 to 0003). Satyam's request reads as D1 for the waitlist and R1 for users. Options: (1) keep Neon as the waitlist and add D1 only for conversion data; (2) move the waitlist to D1 and retire the Neon project; (3) keep both and sync. Recommendation: option 2 after go-live is stable, but not before Oct 27: the Neon path is built, tested and verified on staging, a move now is risk with no visitor benefit. Runner-up: option 1. This needs Rohit's answer; nothing below depends on it being decided today.

## D1 tables

```sql
CREATE TABLE signups (
  email TEXT PRIMARY KEY CHECK (email = lower(email)),
  spoof_id TEXT NOT NULL UNIQUE,          -- random, sent to Amplitude as user_id; never the R1 users.id
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  headline_variant TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  country TEXT, consent_text_version TEXT,
  role TEXT, teaser_answer TEXT           -- from the Tally step
);
CREATE TABLE conversions (               -- written by a one-way job, never by the page
  email TEXT PRIMARY KEY REFERENCES signups(email),
  converted_at TEXT NOT NULL
);
```

Email is the key, lowercased like R1's `users.email`. `spoof_id` is the only identifier Amplitude gets, so an Amplitude export cannot be joined to a product user without the email.

## R1 side (proposal only, `api/` is read-only for this work)

```sql
-- proposed for the api owner: where a user came from, filled by the one-way sync below
ALTER TABLE users ADD COLUMN waitlist_converted_from TEXT;  -- the D1 spoof_id, or NULL
```

One-way sync: a script run by a person reads D1 `signups` emails, matches `users.email`, writes `waitlist_converted_from` in R1 and `conversions` in D1. D1 never reads R1 rows.

## Amplitude

Conversion = a `signups` email that appears in R1. The sync sends one `waitlist_converted` event with `user_id = spoof_id`, after cookie consent for visitor events (server-side events already follow the consent flag). ICP cuts: `utm_*`, `headline_variant`, `country`, `role`. Needs a chart built in Amplitude after real data exists; none is invented here.

## Flags (LaunchDarkly)

No account or key exists in this session. Plan: a small `flags.ts` with `isOn(name)` backed by a client that tests can fake; one flag per experiment (headline, globe on or off); staging on first; the e2e suite runs with the flag on; production only turned on by a person. Not built, because an unverified wrapper around a service with no account is more risk than value.

## Relocating `landing/`

Proposal: moving `landing/` out of the repo root as a skin changes every path in the open PRs and in Satyam's guards. Do it as one PR after the stack merges, with a script that rewrites paths. Not run.
