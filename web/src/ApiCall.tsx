import { API_URL } from "./api";

const csvCell = (v: unknown) => {
  const s = v !== null && typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export const toCsv = (rows: Record<string, unknown>[]) => {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [cols, ...rows.map((r) => cols.map((c) => r[c]))]
    .map((r) => r.map(csvCell).join(","))
    .join("\n");
};

function save(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Snippet({ label, code }: { label: string; code: string }) {
  return (
    <div className="api-snippet">
      <p className="muted small">
        {label}{" "}
        <button type="button" className="link" onClick={() => navigator.clipboard?.writeText(code)}>
          Copy
        </button>
      </p>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** The exact calls that return what the page shows, with the data itself to download. */
export function ApiCall(p: {
  path: string;
  sdk: string;
  data?: unknown;
  csv?: Record<string, unknown>[];
  filename?: string;
}) {
  const name = p.filename ?? "real-world";
  return (
    <section className="api-call" aria-labelledby="api-call">
      <h3 id="api-call">Get this via API</h3>
      <Snippet label="curl" code={`curl ${API_URL}${p.path}`} />
      <Snippet
        label="Python"
        code={`from realworld import Client\n\nClient("${API_URL}").${p.sdk}`}
      />
      <Snippet label="TypeScript" code={`new Client("${API_URL}").${p.sdk}`} />
      <p className="api-downloads">
        {p.data !== undefined && (
          <button
            type="button"
            onClick={() =>
              save(`${name}.json`, "application/json", JSON.stringify(p.data, null, 2))
            }
          >
            Download JSON
          </button>
        )}
        {p.csv && (
          <button type="button" onClick={() => save(`${name}.csv`, "text/csv", toCsv(p.csv ?? []))}>
            Download CSV
          </button>
        )}
      </p>
    </section>
  );
}
