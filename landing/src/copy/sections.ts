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

// Other people's results, in plain words, with no figure and no claim about our own accuracy.
// design/PAPERS.md records what was opened for each line and what it does not show.
export const PAPERS = {
  title: "What the research says, and where it stops",
  note: "Other people's results. None of them is ours, and none says what our simulations will do.",
  rows: [
    {
      term: "Agents can act believably",
      text: "Software agents with memory can behave in ways people find believable in a game world. Believable is not the same as accurate.",
      cite: "Park et al., Generative Agents, 2023",
      href: "https://arxiv.org/abs/2304.03442",
    },
    {
      term: "Given a person's own interview",
      text: "Agents built from a long interview with a person came close to that person's own survey answers, though not as consistent as the person is with themselves two weeks later.",
      cite: "Park et al., 2024 preprint",
      href: "https://arxiv.org/abs/2411.10109",
    },
    {
      term: "Simulated samples can resemble surveys",
      text: "Models given backstories of age, income and region produced answers that looked like human subgroups on some US surveys.",
      cite: "Argyle et al., Political Analysis, 2023",
      href: "https://doi.org/10.1017/pan.2023.2",
    },
    {
      term: "And can miss",
      text: "Averages can match while the spread is too narrow and the results change with the wording and the month. Opinions can differ from real groups by a wide margin.",
      cite: "Bisbee et al., Political Analysis, 2024; Santurkar et al., ICML, 2023",
      href: "https://doi.org/10.1017/pan.2024.5",
    },
    {
      term: "Forecasting is close, not settled",
      text: "In 2024 studies a crowd of models and a retrieval system came near a crowd of people on questions that resolved later. In the latest public comparison we read, expert forecasters were still ahead.",
      cite: "Schoenegger et al., 2024; Halawi et al., NeurIPS, 2024; Forecasting Research Institute, 2026",
      href: "https://arxiv.org/abs/2402.19379",
    },
    {
      term: "Public scoring works for people",
      text: "In a government-funded tournament, training, teaming and combining forecasts each improved scored accuracy.",
      cite: "Mellers et al., Psychological Science, 2014",
      href: "https://doi.org/10.1177/0956797614524255",
    },
    {
      term: "Why we seal first",
      text: "Committing to a plan before the outcome separates a prediction from an after-the-fact story. A proper scoring rule rewards honest probabilities.",
      cite: "Nosek et al., PNAS, 2018; Gneiting and Raftery, 2007",
      href: "https://doi.org/10.1073/pnas.1708274114",
    },
  ] satisfies { term: string; text: string; cite: string; href: string }[],
};
