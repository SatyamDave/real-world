#!/usr/bin/env bash
# Sets the PRODUCTION secrets on the Cloudflare Pages project. Run it yourself at go-live
# (RUNBOOK section 8). Nothing runs it automatically, and it prints names, never values.
#
# Reads these from landing/.dev.vars (git-ignored):
#   DATABASE_URL_PROD           Neon main branch, pooled connection string
#   AMPLITUDE_API_KEY_PROD      key of the "Real World - Prod" Amplitude project
#   TURNSTILE_SECRET_KEY_PROD   the REAL Turnstile secret (not Cloudflare's test secret)
#   TYPEFORM_WEBHOOK_SECRET     the secret Typeform signs with (rotate it first if it was shared)
# Optional: RATE_LIMIT_SALT_PROD (a random one is generated when absent).
#
# Usage: bash landing/scripts/set-prod-secrets.sh [--check | --yes]
#   --check  validate .dev.vars and print what would be set (names only); writes nothing.
#   Preview and staging keep Cloudflare's test Turnstile keys; this script touches production only.
set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT="real-world-landing"
VARS=".dev.vars"
[ -f "$VARS" ] || { echo "missing $VARS" >&2; exit 1; }

get() { grep -E "^$1=" "$VARS" | head -1 | cut -d= -f2- || true; }

DATABASE_URL_PROD="$(get DATABASE_URL_PROD)"
AMP_PROD="$(get AMPLITUDE_API_KEY_PROD)"
AMP_STAGING="$(get AMPLITUDE_API_KEY_STAGING)"
TS_PROD="$(get TURNSTILE_SECRET_KEY_PROD)"
TF_SECRET="$(get TYPEFORM_WEBHOOK_SECRET)"
SALT="$(get RATE_LIMIT_SALT_PROD)"
[ -n "$SALT" ] || SALT="$(openssl rand -hex 32)"

fail() { echo "refusing: $1" >&2; exit 1; }
[ -n "$DATABASE_URL_PROD" ] || fail "DATABASE_URL_PROD is not set"
[ -n "$AMP_PROD" ] || fail "AMPLITUDE_API_KEY_PROD is not set"
[ "$AMP_PROD" != "$AMP_STAGING" ] || fail "the prod and staging Amplitude keys are the same"
[ -n "$TS_PROD" ] || fail "TURNSTILE_SECRET_KEY_PROD is not set (create a real Turnstile widget first)"
case "$TS_PROD" in
  1x0000*|2x0000*|3x0000*) fail "TURNSTILE_SECRET_KEY_PROD is one of Cloudflare's test secrets" ;;
esac
[ -n "$TF_SECRET" ] || fail "TYPEFORM_WEBHOOK_SECRET is not set"
case "$DATABASE_URL_PROD" in
  *"$(get DATABASE_URL_DEV | sed -E 's#.*@([^/]*)/.*#\1#')"*) fail "DATABASE_URL_PROD points at the dev branch host" ;;
esac

if [ "${1:-}" = "--check" ]; then
  echo "checks passed: DATABASE_URL_PROD, AMPLITUDE_API_KEY_PROD, TURNSTILE_SECRET_KEY_PROD (real), TYPEFORM_WEBHOOK_SECRET are set and distinct from test values."
  echo "would set on production: DATABASE_URL, AMPLITUDE_API_KEY, TURNSTILE_SECRET_KEY, TYPEFORM_WEBHOOK_SECRET, RATE_LIMIT_SALT"
  exit 0
fi

echo "This will set 5 PRODUCTION secrets on Pages project '$PROJECT':"
echo "  (ENVIRONMENT=production comes from wrangler.toml, not from here)"
echo "  DATABASE_URL, AMPLITUDE_API_KEY, TURNSTILE_SECRET_KEY, TYPEFORM_WEBHOOK_SECRET, RATE_LIMIT_SALT"
if [ "${1:-}" != "--yes" ]; then
  read -r -p "Type 'production' to continue: " ans
  [ "$ans" = "production" ] || { echo "aborted"; exit 1; }
fi

put() { printf '%s' "$2" | pnpm exec wrangler pages secret put "$1" --project-name "$PROJECT" >/dev/null && echo "set $1"; }
put DATABASE_URL "$DATABASE_URL_PROD"
put AMPLITUDE_API_KEY "$AMP_PROD"
put TURNSTILE_SECRET_KEY "$TS_PROD"
put TYPEFORM_WEBHOOK_SECRET "$TF_SECRET"
put RATE_LIMIT_SALT "$SALT"

echo
echo "Done. Next: build with the prod values (RUNBOOK section 8) and deploy to the production branch."
echo "Check: pnpm exec wrangler pages secret list --project-name $PROJECT   (names only)"
