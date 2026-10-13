import type { Country, PostTestOut, RetroResult, SegmentReaction } from "@real-world/sdk";
import { useState } from "react";
import { Disclosure, failure, pct, TierBadge, usd } from "./App";
import { account, signInHref } from "./session";

const MAX = 500;
const AGES = ["18-34", "35-54", "55+"] as const;
type Age = (typeof AGES)[number];
const MIX: [keyof PostTestOut["result"]["mix"], string][] = [
  ["scroll_past", "Scroll past"],
  ["read", "Read"],
  ["like", "Like"],
  ["share", "Share"],
];

type Audience = { country: string; ages: Age[] };

const audienceBody = (a: Audience) => ({
  countries: a.country ? [a.country] : null,
  age_bands: a.ages.length === AGES.length ? null : a.ages,
});

export function WillItLand({ countries, signedIn }: { countries: Country[]; signedIn: boolean }) {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>({ country: "", ages: [...AGES] });
  const [gut, setGut] = useState<"lands" | "flops" | null>(null);
  const [out, setOut] = useState<PostTestOut | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(post = text) {
    setBusy(true);
    setStatus("");
    setOut(null);
    try {
      setOut(await account.test({ text: post, gut, ...audienceBody(audience) }));
    } catch (e) {
      setStatus(failure(e, "Could not test the post. The server did not respond"));
    }
    setBusy(false);
  }

  const toggleAge = (age: Age) =>
    setAudience((a) => ({
      ...a,
      ages: a.ages.includes(age) ? a.ages.filter((x) => x !== age) : [...a.ages, age],
    }));

  return (
    <div className="land">
      <section className="thesis" aria-labelledby="land-title">
        <h1 id="land-title">Will this land?</h1>
        <p>
          Test a post on simulated audiences in {countries.length || 16} countries before you post
          it. Signed in, every test is sealed when you make it, so you can see later whether the
          engine or your gut was right.
        </p>
      </section>
      <form
        className="card land-form"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor="post">Your post</label>
        <textarea
          id="post"
          rows={5}
          maxLength={MAX}
          value={text}
          placeholder="Paste a tweet, a caption, a headline or a hook"
          onChange={(e) => setText(e.target.value)}
        />
        <p className="muted small land-counter">
          {text.length} of {MAX} characters
        </p>
        <fieldset className="land-audience">
          <legend>Who sees it</legend>
          <select
            aria-label="Country"
            value={audience.country}
            onChange={(e) => setAudience((a) => ({ ...a, country: e.target.value }))}
          >
            <option value="">Every simulated country</option>
            {countries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name} (tier {c.tier})
              </option>
            ))}
          </select>
          <span className="chips">
            {AGES.map((age) => (
              <label key={age} className="chip">
                <input
                  type="checkbox"
                  checked={audience.ages.includes(age)}
                  onChange={() => toggleAge(age)}
                />
                {age}
              </label>
            ))}
          </span>
        </fieldset>
        <fieldset className="land-gut">
          <legend>Your gut, before you see the result</legend>
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
          disabled={busy || !text.trim() || audience.ages.length === 0}
        >
          Test it
        </button>
        {busy && (
          <p className="muted small loading" role="status">
            <span className="spinner" aria-hidden="true" />
            Asking the simulated audiences
          </p>
        )}
        {status && (
          <p className="small load-error" role="alert">
            {status}
          </p>
        )}
      </form>
      {out && (
        <Result
          out={out}
          signedIn={signedIn}
          onRetest={(post) => {
            setText(post);
            run(post);
          }}
        />
      )}
      <Retrospective audience={audience} />
    </div>
  );
}

function Segments({ title, rows }: { title: string; rows: SegmentReaction[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="segments">
        {rows.map((s) => (
          <li key={s.segment}>
            <span>{s.label}</span>
            <span className="mono">{pct(s.landing)}</span>
            <TierBadge tier={s.coverage_tier} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Result({
  out,
  signedIn,
  onRetest,
}: {
  out: PostTestOut;
  signedIn: boolean;
  onRetest: (post: string) => void;
}) {
  const r = out.result;
  const fake = r.provider === "fake";
  const tiers = [...r.best, ...r.worst].map((s) => s.coverage_tier);
  return (
    <section className="card receipt land-result" aria-live="polite">
      <div className="receipt-top">
        <span>Post test</span>
        <span className={`stamp${out.seal ? " good" : ""}`}>
          {out.seal ? "Sealed" : "Not sealed"}
        </span>
      </div>
      <p className="land-chance">
        <span className="stat-value">{pct(r.landing_chance)}</span>
        <span>landing chance: the share of this audience who would like or share it</span>
      </p>
      <p className="muted small">
        {pct(r.band[0])} to {pct(r.band[1])} across {r.segments} audiences (p10 to p90).{" "}
        {r.calibration}.
      </p>
      <div className="mix" role="img" aria-label="Reaction mix">
        {MIX.map(([k, label]) => (
          <span key={k} className={`mix-${k}`}>
            {label} {pct(r.mix[k])}
          </span>
        ))}
      </div>
      <div className="land-sides">
        <Segments title="Most likely to like or share it" rows={r.best} />
        <Segments title="Least likely" rows={r.worst} />
      </div>
      {r.voices.map((v) => (
        <blockquote key={v.label} className="voice">
          <span className="stamp">
            {v.simulated}
            {fake ? ", fake model, placeholder text" : ""}
          </span>
          <p>{v.text}</p>
          <footer className="muted small">{v.label}</footer>
        </blockquote>
      ))}
      <div className="rewrite">
        <h3>One rewrite to test</h3>
        <p>{r.rewrite}</p>
        <button type="button" onClick={() => onRetest(r.rewrite)}>
          Test this version
        </button>
      </div>
      {out.seal ? (
        <p className="small mono seal">
          Sealed {new Date(out.seal.sealed_at).toLocaleString()} · {out.seal.sha256.slice(0, 12)}.{" "}
          <a href="/record">Mark it in your record once you know how it did</a>
        </p>
      ) : (
        <p className="small">
          {signedIn ? "" : "Sign in to seal this test and keep your record. "}
          {!signedIn && <a href={signInHref("/")}>Sign in</a>}
        </p>
      )}
      <p className="muted small">
        {r.model_calls} model calls · {fake ? "fake model, nothing spent" : usd(r.cost_usd)}
      </p>
      <Disclosure tiers={tiers} />
    </section>
  );
}

type Past = { text: string; outcome: "landed" | "flopped" };

function Retrospective({ audience }: { audience: Audience }) {
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
      setOut(await account.retrospective({ posts: filled, ...audienceBody(audience) }));
    } catch (e) {
      setStatus(failure(e, "Could not run the check. The server did not respond"));
    }
    setBusy(false);
  }

  return (
    <details className="card retro">
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
        <button type="button" className="primary" disabled={busy || !filled.length} onClick={run}>
          Run the check
        </button>
      </p>
      {busy && (
        <p className="muted small loading" role="status">
          <span className="spinner" aria-hidden="true" />
          Asking the simulated audiences
        </p>
      )}
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
          <Disclosure tiers={[]} />
        </div>
      )}
    </details>
  );
}
