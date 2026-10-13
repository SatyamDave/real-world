import type { PostTestOut, RetroResult } from "@real-world/sdk";
import { useState } from "react";
import { failure, pct } from "../App";
import { UseCaseList } from "../Home";
import { ReactionResult } from "../results";
import { account, useSession } from "../session";
import { findUseCase } from "../usecases";

export const title = "Simulate";

const MAX = 500;
const AGES = ["18-34", "35-54", "55+"] as const;
type Age = (typeof AGES)[number];

export default function Simulate() {
  const params = new URLSearchParams(location.search);
  const start = findUseCase(params.get("use"));
  const session = useSession();
  const [text, setText] = useState(
    start?.message ?? (params.get("text") ?? "").trim().slice(0, MAX),
  );
  const [ages, setAges] = useState<Age[]>([...AGES]);
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
          gut,
          countries: null,
          age_bands: ages.length === AGES.length ? null : ages,
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
        Test a message on simulated consumers. Every result is AI-simulated and shows its coverage
        tier.
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
          <fieldset>
            <legend className="bench-label">Age</legend>
            <span className="chips">
              {AGES.map((age) => (
                <label key={age} className="chip">
                  <input
                    type="checkbox"
                    checked={ages.includes(age)}
                    onChange={() =>
                      setAges((a) => (a.includes(age) ? a.filter((x) => x !== age) : [...a, age]))
                    }
                  />
                  {age}
                </label>
              ))}
            </span>
          </fieldset>
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
            disabled={busy || !text.trim() || ages.length === 0}
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
        <Retrospective />
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

function Retrospective() {
  const [posts, setPosts] = useState<Past[]>([{ text: "", outcome: "landed" }]);
  const [out, setOut] = useState<RetroResult | null>(null);
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
      setOut(await account.retrospective({ posts: filled, countries: null, age_bands: null }));
    } catch (e) {
      setStatus(failure(e, "Could not run the check. The server did not respond"));
    }
    setBusy(false);
  }

  return (
    <details className="retro">
      <summary>Check it on messages you already published</summary>
      <p className="muted small">
        Paste up to five messages and say how each did. The engine calls each one without knowing.
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
        {posts.length < 5 && (
          <button
            type="button"
            onClick={() => setPosts((all) => [...all, { text: "", outcome: "landed" }])}
          >
            Add a message
          </button>
        )}{" "}
        <button type="button" disabled={busy || !filled.length} onClick={run}>
          Run the check
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
            The engine would have called {out.hits} of {out.posts.length}.
          </p>
          <ul className="segments">
            {out.posts.map((p) => (
              <li key={p.text}>
                <span>{p.text}</span>
                <span className="mono">{pct(p.landing_chance)}</span>
                <span>
                  {p.outcome}, {p.hit ? "called" : "missed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
