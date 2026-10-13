// Prepared inputs for the "Start from a real decision" list: a consumer founder's idea, the ideal
// consumer in plain words, and the message to test. The messages are examples, not shipped copy.
// Nothing here tests election messaging or names a private person (product/acceptable-use.md).

export type UseCase = {
  id: string;
  category: string;
  idea: string;
  /** The ideal consumer, in plain words. */
  icp: string;
  message: string;
};

export const USE_CASES: UseCase[] = [
  {
    id: "habit-app",
    category: "Consumer app",
    idea: "A habit tracker that texts you instead of sending push notifications",
    icp: "Adults 22 to 35 who have downloaded and deleted three habit apps",
    message: "Habits stick when they find you. Reply to one text a day and keep your streak. Free.",
  },
  {
    id: "dtc-sheets",
    category: "E-commerce and DTC",
    idea: "Bamboo bed sheets sold direct, with a 100-night trial",
    icp: "Hot sleepers aged 28 to 45 who read sheet reviews before buying",
    message: "Sleep cool or send them back. 100 nights to decide, and we pay the return shipping.",
  },
  {
    id: "marketplace-tools",
    category: "Marketplace",
    idea: "A neighbourhood marketplace for renting power tools by the day",
    icp: "Homeowners who need a tool once a year and hate buying it",
    message: "Why buy a $200 drill for one shelf? Rent one from a neighbour for $12 a day.",
  },
  {
    id: "fintech-savings",
    category: "Consumer fintech",
    idea: "A savings app that rounds up purchases and moves the change into a high-yield account",
    icp: "Hourly and gig workers who want to save but never remember to move money",
    message: "Save without noticing. We round up every purchase and move the change to 4.2% APY.",
  },
  {
    id: "health-sleep",
    category: "Health",
    idea: "A coached sleep program for shift workers, delivered by text",
    icp: "Nurses, drivers and warehouse staff on rotating shifts who sleep badly",
    message: "Your schedule changes every week. Your sleep plan should too. Start a 14-day trial.",
  },
  {
    id: "hardware-bottle",
    category: "Hardware",
    idea: "A water bottle that glows when you are behind on drinking water",
    icp: "Desk workers who forget to drink and already own an expensive bottle",
    message: "The bottle that nags you kindly. It glows when you are behind. $39, no app required.",
  },
  {
    id: "local-cleaning",
    category: "Local services",
    idea: "Same-week house cleaning with one flat price for any home under 2,000 sq ft",
    icp: "Dual-income households in suburbs who want one price with no quote calls",
    message: "One price, $129. Any home under 2,000 sq ft. Book in two minutes, cleaned this week.",
  },
  {
    id: "creator-clips",
    category: "Creator tools",
    idea: "A tool that cuts a podcast episode into captioned short clips",
    icp: "Independent podcasters with under 5,000 listeners who post on social video",
    message: "Upload one episode, get ten captioned clips in ten minutes. First five clips free.",
  },
  {
    id: "ai-tutor",
    category: "Consumer AI",
    idea: "An AI companion that helps you rehearse hard conversations",
    icp: "Adults 25 to 40 who avoid difficult talks with a boss, landlord or family member",
    message:
      "Practice the conversation you are dreading before you have it. Private, and free to try.",
  },
  {
    id: "game-cozy",
    category: "Games",
    idea: "A cozy mobile game where you run a tiny bakery, with no timers or energy bars",
    icp: "Casual mobile players, mostly women 25 to 45, tired of pay-to-wait games",
    message: "A bakery game with no timers. Play five minutes or five hours. One price, no ads.",
  },
  {
    id: "food-meal-kit",
    category: "Food",
    idea: "A weekly box of fresh pasta and sauce from one regional chef",
    icp: "Couples 28 to 45 who cook on weeknights and care where food comes from",
    message: "Fresh pasta from one chef, at your door Thursday. $34 a box, skip any week.",
  },
  {
    id: "travel-weekend",
    category: "Travel",
    idea: "Weekend trips planned for you within a three-hour drive, with the stay booked",
    icp: "City couples 27 to 40 who want a getaway but dread planning one",
    message: "Tell us your budget and we plan the weekend. Stay, dinner and a hike, booked.",
  },
  {
    id: "edu-language",
    category: "Education",
    idea: "A conversation-first Spanish course with a live tutor in every lesson",
    icp: "Adults 30 to 50 who stalled on a language app and want to speak on a trip",
    message: "Speak Spanish by your trip. Every lesson is a real conversation with a live tutor.",
  },
  {
    id: "consumer-pets",
    category: "Consumer app",
    idea: "A shared app for splitting pet care between roommates and partners",
    icp: "Young couples and roommates who share a dog or cat and argue about chores",
    message: "Who fed the dog? Now you will know. Shared pet care for two, free.",
  },
  {
    id: "marketplace-secondhand",
    category: "Marketplace",
    idea: "A resale marketplace for kids' clothing with prepaid shipping labels",
    icp: "Parents of children under 8 who outgrow clothes every few months",
    message: "Sell outgrown kids' clothes in a bag. We label, ship and pay you. No listing photos.",
  },
];

export const caseHref = (u: UseCase) => `/simulate?use=${u.id}`;

export const findUseCase = (id: string | null) => USE_CASES.find((u) => u.id === id);
