// Copy for the sections below the receipt strip. Every sentence restates a claim allowed in
// gtm/messaging.md ("Claims we may make") or says what we do not claim; nothing here is new
// strategy. The brand name comes from BRAND. sections.test.ts bans forbidden claims and
// internal terms.
export interface LedgerRow {
  term: string;
  text: string;
}

export const THESIS = {
  statement: "A forecast is only worth something if you can check it.",
  rows: [
    {
      term: "Committed first",
      text: "We hash each forecast before the outcome exists, so the record cannot be backfilled.",
    },
    {
      term: "Questions fixed",
      text: "The list of questions is committed before any forecast on them, so we cannot choose the ones that went well.",
    },
    {
      term: "Misses stay",
      text: "We score every forecast in public against the market price at commit time, misses included.",
    },
  ] satisfies LedgerRow[],
};

export const USE_CASES = {
  title: "What you can do with it",
  note: "From the launch on Oct 27.",
  rows: [
    {
      term: "Test a post",
      text: "Test a post on simulated audiences before you post it. Your tests are sealed when you make them.",
    },
    {
      term: "Call it",
      text: "Call the news against an AI that seals its calls first. We score you both when it resolves.",
    },
    {
      term: "Read the record",
      text: "Each sealed call's hash and score will be public. Read the receipts instead of taking our word.",
    },
  ] satisfies LedgerRow[],
};

export const RESEARCH = {
  title: "Research and limits",
  note: "What we say, and what we leave out.",
  say: [
    "Forecasts hashed before the outcome, scored in public from the day of the first hash.",
    "The simulated population is calibrated to published marginals.",
    "News in 65 languages through GDELT translation.",
    "Every output is labelled AI-simulated.",
  ],
  leave: [
    "No accuracy figure.",
    "Not a poll, and not a prediction about any real person. It does not predict likes or followers.",
    "Not a way to bet or trade. Markets are only our yardstick.",
  ],
  caveat:
    "The hash proves the forecast has not changed since it was anchored. The fixed question list is what stops us choosing questions afterwards.",
};

export const COLLABORATE = {
  title: "Work on this with us.",
  body: "Open to people who forecast, research or build. Tell us what you would do.",
  withEmail: "Email us",
  withoutEmail: "Join the waitlist and choose your role",
};
