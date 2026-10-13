import type { PostTestOut, SegmentResult } from "@real-world/sdk";
import { useState } from "react";
import { pct, SealRow, sentence, usd } from "./App";
import { Trajectory } from "./Chart";
import { signInHref } from "./session";
import { postShareText } from "./share";

export const MIX: [keyof PostTestOut["result"]["mix"], string][] = [
  ["ignore", "Ignore"],
  ["read", "Read"],
  ["like", "Like"],
  ["share", "Share"],
];

/** The reaction mix as one bar whose parts add to 100%; under 720px its labels move to a legend. */
export function MixBar({ mix }: { mix: PostTestOut["result"]["mix"] }) {
  const items = MIX.map(([k, label]) => [k, `${label} ${pct(mix[k])}`] as const);
  return (
    <>
      <div
        className="mixbar"
        role="img"
        aria-label={`Reaction mix: ${items.map(([, t]) => t).join(", ")}`}
      >
        {items.map(([k, t]) => (
          <span
            key={k}
            className={`mixbar-${k}`}
            style={{ /* design: computed width */ flexGrow: mix[k] }}
            title={t}
          >
            {t}
          </span>
        ))}
      </div>
      <p className="mono mixbar-legend" aria-hidden="true">
        {items.map(([k, t]) => (
          <span key={k}>
            <span className={`swatch mixbar-${k}`} />
            {t}
          </span>
        ))}
      </p>
    </>
  );
}

const utc = (iso: string) => `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC`;

/** The slip's foot: the seal drawn and written out, or an empty grid and how to get one. */
function SealLine({ seal }: { seal: PostTestOut["seal"] }) {
  return seal ? (
    <div className="seal-line seal">
      <SealRow hash={seal.sha256} title={`Sealed ${utc(seal.sealed_at)}`}>
        <p className="seal-hash">
          {[0, 16, 32, 48].map((i) => (
            <span key={i}>{seal.sha256.slice(i, i + 16)}</span>
          ))}
        </p>
        <a href="/record">Mark it in your tests once you know how it did</a>
      </SealRow>
    </div>
  ) : (
    <div className="seal-line">
      <SealRow title="Not sealed">
        Sign in to seal this test and keep your record. <a href={signInHref()}>Sign in</a>
      </SealRow>
    </div>
  );
}

/** Copies the result as one line of text; when the clipboard refuses, shows the text to select. */
function CopyResult({ text }: { text: string }) {
  const [state, setState] = useState<"" | "copied" | "failed">("");
  return (
    <div className="copy-result">
      <button
        type="button"
        onClick={() =>
          navigator.clipboard.writeText(text).then(
            () => {
              setState("copied");
              setTimeout(() => setState(""), 2000);
            },
            () => setState("failed"),
          )
        }
      >
        Copy result
      </button>
      <span role="status" className="small">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Copy failed: select the text below"
            : ""}
      </span>
      {state === "failed" && (
        <textarea className="share-text" readOnly rows={3} value={text} aria-label="Result text" />
      )}
    </div>
  );
}

function Segments({ title, rows }: { title: string; rows: SegmentResult[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="segments">
        {rows.map((s) => (
          <li key={s.segment}>
            <span>{sentence(s.label)}</span>
            <span className="mono">{pct(s.intent)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReactionResult({
  out,
  text,
  signedIn,
  onRetest,
}: {
  out: PostTestOut;
  text: string;
  signedIn: boolean;
  onRetest: (post: string) => void;
}) {
  const r = out.result;
  const fake = r.provider === "fake";
  return (
    <section className="card receipt land-result" aria-live="polite">
      <div className="receipt-top">
        <span className="slip-kind">Message test</span>
        <span className={`stamp${out.seal ? " good" : ""}`}>
          {out.seal ? "Sealed" : "Not sealed"}
        </span>
      </div>
      <blockquote className="slip-quote">{text}</blockquote>
      <p className="land-chance">
        <span className="big">{pct(r.intent)}</span>
        <span>would sign up, try or buy</span>
      </p>
      <p className="muted small">
        {pct(r.intent_band[0])} to {pct(r.intent_band[1])} across {r.segments.length} segments (p10
        to p90). A plain single prompt says {pct(r.baseline_intent)}. {r.agents} simulated
        consumers. {r.calibration}.
      </p>
      <h3>Reaction mix</h3>
      <MixBar mix={r.mix} />
      <h3>Objections</h3>
      <ul className="segments">
        {r.objections.map((o) => (
          <li key={o.objection}>
            <span>{o.objection}</span>
            <span className="mono">{pct(o.share)}</span>
          </li>
        ))}
      </ul>
      <div className="land-sides">
        <Segments title="Most likely to sign up, try or buy" rows={r.best} />
        <Segments title="Least likely" rows={r.worst} />
      </div>
      <h3>What people say</h3>
      {r.voices.map((v) => (
        <blockquote key={v.label} className="voice">
          <span className="stamp">
            {v.simulated}
            {fake ? ", fake model, placeholder text" : ""}
          </span>
          <p>{v.text}</p>
          <footer className="muted small">{sentence(v.label)}</footer>
        </blockquote>
      ))}
      <div className="rewrite">
        <h3>One rewrite to test</h3>
        <p>{r.rewrite}</p>
        <button type="button" onClick={() => onRetest(r.rewrite)}>
          Test this version
        </button>
      </div>
      {(out.seal || !signedIn) && <SealLine seal={out.seal} />}
      <CopyResult text={postShareText(out, text, location.origin)} />
      <p className="muted small">
        {r.model_calls} model calls · {fake ? "fake model, nothing spent" : usd(r.cost_usd)}
      </p>
      <p className="disclosure">{r.disclosure}</p>
    </section>
  );
}
