import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders the Real World heading and the simulation disclaimer", () => {
  const html = renderToStaticMarkup(<App />);
  expect(html).toContain("<h1>Real World</h1>");
  expect(html).toContain("Simulation, not a poll or a prediction of a real person");
});
