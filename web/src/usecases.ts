// Prepared inputs, one company decision each (product/playground.md,
// research/decisions/0015-founders-and-companies.md). Reaction texts are example messages and
// event texts are hypothetical events, not news. Nothing here tests election messaging or names a
// private person (product/acceptable-use.md).

export type Primitive = "reaction" | "event";

export type Who = "founders" | "growth" | "pricing" | "comms" | "entry";

export const WHO: [Who, string][] = [
  ["founders", "Founders"],
  ["growth", "Growth and marketing"],
  ["pricing", "Pricing and product"],
  ["comms", "Comms and PR"],
  ["entry", "Market entry"],
];

export type UseCase = {
  id: string;
  who: Who;
  title: string;
  blurb: string;
  primitive: Primitive;
  text: string;
  /** Shown on the card, literal. */
  audience: string;
  countries?: string[];
  ages?: ("18-34" | "35-54" | "55+")[];
};

export const USE_CASES: UseCase[] = [
  {
    id: "launch-post",
    who: "founders",
    primitive: "reaction",
    title: "Launch post",
    blurb: "Will the post announcing your product land, and with whom?",
    text: "Today we launch a calendar that books a meeting only when everyone has a free hour. Free for teams under ten.",
    audience: "Every simulated country",
  },
  {
    id: "launch-india",
    who: "founders",
    primitive: "reaction",
    title: "Launch in India",
    blurb: "Test a launch post on the young adults you want first.",
    text: "Our budgeting app is live in India today. See every rupee you spend in one place, free for students.",
    audience: "Adults 18-34 in India",
    countries: ["IND"],
    ages: ["18-34"],
  },
  {
    id: "waitlist-brazil",
    who: "founders",
    primitive: "reaction",
    title: "Waitlist launch in Brazil",
    blurb: "Check whether a waitlist offer makes people sign up or scroll past.",
    text: "Join the waitlist: the first 10,000 people in Brazil get a year of our language app free.",
    audience: "Brazil",
    countries: ["BRA"],
  },
  {
    id: "ad-line",
    who: "growth",
    primitive: "reaction",
    title: "Ad line",
    blurb: "Compare how an ad line reads in two English-speaking markets.",
    text: "Stop paying for software your team forgot it has. We find unused seats in five minutes.",
    audience: "The United States and the United Kingdom",
    countries: ["USA", "GBR"],
  },
  {
    id: "landing-headline",
    who: "growth",
    primitive: "reaction",
    title: "Landing page headline",
    blurb: "See which age bands a headline reaches before you spend on traffic.",
    text: "Customer support that answers in under a minute, in 40 languages.",
    audience: "Every simulated country",
  },
  {
    id: "price-rise",
    who: "pricing",
    primitive: "reaction",
    title: "Price rise from $8 to $10",
    blurb: "Read the reaction to a price rise before customers see it.",
    text: "From March 1 our Plus plan goes from $8 to $10 a month. Everything you have today stays included.",
    audience: "The United States",
    countries: ["USA"],
  },
  {
    id: "free-tier",
    who: "pricing",
    primitive: "reaction",
    title: "Ending the free plan",
    blurb: "Check how removing a free tier lands before you announce it.",
    text: "We are ending our free plan on June 30. Free accounts can export their data or move to Starter at $5 a month.",
    audience: "The United States, the United Kingdom and Germany",
    countries: ["USA", "GBR", "DEU"],
  },
  {
    id: "ai-personal-data",
    who: "pricing",
    primitive: "reaction",
    title: "A feature that uses AI on personal data",
    blurb: "See who welcomes it and who pulls back before it ships.",
    text: "Our new assistant reads your inbox to draft replies for you. You can turn it off at any time.",
    audience: "Every simulated country",
  },
  {
    id: "chip-shortage",
    who: "pricing",
    primitive: "event",
    title: "Phone prices double before your launch",
    blurb: "How a chip shortage that doubles phone prices shifts spending intent.",
    text: "A chip shortage doubles phone prices worldwide.",
    audience: "Every simulated country",
  },
  {
    id: "outage-apology",
    who: "comms",
    primitive: "reaction",
    title: "Outage apology",
    blurb: "Check whether an apology after an incident reads as sincere.",
    text: "Yesterday our service was down for six hours. That is on us. Every customer gets a free month.",
    audience: "Every simulated country",
  },
  {
    id: "return-to-office",
    who: "comms",
    primitive: "reaction",
    title: "Return-to-office announcement",
    blurb: "Read how a policy change lands with the public before it is reported.",
    text: "From September everyone at our company works from the office three days a week.",
    audience: "The United States, the United Kingdom and India",
    countries: ["USA", "GBR", "IND"],
  },
  {
    id: "sustainability-germany",
    who: "entry",
    primitive: "reaction",
    title: "Sustainability claim in Germany",
    blurb: "Test a green claim in a market that reads them closely.",
    text: "Every order now ships carbon neutral, at no extra cost to you.",
    audience: "Germany",
    countries: ["DEU"],
  },
  {
    id: "student-offer",
    who: "entry",
    primitive: "reaction",
    title: "Student offer in Mexico",
    blurb: "Test the offer you plan to enter a new country with.",
    text: "Now in Mexico: students get half price on every plan this month.",
    audience: "Adults 18-34 in Mexico",
    countries: ["MEX"],
    ages: ["18-34"],
  },
  {
    id: "rate-cut",
    who: "entry",
    primitive: "event",
    title: "A surprise rate cut",
    blurb: "How spending intent and optimism move in a market you are about to enter.",
    text: "The central bank surprises markets with a large interest rate cut.",
    audience: "The United States",
    countries: ["USA"],
  },
];

export const caseHref = (u: UseCase) => `/simulate?use=${u.id}`;

export const findUseCase = (id: string | null) => USE_CASES.find((u) => u.id === id);
