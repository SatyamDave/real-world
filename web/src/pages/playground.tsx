import type { Country, PostTestOut, RetroResult, SimulateResult } from "@real-world/sdk";
import { useState } from "react";
import { failure, pct, useLoad } from "../App";
import { rw } from "../api";
import { EventResult, ReactionResult } from "../results";
import { account, useSession } from "../session";
import { findUseCase, type Primitive, USE_CASES } from "../usecases";

export const title = "Playground";

const MAX = 500;
const AGES = ["18-34", "35-54", "55+"] as const;
type Age = (typeof AGES)[number];
type Audience = { country: string; ages: Age[] };

const LESSONS = [
  ["Reaction", "Will a launch post land?", "launch-post"],
  ["Event", "What if phone prices double?", "chip-shortage"],
  ["Call", "Today's question, sealed", null],
] as const;

export default function Playground() {
  const start = findUseCase(new URLSearchParams(location.search).get("use"));
  const world = useLoad(() => rw.world());
  const session = useSession();
  const [primitive, setPrimitive] = useState<Primitive>(start?.primitive ?? "reaction");
  const [text, setText] = useState(start?.text ?? "");
  const [audience, setAudience] = useState<Audience>({
    country: start?.countries?.length === 1 ? start.countries[0] : "",
    ages: start?.ages ?? [...AGES],
  });
  const [countries, setCountries] = useState<string[] | null>(
    start?.countries && start.countries.length > 1 ? start.countries : null,
  );
  const [gut, setGut] = useState<"lands" | "flops" | null>(null);
  const [days, setDays] = useState(7);
  const [reaction, setReaction] = useState<PostTestOut | null>(null);
  const [event, setEvent] = useState<SimulateResult | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const chosen = () => countries ?? (audience.country ? [audience.country] : null);

  async function run(input = text) {
    setBusy(true);
    setStatus("");
    setReaction(null);
    setEvent(null);
    try {
      if (primitive === "reaction") {
        setReaction(
          await account.test({
            text: input,
            gut,
            countries: chosen(),
            age_bands: audience.ages.length === AGES.length ? null : audience.ages,
          }),
        );
      } else {
        const job = await rw.simulate({ event: { text: input, countries: chosen() }, days });
        setEvent(await rw.wait(job.id));
      }
    } catch (e) {
      setStatus(failure(e, "Could not run the simulation. The server did not respond"));
    }
    setBusy(false);
  }

  const pick = (id: string) => {
    const u = findUseCase(id);
    if (!u) return;
    history.replaceState(null, "", `/playground?use=${id}`);
    setPrimitive(u.primitive);
    setText(u.text);
    setAudience({
      country: u.countries?.length === 1 ? u.countries[0] : "",
      ages: u.ages ?? [...AGES],
    });
    setCountries(u.countries && u.countries.length > 1 ? u.countries : null);
    setReaction(null);
    setEvent(null);
  };

  const list: Country[] = world.data?.countries ?? [];
  return (
    <div className="playground">
      <form
        className="pg-input"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="pg-bar">
          <span className="mono">Playground</span>
          <span className="tabs-mini" role="radiogroup" aria-label="Primitive">
            {(["reaction", "event"] as const).map((p) => (
              <label key={p} className={`chip${primitive === p ? " on" : ""}`}>
                <input
                  type="radio"
                  name="primitive"
                  checked={primitive === p}
                  onChange={() => setPrimitive(p)}
                />
                {p === "reaction" ? "Reaction" : "Event"}
              </label>
            ))}
            <a className="chip" href="/call">
              Call
            </a>
          </span>
        </div>
        <label htmlFor="pg-text" className="pg-label">
          {primitive === "reaction" ? "Post" : "Event"}
        </label>
        <textarea
          id="pg-text"
          rows={6}
          maxLength={MAX}
          value={text}
          placeholder={
            primitive === "reaction"
              ? "Paste a tweet, a caption, a headline or a hook"
              : "One event in plain words, such as: The central bank cuts rates sharply."
          }
          onChange={(e) => setText(e.target.value)}
        />
        <p className="muted small land-counter">
          {text.length} of {MAX} characters
        </p>
        <fieldset className="pg-fields">
          <legend className="pg-label">Audience</legend>
          {countries ? (
            <p className="small">
              {countries.map((iso) => list.find((c) => c.iso3 === iso)?.name ?? iso).join(", ")}{" "}
              <button type="button" className="link" onClick={() => setCountries(null)}>
                Change
              </button>
            </p>
          ) : (
            <select
              aria-label="Country"
              value={audience.country}
              onChange={(e) => setAudience((a) => ({ ...a, country: e.target.value }))}
            >
              <option value="">Every simulated country</option>
              {list.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.name} (tier {c.tier})
                </option>
              ))}
            </select>
          )}
          {primitive === "reaction" && (
            <span className="chips">
              {AGES.map((age) => (
                <label key={age} className="chip">
                  <input
                    type="checkbox"
                    checked={audience.ages.includes(age)}
                    onChange={() =>
                      setAudience((a) => ({
                        ...a,
                        ages: a.ages.includes(age)
                          ? a.ages.filter((x) => x !== age)
                          : [...a.ages, age],
                      }))
                    }
                  />
                  {age}
                </label>
              ))}
            </span>
          )}
        </fieldset>
        {primitive === "reaction" ? (
          <fieldset className="pg-fields">
            <legend className="pg-label">Your gut, before you see the result</legend>
            {(["lands", "flops"] as const).map((g) => (
              <label key={g} className="chip">
                <input type="radio" name="gut" checked={gut === g} onChange={() => setGut(g)} />
                It {g}
              </label>
            ))}
          </fieldset>
        ) : (
          <label className="pg-fields">
            <span className="pg-label">Simulated days</span>
            <input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </label>
        )}
        <div className="pg-run">
          <span className="mono small muted">
            {world.data ? `World of ${world.data.date}` : ""}
          </span>
          <button
            type="submit"
            className="primary"
            disabled={
              busy || !text.trim() || (primitive === "reaction" && audience.ages.length === 0)
            }
          >
            Run
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
        {primitive === "reaction" && <Retrospective countries={chosen()} />}
      </form>
      <div className="pg-output">
        {reaction ? (
          <ReactionResult
            out={reaction}
            signedIn={Boolean(session.data)}
            onRetest={(post) => {
              setText(post);
              run(post);
            }}
          />
        ) : event ? (
          <EventResult result={event} />
        ) : (
          <Lessons onPick={pick} />
        )}
      </div>
    </div>
  );
}

