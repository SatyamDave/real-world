// Runs the README quickstart verbatim in plain Node against a live API; `make e2e` starts one.
import { expect, it } from "vitest";

declare const process: { env: Record<string, string | undefined> };
const URL = process.env.RW_API_URL;
const README = "../README.md?raw";
// Variable specifiers keep these Node modules out of the type check and the bundler.
const FS = "node:fs";
const CP = "node:child_process";
const HERE = "../";

it.skipIf(!URL)(
  "README quickstart runs under plain node and prints a typed result",
  async () => {
    const readme: string = (await import(/* @vite-ignore */ README)).default;
    const block = readme.match(/```ts\n([\s\S]*?)```/)?.[1];
    expect(block).toBeDefined();
    const fs = (await import(/* @vite-ignore */ FS)) as {
      mkdtempSync(prefix: string): string;
      writeFileSync(path: string, data: string): void;
      rmSync(path: string, opts: { recursive: boolean; force: boolean }): void;
    };
    const cp = (await import(/* @vite-ignore */ CP)) as {
      execFileSync(file: string, args: string[], opts: { encoding: "utf8" }): string;
    };
    // Inside the package so `@real-world/sdk` resolves to it, as in a workspace install.
    const dir = fs.mkdtempSync(new globalThis.URL(`${HERE}.quickstart-`, import.meta.url).pathname);
    try {
      const file = `${dir}/quickstart.mts`;
      fs.writeFileSync(file, (block ?? "").replace("http://localhost:8000", URL ?? ""));
      const lines = cp.execFileSync("node", [file], { encoding: "utf8" }).split("\n");
      expect(lines[0]).toMatch(/^AI-simulated\./);
      expect(lines.some((l) => l.includes(" p10 "))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
  120_000,
);
