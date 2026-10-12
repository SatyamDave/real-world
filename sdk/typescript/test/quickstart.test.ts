// Runs the README quickstart verbatim against a live API; `make e2e` starts one.
import { expect, it, vi } from "vitest";
import { Client } from "../src/index";

declare const process: { env: Record<string, string | undefined> };
const URL = process.env.RW_API_URL;
const README = "../README.md?raw";

it.skipIf(!URL)(
  "README quickstart prints a typed result",
  async () => {
    const readme: string = (await import(/* @vite-ignore */ README)).default;
    const block = readme.match(/```ts\n([\s\S]*?)```/)?.[1];
    expect(block).toBeDefined();
    const code = (block ?? "")
      .replace(/^import .*$/m, "")
      .replace("http://localhost:8000", URL ?? "");
    const AsyncFunction = (async () => {}).constructor as new (
      ...args: string[]
    ) => (client: typeof Client) => Promise<void>;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await new AsyncFunction("Client", code)(Client);
    const lines = log.mock.calls.map((c) => String(c[0]));
    log.mockRestore();
    expect(lines[0]).toMatch(/^AI-simulated\./);
    expect(lines.some((l) => l.includes(" p10 "))).toBe(true);
  },
  120_000,
);
