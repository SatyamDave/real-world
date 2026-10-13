import { expect, test } from "vitest";
import { COLLABORATE, RESEARCH, THESIS, USE_CASES } from "./sections";

function allText(): string {
  return [
    THESIS.statement,
    ...THESIS.rows.flatMap((r) => [r.term, r.text]),
    USE_CASES.title,
    USE_CASES.note,
    ...USE_CASES.rows.flatMap((r) => [r.term, r.text]),
    RESEARCH.title,
    RESEARCH.note,
    ...RESEARCH.say,
    ...RESEARCH.leave,
    RESEARCH.caveat,
    ...Object.values(COLLABORATE),
  ].join("\n");
}

test("no forbidden claim (gtm/messaging.md 'Claims we may not make')", () => {
  const forbidden =
    /\d\s*%|beats the market|outperform|world model|100,?000|100\+ languages|replaces surveys|deterministic|backtest|bet on our/i;
  expect(allText()).not.toMatch(forbidden);
});

test("no internal strategy, competitor, price or model detail leaks into public copy", () => {
  const internal =
    /aaru|simile|\bYC\b|y combinator|pricing|\bICP\b|lens|persona|archetype|\bseat\b|enterprise|consultanc|customer|investor|series [a-z]|seed round|claude|anthropic|openai|gpt|llm/i;
  expect(allText()).not.toMatch(internal);
});

test("nothing depends on the app: no demo, no app link, no try-it wording", () => {
  expect(allText()).not.toMatch(/demo|try (it|today)|open the app|app\./i);
});

test("every claim that says 'scored' keeps the misses", () => {
  expect(allText()).toMatch(/misses included/);
});
