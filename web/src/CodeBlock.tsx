import { useEffect, useState } from "react";
import { Tabs } from "./Tabs";

export const LANGUAGES = [
  { id: "curl", label: "curl" },
  { id: "python", label: "Python" },
  { id: "typescript", label: "TypeScript" },
] as const;
export type Snippets = Partial<Record<(typeof LANGUAGES)[number]["id"], string>>;

// Four tones: names, keywords (heavier), punctuation and comments (muted), strings (accent).
const TOKEN =
  /(?<comment>(?<![:\w])(?:#|\/\/).*)|(?<string>"(?:[^"\\\n]|\\.)*"|'[^'\n]*'|`[^`]*`)|(?<punct>[{}()[\],.:;=<>|\\]+)|(?<keyword>-[A-Za-z]\b|\b(?:import|from|const|await|new|for|in|def|print)\b)|(?<name>[^\s{}()[\],.:;=<>|\\"'`]+)|(?<space>\s+)/g;

/** Splits code into [tone, text] pieces that join back to the original. */
export function tokenize(code: string): [string, string][] {
  return [...code.matchAll(TOKEN)].map((m) => {
    const [tone] = Object.entries(m.groups ?? {}).find(([, v]) => v !== undefined) ?? ["name"];
    return [tone, m[0]];
  });
}

/** Every code snippet in the app: the request in curl, Python and TypeScript, with Copy. */
export function CodeBlock({ code, label }: { code: Snippets; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  const tabs = LANGUAGES.filter((l) => code[l.id] !== undefined);
  return (
    <div className="codeblock">
      <Tabs
        surface="code"
        label={label}
        tabs={tabs}
        end={(active) => (
          <span className="codeblock-copy">
            <button
              type="button"
              className="link"
              onClick={() => {
                navigator.clipboard?.writeText(code[active as keyof Snippets] ?? "");
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <span className="sr-only" role="status">
              {copied ? "Copied to clipboard" : ""}
            </span>
          </span>
        )}
      >
        {(active) => (
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling code block must take keyboard focus
          <pre tabIndex={0}>
            <code>
              {tokenize(code[active as keyof Snippets] ?? "").map(([tone, text], i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens are static and never reordered
                <span key={i} className={`tok-${tone}`}>
                  {text}
                </span>
              ))}
            </code>
          </pre>
        )}
      </Tabs>
    </div>
  );
}
