// The one place the launch name lives. A rename is a one-line change here
// (decision research/decisions/0004-launch-name-real-world.md; note 085).
export const BRAND = {
  name: "Real World",
  tagline: "simulations with receipts",
  // The teaser forecast shown in the post-signup Tally form (never in ad creative).
  // Default event per the overnight brief; Fed decision date verified on
  // federalreserve.gov (FOMC meets Oct 27-28 2026, decision Oct 28).
  teaser: {
    question:
      "Will the US Federal Reserve cut its policy rate at the meeting ending October 28, 2026?",
    resolvesOn: "2026-10-28",
    resolutionSource: "federalreserve.gov",
  },
  // hello@<domain> once the domain exists; the footer contact link is hidden while empty.
  contactEmail: "",
} as const;