function Lessons({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section className="lessons" aria-labelledby="lessons">
      <p className="mono eyebrow">EXAMPLE REQUESTS</p>
      <h2 id="lessons">Learn to simulate</h2>
      <p className="mono eyebrow">WALKTHROUGH LESSONS</p>
      <div className="lesson-cards">
        {LESSONS.map(([tag, line, id]) =>
          id ? (
            <button key={tag} type="button" className="lesson" onClick={() => onPick(id)}>
              <span className="lesson-tag mono">{tag}</span>
              <strong>{line}</strong>
            </button>
          ) : (
            <a key={tag} className="lesson" href="/call">
              <span className="lesson-tag mono">{tag}</span>
              <strong>{line}</strong>
            </a>
          ),
        )}
      </div>
      <p className="mono eyebrow">REAL-LIFE USE CASES</p>
      <ul className="usecase-rows">
        {USE_CASES.map((u) => (
          <li key={u.id}>
            <button type="button" onClick={() => onPick(u.id)}>
              <strong>{u.title}</strong> <span className="muted">{u.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Past = { text: string; outcome: "landed" | "flopped" };

function Retrospective({ countries }: { countries: string[] | null }) {
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
      setOut(await account.retrospective({ posts: filled, countries, age_bands: null }));
    } catch (e) {
      setStatus(failure(e, "Could not run the check. The server did not respond"));
    }
    setBusy(false);
  }

  return (
    <details className="retro">
      <summary>Check it on posts you already published</summary>
      <p className="muted small">
        Paste up to five posts and say how each did. The engine calls each one without knowing.
      </p>
      {posts.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows have no id and are only appended
        <div key={i} className="retro-row">
          <textarea
            aria-label={`Past post ${i + 1}`}
            rows={2}
            maxLength={MAX}
            value={p.text}
            onChange={(e) => set(i, { text: e.target.value })}
          />
          <select
            aria-label={`How post ${i + 1} did`}
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
            Add a post
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
