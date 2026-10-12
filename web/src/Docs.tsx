import spec from "../../api/openapi.json";
import readme from "../../README.md?raw";
import pyReadme from "../../sdk/python/README.md?raw";
import tsReadme from "../../sdk/typescript/README.md?raw";
import { API_URL } from "./api";

type Schema = {
  $ref?: string;
  type?: string;
  description?: string;
  properties?: Record<string, Schema>;
  enum?: string[];
};
type Content = Record<string, { schema?: Schema } | undefined>;
type Response = { description: string; content?: Content };
type Operation = {
  summary: string;
  description?: string;
  requestBody?: { content: Content };
  responses: Record<string, Response>;
};

const schemas = spec.components.schemas as Record<string, Schema>;
const deref = (s?: Schema) => (s?.$ref ? schemas[s.$ref.split("/").at(-1) ?? ""] : s);

export const OPERATIONS = Object.entries(
  spec.paths as Record<string, Record<string, Operation>>,
).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, op]) => ({ path, method, op })),
);

/** The first fenced block in a README that contains `marker`, so the snippet is the README's own. */
const block = (md: string, marker: string) =>
  [...md.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]).find((b) => b.includes(marker)) ??
  "";

/** The READMEs show a local API; the rendered snippet points at the API this app talks to. */
export const atApi = (snippet: string, base = API_URL) =>
  snippet.replace(/(http:\/\/)?localhost:8000/g, base.replace(/\/$/, ""));

const REPO = "https://github.com/SatyamDave/real-world/blob/main";

function Fields({ schema }: { schema: Schema }) {
  const s = deref(schema);
  return (
    <dl className="fields">
      {Object.entries(s?.properties ?? {}).map(([name, f]) => (
        <div key={name}>
          <dt className="mono">{name}</dt>
          <dd>{f.description ?? deref(f)?.description ?? f.type}</dd>
        </div>
      ))}
    </dl>
  );
}

function OperationCard({ path, method, op }: (typeof OPERATIONS)[number]) {
  const body = op.requestBody?.content["application/json"]?.schema;
  // Every stable `code` a refusal body on this operation can carry, once each.
  const codes = [
    ...new Set(
      Object.values(op.responses).flatMap(
        (r) => deref(r.content?.["application/json"]?.schema)?.properties?.code?.enum ?? [],
      ),
    ),
  ];
  return (
    <section className="card receipt op" aria-label={`${method.toUpperCase()} ${path}`}>
      <div className="receipt-top">
        <span className="mono op-path">
          <span className="op-method">{method.toUpperCase()}</span> {path}
        </span>
      </div>
      <p>{op.summary}</p>
      {op.description && <p className="muted small">{op.description}</p>}
      {body && (
        <>
          <h3>Request body</h3>
          <Fields schema={body} />
        </>
      )}
      <h3>Responses</h3>
      <dl className="fields">
        {Object.entries(op.responses).map(([status, r]) => (
          <div key={status}>
            <dt className="mono">{status}</dt>
            <dd>{r.description}</dd>
          </div>
        ))}
      </dl>
      {codes.length > 0 && (
        <>
          <h3>Refusal codes</h3>
          <p className="codes">
            {codes.map((c) => (
              <code key={c}>{c}</code>
            ))}
          </p>
        </>
      )}
    </section>
  );
}

export function Docs() {
  return (
    <div className="docs">
      <section className="hero">
        <h1>{spec.info.title}</h1>
        <p className="muted">
          {spec.info.description} Version <span className="mono">{spec.info.version}</span>.
        </p>
      </section>

      <section className="card first-call">
        <h2>First call</h2>
        <pre>{atApi(block(readme, "curl"))}</pre>
        <p className="small">
          It returns <code>202</code> with a job id. Poll <code>GET /v1/simulations/{"{id}"}</code>{" "}
          until <code>status</code> is <code>succeeded</code>. The same request with the same{" "}
          <code>Idempotency-Key</code> returns the same job.
        </p>
        <p className="small">
          Without a key the caller is anonymous. With one, send{" "}
          <code>Authorization: Bearer rw_...</code>; keys are issued by the founder, and there is no
          sign-up.
        </p>
        <p className="small">
          <a href={`${API_URL}/openapi.json`}>openapi.json</a> ·{" "}
          <a href={`${API_URL}/llms.txt`}>llms.txt</a> ·{" "}
          <a href={`${API_URL}/docs`}>Interactive docs</a>
        </p>
      </section>

      <h2>Operations</h2>
      {OPERATIONS.map((o) => (
        <OperationCard key={`${o.method} ${o.path}`} {...o} />
      ))}

      <h2>SDK quickstarts</h2>
      <section className="card">
        <h3>
          Python: <a href={`${REPO}/sdk/python/README.md`}>sdk/python/README.md</a>
        </h3>
        <pre>{atApi(block(pyReadme, "from realworld"))}</pre>
        <h3>
          TypeScript: <a href={`${REPO}/sdk/typescript/README.md`}>sdk/typescript/README.md</a>
        </h3>
        <pre>{atApi(block(tsReadme, "@real-world/sdk"))}</pre>
      </section>
    </div>
  );
}
