// Prepared inputs, one real decision each (product/playground.md). Reaction texts are example
// posts and event texts are hypothetical events, not news. Nothing here tests election messaging
// or names a private person (product/acceptable-use.md).

export type Primitive = "reaction" | "event";

export type Who = "creators" | "founders" | "newsrooms" | "policy" | "curious";

export const WHO: [Who, string][] = [
  ["creators", "Creators"],
  ["founders", "Founders and marketers"],
  ["newsrooms", "Newsrooms"],
  ["policy", "Policy and public affairs"],
  ["curious", "Curious people"],
];

export type UseCase = {
  id: string;
  who: Who;
  title: string;
  blurb: string;
  primitive: Primitive | "call";
  /** "" for a call. */
  text: string;
  /** Shown on the card, literal. */
  audience: string;
  countries?: string[];
  ages?: ("18-34" | "35-54" | "55+")[];
};

export const USE_CASES: UseCase[] = [
  {
    id: "video-hook",
    who: "creators",
    primitive: "reaction",
    title: "Video hook",
    blurb: "Check whether the first line of a video makes people stay.",
    text: "I lived on $20 of groceries a week for a month. Here is everything I ate.",
    audience: "Adults 18-34 in the United States",
    countries: ["USA"],
    ages: ["18-34"],
  },
  {
    id: "sponsored-post",
    who: "creators",
    primitive: "reaction",
    title: "Sponsored post",
    blurb: "See whether an honest sponsor read costs you trust.",
    text: "This video is sponsored by a budgeting app I have used for a year. My honest review, including what I do not like, is below.",
    audience: "The United States and the United Kingdom",
    countries: ["USA", "GBR"],
  },
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
    id: "price-rise",
    who: "founders",
    primitive: "reaction",
    title: "Price rise",
    blurb: "Read the reaction to a subscription price rise before customers see it.",
    text: "From next month our subscription goes from $8 to $10 a month. Here is what you get for it.",
    audience: "The United States",
    countries: ["USA"],
  },
  {
    id: "outage-apology",
    who: "founders",
    primitive: "reaction",
    title: "Outage apology",
    blurb: "Check whether an apology after an outage reads as sincere.",
    text: "Yesterday our service was down for six hours. That is on us. Every customer gets a free month.",
    audience: "Every simulated country",
  },
  {
    id: "student-offer",
    who: "founders",
    primitive: "reaction",
    title: "Student offer in India",
    blurb: "See whether a student discount lands with young adults in one country.",
    text: "Students get half price on every plan this week. Show your student ID at checkout.",
    audience: "Adults 18-34 in India",
    countries: ["IND"],
    ages: ["18-34"],
  },
  {
    id: "grocery-headline",
    who: "newsrooms",
    primitive: "reaction",
    title: "Cost-of-living headline",
    blurb: "Test a headline on younger and older readers before you publish.",
    text: "Your groceries cost more than three years ago. Here is where the money went.",
    audience: "Every simulated country",
  },
  {
    id: "energy-explainer",
    who: "newsrooms",
    primitive: "reaction",
    title: "Energy bill explainer",
    blurb: "See whether an explainer headline lands in two European countries.",
    text: "Why your energy bill will rise this winter, explained in four charts.",
    audience: "Germany and the United Kingdom",
    countries: ["DEU", "GBR"],
  },
  {
    id: "europe-heatwave",
    who: "newsrooms",
    primitive: "event",
    title: "Harvest failure",
    blurb: "Follow beliefs in Germany, France and the UK after a heatwave ruins the wheat harvest.",
    text: "A summer heatwave destroys much of the wheat harvest across Europe.",
    audience: "Germany, France and the United Kingdom",
    countries: ["DEU", "FRA", "GBR"],
  },
  {
    id: "ai-tutors",
    who: "policy",
    primitive: "event",
    title: "Free AI tutors",
    blurb:
      "What shifts in Brazil, India and the US if every public school student gets a free AI tutor?",
    text: "The government makes an AI tutor free for every public school student.",
    audience: "Brazil, India and the United States",
    countries: ["BRA", "IND", "USA"],
  },
  {
    id: "pension-age",
    who: "policy",
    primitive: "event",
    title: "Pension age rise",
    blurb:
      "Trace trust in government and spending intent after the pension age rises by two years.",
    text: "The government raises the state pension age by two years.",
    audience: "France, Germany and Japan",
    countries: ["FRA", "DEU", "JPN"],
  },
  {
    id: "rate-cut",
    who: "policy",
    primitive: "event",
    title: "Surprise rate cut",
    blurb: "Trace spending intent and optimism after a surprise interest rate cut.",
    text: "The central bank surprises markets with a large interest rate cut.",
    audience: "The United States",
    countries: ["USA"],
  },
  {
    id: "chip-shortage",
    who: "curious",
    primitive: "event",
    title: "Phone prices double",
    blurb: "How do worries about prices move if phone prices double worldwide?",
    text: "A chip shortage doubles phone prices worldwide.",
    audience: "Every simulated country",
  },
  {
    id: "todays-call",
    who: "curious",
    primitive: "call",
    title: "Today's question",
    blurb: "Call one real question against the AI, whose call is sealed before you answer.",
    text: "",
    audience: "Everyone, one question a day",
  },
];

export const caseHref = (u: UseCase) =>
  u.primitive === "call" ? "/call" : `/simulate?use=${u.id}`;

export const findUseCase = (id: string | null) =>
  USE_CASES.find(
    (u): u is UseCase & { primitive: Primitive } => u.id === id && u.primitive !== "call",
  );
