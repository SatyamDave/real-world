// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ApiCall, toCsv } from "./ApiCall";
import { API_URL } from "./api";
import { Method } from "./Method";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let box: HTMLDivElement;
beforeEach(() => {
  box = document.body.appendChild(document.createElement("div"));
});
afterEach(() => {
  box.remove();
  vi.restoreAllMocks();
});
const draw = (node: React.ReactNode) => act(async () => createRoot(box).render(node));
const click = (text: string) =>
  act(async () => {
    [...box.querySelectorAll("button")].find((b) => b.textContent === text)?.click();
  });

test("it shows the curl, Python and TypeScript calls with the real API URL", async () => {
  await draw(<ApiCall path="/v1/receipts" sdk="receipts()" />);
  expect(box.querySelector("h3")?.textContent).toBe("Get this via API");
  const code = [...box.querySelectorAll("pre code")].map((c) => c.textContent);
  expect(code).toEqual([
    `curl ${API_URL}/v1/receipts`,
    `from realworld import Client\n\nClient("${API_URL}").receipts()`,
    `new Client("${API_URL}").receipts()`,
  ]);
  expect(box.textContent).not.toContain("Download CSV");
});

test("Copy writes the snippet to the clipboard", async () => {
  const writeText = vi.fn();
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  await draw(<ApiCall path="/v1/receipts" sdk="receipts()" />);
  await act(async () => box.querySelector<HTMLButtonElement>("button.link")?.click());
  expect(writeText).toHaveBeenCalledWith(`curl ${API_URL}/v1/receipts`);
});

test("the download buttons build a Blob of the data and of the CSV rows", async () => {
  const blobs: Blob[] = [];
  URL.createObjectURL = (b: Blob | MediaSource) => {
    blobs.push(b as Blob);
    return "blob:x";
  };
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await draw(
    <ApiCall path="/p" sdk="s()" data={{ a: 1 }} csv={[{ a: 1, b: 'x,"y"' }]} filename="f" />,
  );
  await click("Download JSON");
  await click("Download CSV");
  expect(await blobs[0].text()).toBe('{\n  "a": 1\n}');
  expect(await blobs[1].text()).toBe('a,b\n1,"x,""y"""');
  expect(toCsv([{ a: 1 }, { b: 2 }])).toBe("a,b\n1,\n,2");
});

test("Method links its source file and paper", async () => {
  await draw(
    <Method source="engine/rw/score.py" paper={{ title: "Scoring", href: "/paper#scoring" }}>
      <code>Brier = (p - o)^2</code>
    </Method>,
  );
  expect(box.querySelector("details.method summary")?.textContent).toBe("How this is computed");
  expect(box.querySelector("code")?.textContent).toBe("Brier = (p - o)^2");
  const links = [...box.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")]);
  expect(links).toEqual([
    ["engine/rw/score.py", "https://github.com/SatyamDave/real-world/blob/main/engine/rw/score.py"],
    ["Scoring", "/paper#scoring"],
  ]);
});

test("Method without a paper has only the source link", async () => {
  await draw(<Method source="engine/rw/score.py">n = 3</Method>);
  expect(box.querySelectorAll("a").length).toBe(1);
  expect(box.textContent).not.toContain("Paper:");
});
