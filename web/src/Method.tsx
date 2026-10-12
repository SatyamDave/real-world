import type { ReactNode } from "react";

const BLOB = "https://github.com/SatyamDave/real-world/blob/main/";

/** The formula, parameters as used and n behind a number, with its source file and paper. */
export function Method(p: {
  children: ReactNode;
  source: string;
  paper?: { title: string; href: string };
}) {
  return (
    <details className="method">
      <summary>How this is computed</summary>
      {p.children}
      <p className="muted small method-foot">
        Source: <a href={BLOB + p.source}>{p.source}</a>
        {p.paper && (
          <>
            {" "}
            Paper: <a href={p.paper.href}>{p.paper.title}</a>
          </>
        )}
      </p>
    </details>
  );
}
