import { BRAND } from "../brand";

// The consent line shown at signup. Its version is stored with every signup row
// so we know exactly what each person agreed to. Bump the version when the text
// changes. See product/landing-page.md and landing/RUNBOOK.md.
export const CONSENT_VERSION = "2026-10-12";
export const CONSENT_TEXT = `We'll email you about ${BRAND.name}'s launch and your forecast. Unsubscribe anytime.`;

// When the privacy page last changed. Separate from CONSENT_VERSION, which changes only when
// the consent line above changes.
export const PRIVACY_UPDATED = "2026-10-13";
