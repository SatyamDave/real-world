// Prepared playground inputs, one real decision each (product/playground.md). Event texts are
// hypothetical events, not news; Reaction texts are example posts.

export type Primitive = "reaction" | "event";

export type UseCase = {
  id: string;
  title: string;
  blurb: string;
  primitive: Primitive;
  text: string;
  countries?: string[];
  ages?: ("18-34" | "35-54" | "55+")[];
};

export const USE_CASES: UseCase[] = [
  {
    id: "launch-post",
    title: "Launch post",
    blurb: "Will the post announcing your product land, and with whom?",
    primitive: "reaction",
    text: "Today we launch an app that tells you how a post will land before you post it. Free to try.",
  },
  {
    id: "price-rise",
    title: "Price rise announcement",
    blurb: "Read the reaction to a subscription price rise before customers see it.",
    primitive: "reaction",
    text: "From next month our subscription goes from $8 to $10 a month. Here is what you get for it.",
    countries: ["USA"],
  },
  {
    id: "headline-test",
    title: "Headline test",
    blurb: "Test a news headline on younger and older readers before you publish.",
    primitive: "reaction",
    text: "Your groceries cost 20% more than three years ago. Here is where the money went.",
  },
  {
    id: "apology",
    title: "Apology post",
    blurb: "Check whether an apology after an outage reads as sincere.",
    primitive: "reaction",
    text: "Yesterday our service was down for six hours. That is on us. Every customer gets a free month.",
  },
  {
    id: "student-offer",
    title: "Student offer in India",
    blurb: "See whether a student discount lands with young adults in one country.",
    primitive: "reaction",
    text: "Students get half price on every plan this week. Show your student ID at checkout.",
    countries: ["IND"],
    ages: ["18-34"],
  },
  {
    id: "chip-shortage",
    title: "Supply shock",
    blurb: "How do worries about prices move if phone prices double worldwide?",
    primitive: "event",
    text: "A chip shortage doubles phone prices worldwide.",
  },
  {
    id: "europe-heatwave",
    title: "Harvest failure",
    blurb: "Follow beliefs in Germany, France and the UK after a heatwave ruins the wheat harvest.",
    primitive: "event",
    text: "A summer heatwave destroys much of the wheat harvest across Europe.",
    countries: ["DEU", "FRA", "GBR"],
  },
  {
    id: "ai-tutors",
    title: "Public policy",
    blurb: "What shifts in Brazil, India and the US if every student gets a free AI tutor?",
    primitive: "event",
    text: "The government makes an AI tutor free for every public school student.",
    countries: ["BRA", "IND", "USA"],
  },
  {
    id: "rate-cut",
    title: "Central bank surprise",
    blurb: "Trace spending intent and optimism after a surprise rate cut.",
    primitive: "event",
    text: "The central bank surprises markets with a large interest rate cut.",
    countries: ["USA"],
  },
];

export const findUseCase = (id: string | null) => USE_CASES.find((u) => u.id === id);
