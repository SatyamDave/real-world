import type { Research } from "@real-world/sdk";
import { ApiCall } from "../ApiCall";
import { Disclosure, LoadError, Loading, plural, useLoad } from "../App";
import { rw } from "../api";

export const title = "Research";

type Experiment = Research["experiments"][number];
type Paper = Research["papers"][number];

const head = (hash: string) => `${hash.slice(0, 8)}…${hash.slice(-8)}`;
const num = (v: number) => v.toFixed(3);

function Results({ e }: { e: Experiment }) {
  if (e.results.length === 0) return <p className="muted small">No run committed yet.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Command</th>
            <th>Commit</th>
            <th>Model</th>
            <th>Primary result</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {e.results.map((r) => (
            <tr key={r.path}>
              <td data-label="Date" className="num">
                {r.date}
              </td>
              <td data-label="Command" className="num">
                {r.command}
              </td>
              <td data-label="Commit" className="num">
                {r.commit.slice(0, 7)}
              </td>
              <td data-label="Model" className="num">
                {r.model}
              </td>
              <td data-label="Primary result" className="num">
                {r.primary
                  ? `${num(r.primary.value)} (${num(r.primary.low)} to ${num(r.primary.high)}), n ${r.primary.n}`
                  : "—"}
              </td>
              <td data-label="Outcome">
                <span className={`stamp ${r.outcome === "supported" ? "good" : ""}`}>
                  {r.outcome}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExperimentCard({ e }: { e: Experiment }) {
  return (
    <section className="card research-item" aria-labelledby={`exp-${e.id}`}>
      <div className="world-head">
        <h3 id={`exp-${e.id}`}>
          <span className="mono">{e.id}</span> {e.title}
        </h3>
        <span className={`stamp ${e.status === "supported" ? "good" : "plain"}`}>{e.status}</span>
      </div>
      <p className="muted small">
        Registered <span className="mono">{e.registered}</span> by {e.owner}. Registered hash{" "}
        <span className="mono">{head(e.registry_sha256)}</span>; the file now hashes to{" "}
        <span className="mono">{head(e.prereg_sha256)}</span>.{" "}
        {e.hash_matches ? (
          <span className="stamp good">Hash matches</span>
        ) : (
          <span className="stamp">Changed since registered</span>
        )}{" "}
        <a href={e.prereg_url}>Read the pre-registration</a>
      </p>
      <dl className="research-terms">
        <dt>Hypothesis</dt>
        <dd>{e.hypothesis}</dd>
      </dl>
      <details className="method">
        <summary>Primary metric and kill criterion</summary>
        <dl className="research-terms">
          <dt>Primary metric</dt>
          <dd>{e.primary_metric}</dd>
          <dt>Kill criterion</dt>
          <dd>{e.kill_criterion}</dd>
        </dl>
      </details>
      <Results e={e} />
    </section>
  );
}

function PaperCard({ p }: { p: Paper }) {
  return (
    <section className="card research-item" aria-labelledby={`paper-${p.slug}`}>
      <div className="world-head">
        <h3 id={`paper-${p.slug}`}>{p.short_title}</h3>
        <span className="stamp plain">{p.stage}</span>
      </div>
      <p className="muted small">{p.title}</p>
      <dl className="research-terms">
        <dt>Claim</dt>
        <dd>{p.claim}</dd>
        <dt>Target venue</dt>
        <dd>{p.venue}</dd>
        <dt>Results still to come</dt>
        <dd>{p.pending}</dd>
        <dt>Build the PDF</dt>
        <dd>
          <code>{p.pdf.how}</code> or the {p.pdf.ci}
        </dd>
      </dl>
      <p className="small">
        <a href={p.tex_url}>Source</a> · <a href={p.status_url}>Status</a>
      </p>
    </section>
  );
}

function Registry({ r }: { r: Research }) {
  const run = r.experiments.filter((e) => e.results.length > 0).length;
  const changed = r.experiments.filter((e) => !e.hash_matches).length;
  const [sha, dirty] = r.commit.split("-");
  return (
    <div className="research">
      <section className="hero">
        <h1>Research</h1>
        <p className="muted">
          What we registered before we ran it, the hash of each pre-registration, every committed
          run with its miss, and the papers. Read from the repository at commit{" "}
          <a className="mono" href={`${r.repo}/commit/${sha}`}>
            {sha.slice(0, 7)}
          </a>
          {dirty && " plus uncommitted changes"}.
        </p>
      </section>
      <section aria-labelledby="research-experiments" className="research-group">
        <h2 id="research-experiments">Experiments</h2>
        <p className="muted small">
          {plural(r.experiments.length, "experiment")} registered, {run} with a committed run.{" "}
          {changed === 0
            ? "Every pre-registration still matches its registered hash."
            : `${plural(changed, "pre-registration")} changed after registration.`}{" "}
          The only runs so far are synthetic checks, labelled with model none; none is a forecast
          result.
        </p>
        {r.experiments.map((e) => (
          <ExperimentCard key={e.id} e={e} />
        ))}
      </section>
      <section aria-labelledby="research-papers" className="research-group">
        <h2 id="research-papers">Papers</h2>
        <p className="muted small">
          {plural(r.papers.length, "paper")}, each built only from committed artifacts. A paper
          states no result its index does not name.
        </p>
        {r.papers.map((p) => (
          <PaperCard key={p.slug} p={p} />
        ))}
      </section>
      <ApiCall path="/v1/research" sdk="research()" data={r} filename="research" />
      <Disclosure tiers={[]} />
    </div>
  );
}

export default function ResearchRoute() {
  const r = useLoad(() => rw.research());
  if (r.error) return <LoadError what="the research record" error={r.error} retry={r.retry} />;
  if (!r.data) return <Loading what="the research record" />;
  if (r.data.experiments.length === 0 && r.data.papers.length === 0)
    return <p className="muted">No experiment is registered yet. The first one appears here.</p>;
  return <Registry r={r.data} />;
}
