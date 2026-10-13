// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CodeBlock, type Snippets, tokenize } from "./CodeBlock";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let box: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  box = document.body.appendChild(document.createElement("div"));
});
afterEach(() => {
  box.remove();
  vi.useRealTimers();
});
const code = { curl: "curl -s https://x/v1", python: "rw = Client()", typescript: "new Client()" };
const draw = (c: Snippets = code) =>
  act(async () => createRoot(box).render(<CodeBlock label="Call" code={c} />));
const tabs = () => [...box.querySelectorAll<HTMLButtonElement>("[role=tab]")];
const shown = () => box.querySelector("pre code")?.textContent;

test("the tokenizer loses nothing and uses four tones", () => {
  const src = `import x from "y"  # note\nrw.get({"a": 1}, -H "k")\ncurl https://h/p`;
  const parts = tokenize(src);
  expect(parts.map(([, t]) => t).join("")).toBe(src);
  const tone = (text: string) => parts.find(([, t]) => t === text)?.[0];
  expect([tone("import"), tone('"y"'), tone("# note"), tone("({"), tone("rw")]).toEqual([
    "keyword",
    "string",
    "comment",
    "punct",
    "name",
  ]);
  expect(tone("-H")).toBe("keyword");
  // A URL's // is not a comment.
  expect(parts.some(([k, t]) => k === "comment" && t.includes("h/p"))).toBe(false);
});

test("tabs run curl, Python, TypeScript; arrows move and the choice persists", async () => {
  await draw();
  expect(tabs().map((t) => t.textContent)).toEqual(["curl", "Python", "TypeScript"]);
  expect(shown()).toBe(code.curl);
  await act(async () =>
    tabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })),
  );
  expect(shown()).toBe(code.python);
  expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
  expect(tabs()[0].tabIndex).toBe(-1);
  await act(async () =>
    tabs()[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })),
  );
  await act(async () =>
    tabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })),
  );
  expect(shown()).toBe(code.typescript);
  box.replaceChildren();
  box = document.body.appendChild(document.createElement("div"));
  await draw();
  expect(shown()).toBe(code.typescript);
});

test("a block with one language shows one tab, and Copy says Copied for 1.5s", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn();
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  await draw({ curl: "curl x" });
  expect(tabs().length).toBe(1);
  const copy = () => box.querySelector<HTMLButtonElement>("button.link");
  await act(async () => copy()?.click());
  expect(writeText).toHaveBeenCalledWith("curl x");
  expect(copy()?.textContent).toBe("Copied");
  expect(box.querySelector("[role=status]")?.textContent).toBe("Copied to clipboard");
  await act(async () => vi.advanceTimersByTime(1500));
  expect(copy()?.textContent).toBe("Copy");
});
