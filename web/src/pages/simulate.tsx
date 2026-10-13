import type { Country, PostTestOut, RetroResult, SimulateResult } from "@real-world/sdk";
import { useState } from "react";
import { failure, pct, useLoad } from "../App";
import { rw } from "../api";
import { UseCaseList } from "../Home";
import { EventResult, ReactionResult } from "../results";
import { account, useSession } from "../session";
import { findUseCase, type Primitive } from "../usecases";

export const title = "Simulate";

const MAX = 500;
const AGES = ["18-34", "35-54", "55+"] as const;
type Age = (typeof AGES)[number];
type Audience = { country: string; ages: Age[] };

export default function Simulate() {
  const params = new URLSearchParams(location.search);
  const start = findUseCase(params.get("use"));
  const world = useLoad(() => rw.world());
  const session = useSession();
  const [primitive, setPrimitive] = useState<Primitive>(start?.primitive ?? "reaction");
  const [text, setText] = useState(start?.text ?? (params.get("text") ?? "").trim().slice(0, MAX));
  const [audience, setAudience] = useState<Audience>({
    country:
      start?.countries?.length === 1
        ? start.countries[0]
        : start
          ? ""
          : /^[A-Z]{3}$/.test(params.get("country") ?? "")
            ? (params.get("country") as string)
            : "",
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
  const [asked, setAsked] = useState("");

  const chosen = () => countries ?? (audience.country ? [audience.country] : null);

  async function run(input = text) {
    setBusy(true);
    setStatus("");
    setAsked(input);
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
    history.replaceState(null, "", `/simulate?use=${id}`);
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
  const ran = reaction || event;
  return (
    <div className="simulate">
      <h1>Simulate</h1>
      <p className="lead muted">
        Test a message or one event on today's simulated populations. Every result is AI-simulated
        and shows its coverage tier.
      </p>
      <div className="kind-tabs" role="radiogroup" aria-label="Simulation">
        {(["reaction", "event"] as const).map((p) => (
          <label key={p} className={primitive === p ? "on" : undefined}>
            <input
              type="radio"
              name="primitive"
              checked={primitive === p}
              onChange={() => setPrimitive(p)}
            />
            {p === "reaction" ? "Test a message" : "Test an event"}
          </label>
        ))}
        <a href="/call">Call today's question</a>
      </div>
      {primitive === "event" && (
        <p className="muted small">See how beliefs in 16 countries shift after one event.</p>
      )}
      <form
        className="card bench"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor="pg-text" className="bench-label">
          {primitive === "reaction" ? "Message" : "Event"}
        </label>
        <textarea
          id="pg-text"
          rows={4}
          maxLength={MAX}
          value={text}
          placeholder={
            primitive === "reaction"
              ? "Paste a launch post, a price change, a headline or an announcement"
              : "One event in plain words, such as: The central bank cuts rates sharply."
          }
          onChange={(e) => setText(e.target.value)}
        />
        <p className="muted small land-counter">
          {text.length} of {MAX} characters
        </p>
        <div className="bench-controls">
          <fieldset>
            <legend className="bench-label">Audience</legend>
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
            <fieldset>
              <legend className="bench-label">Your gut, before you see the result</legend>
              {(["lands", "flops"] as const).map((g) => (
                <label key={g} className="chip">
                  <input type="radio" name="gut" checked={gut === g} onChange={() => setGut(g)} />
                  It {g}
                </label>
              ))}
            </fieldset>
          ) : (
            <label className="bench-days">
              <span className="bench-label">Simulated days</span>
              <input
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </label>
          )}
          <button
            type="submit"
            className="primary"
            disabled={
              busy || !text.trim() || (primitive === "reaction" && audience.ages.length === 0)
            }
          >
            {primitive === "reaction" ? "Test my message" : "Test the event"}
          </button>
        </div>
        <p className="mono small muted">
          {world.data
            ? `World of ${world.data.date} · ${world.data.countries.length} simulated populations`
            : ""}
        </p>
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
      ) : event ? (
        <EventResult result={event} text={asked} />
      ) : null}
      {!ran && !busy && (
        <section className="decisions" aria-labelledby="decisions">
          <h2 id="decisions">Start from a real decision</h2>
          <UseCaseList only={primitive} onPick={pick} />
        </section>
      )}
    </div>
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
