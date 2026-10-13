import type { BacktestResult, PostTestOut } from "@real-world/sdk";
import { useState } from "react";
import { failure, pct } from "../App";
import { UseCaseList } from "../Home";
import { ReactionResult } from "../results";
import { account, useSession } from "../session";
import { findUseCase } from "../usecases";

export const title = "Simulate";

const MAX = 500;

export default function Simulate() {
  const params = new URLSearchParams(location.search);
  const start = findUseCase(params.get("use"));
  const session = useSession();
  const [text, setText] = useState(
    start?.message ?? (params.get("text") ?? "").trim().slice(0, MAX),
  );
  const [idea, setIdea] = useState(start?.idea ?? "");
  const [icp, setIcp] = useState(start?.icp ?? "");
  const [gut, setGut] = useState<"lands" | "flops" | null>(null);
  const [reaction, setReaction] = useState<PostTestOut | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState("");

  async function run(input = text) {
    setBusy(true);
    setStatus("");
    setAsked(input);
    setReaction(null);
    try {
      setReaction(
        await account.test({
          text: input,
          idea: idea.trim(),
          icp: icp.trim(),
          gut,
        }),
      );
    } catch (e) {
      setStatus(failure(e, "Could not run the simulation. The server did not respond"));
    }
    setBusy(false);
  }

  return (
    <div className="simulate">
      <h1>Simulate</h1>
      <p className="lead muted">
        Test a message on simulated consumers. Every result is AI-simulated and is labelled as
        simulated.
      </p>
      <form
        className="card bench"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor="pg-text" className="bench-label">
          Message
        </label>
        <textarea
          id="pg-text"
          rows={4}
          maxLength={MAX}
          value={text}
          placeholder="Paste a launch message, a price change or a headline"
          onChange={(e) => setText(e.target.value)}
        />
        <p className="muted small land-counter">
          {text.length} of {MAX} characters
        </p>
        <div className="bench-controls">
          <label className="bench-days">
            <span className="bench-label">What are you building?</span>
            <input
              type="text"
              maxLength={200}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
          </label>
          <label className="bench-days">
            <span className="bench-label">Your ideal customer</span>
            <input
              type="text"
              maxLength={300}
              value={icp}
              onChange={(e) => setIcp(e.target.value)}
            />
          </label>
          <fieldset>
            <legend className="bench-label">Your gut, before you see the result</legend>
            {(["lands", "flops"] as const).map((g) => (
              <label key={g} className="chip">
                <input type="radio" name="gut" checked={gut === g} onChange={() => setGut(g)} />
                It {g}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            className="primary"
            disabled={busy || !text.trim() || idea.trim().length < 3 || icp.trim().length < 3}
          >
            Test my message
          </button>
        </div>
        {busy && (
          <p className="muted small loading" role="status">
            <span className="spinner" aria-hidden="true" />
            Running the simulation
          </p>
        )}
        {status && (
          <p className="small load-error" role="alert">
            {status}
          </p>
        )}
        <Backtest idea={idea.trim()} icp={icp.trim()} />
      </form>
      {reaction ? (
        <ReactionResult
          out={reaction}
          text={asked}
          signedIn={Boolean(session.data)}
          onRetest={(post) => {
            setText(post);
            run(post);
          }}
        />
      ) : (
        !busy && (
          <section className="decisions" aria-labelledby="decisions">
            <h2 id="decisions">Start from a real decision</h2>
            <UseCaseList />
          </section>
        )
      )}
    </div>
  );
}

type Past = { text: string; outcome: "landed" | "flopped" };

function Backtest({ idea, icp }: { idea: string; icp: string }) {
  const [posts, setPosts] = useState<Past[]>([{ text: "", outcome: "landed" }]);
  const [out, setOut] = useState<BacktestResult | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const filled = posts.filter((p) => p.text.trim());
  const set = (i: number, p: Partial<Past>) =>
    setPosts((all) => all.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function run() {
    setBusy(true);
    setStatus("");
    setOut(null);
    try {
      setOut(await account.backtest({ idea, icp, messages: filled }));
    } catch (e) {
      setStatus(failure(e, "Could not run the backtest. The server did not respond"));
    }
    setBusy(false);
  }

  return (
    <details className="retro">
      <summary>Backtest on messages you already published</summary>
      <p className="muted small">
        Fill in the two fields above, then paste up to ten messages and say how each did. The engine
        calls each one without knowing.
      </p>
      {posts.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows have no id and are only appended
        <div key={i} className="retro-row">
          <textarea
            aria-label={`Past message ${i + 1}`}
            rows={2}
            maxLength={MAX}
            value={p.text}
            onChange={(e) => set(i, { text: e.target.value })}
          />
          <select
            aria-label={`How message ${i + 1} did`}
            value={p.outcome}
            onChange={(e) => set(i, { outcome: e.target.value as Past["outcome"] })}
          >
            <option value="landed">Landed</option>
            <option value="flopped">Flopped</option>
          </select>
        </div>
      ))}
      <p>
        {posts.length < 10 && (
          <button
            type="button"
            onClick={() => setPosts((all) => [...all, { text: "", outcome: "landed" }])}
          >
            Add a message
          </button>
        )}{" "}
        <button
          type="button"
          disabled={busy || !filled.length || idea.length < 3 || icp.length < 3}
          onClick={run}
        >
          Run the backtest
        </button>
      </p>
      {status && (
        <p className="small load-error" role="alert">
          {status}
        </p>
      )}
      {out && (
        <div aria-live="polite">
          <p>
            <span className="stamp">{out.label}</span>
          </p>
          <p>
            The engine called {out.hits} of {out.marked}, the plain baseline {out.baseline_hits} of{" "}
            {out.marked}.
          </p>
          <ul className="segments">
            {out.messages.map((m) => (
              <li key={m.text}>
                <span>{m.text}</span>
                <span className="mono">{pct(m.intent)}</span>
                <span>{m.outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
