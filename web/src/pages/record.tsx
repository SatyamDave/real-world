import type { Person, SealedTest } from "@real-world/sdk";
import { useState } from "react";
import { failure, LoadError, Loading, pct, plural, useLoad } from "../App";
import { account, sealOf, signInHref, useSession } from "../session";

export const title = "Your record";

export default function Record() {
  const session = useSession();
  if (session.error)
    return <LoadError what="your record" error={session.error} retry={session.retry} />;
  if (session.data === undefined) return <Loading what="your record" />;
  if (session.data === null)
    return (
      <section className="card">
        <h1>Your record</h1>
        <p>
          Sign in to keep your record. <a href={signInHref("/record")}>Sign in</a>
        </p>
      </section>
    );
  return <Signed person={session.data} />;
}

function Signed({ person }: { person: Person }) {
  const r = useLoad(() => account.tests());
  return (
    <div className="record">
      <h1>Your record</h1>
      {r.error ? (
        <LoadError what="your record" error={r.error} retry={r.retry} />
      ) : !r.data ? (
        <Loading what="your record" />
      ) : r.data.tests.length === 0 ? (
        <p>
          No sealed tests yet. <a href="/">Test a post to start your record.</a>
        </p>
      ) : (
        <>
          {r.data.marked === 0 || r.data.brier === null ? (
            <p>Mark a test Landed or Flopped once you know how it did.</p>
          ) : (
            <p className="mono">
              Engine {r.data.brier.toFixed(3)}
              {r.data.gut_brier !== null && ` · your gut ${r.data.gut_brier.toFixed(3)}`} on{" "}
              {plural(r.data.marked, "marked test")} (Brier, lower is better) · hits {r.data.hits}{" "}
              of {r.data.marked}
            </p>
          )}
          <ol className="tests">
            {r.data.tests.map((t) => (
              <TestRow key={t.seal.id} test={t} onMarked={r.retry} />
            ))}
          </ol>
        </>
      )}
      <p className="muted small">
        Your calls against the AI show under each <a href="/call">Call it</a> question.
      </p>
      <Account person={person} />
    </div>
  );
}

function TestRow({ test, onMarked }: { test: SealedTest; onMarked: () => void }) {
  const [status, setStatus] = useState("");
  const [check, setCheck] = useState("");
  async function mark(outcome: "landed" | "flopped") {
    setStatus("");
    try {
      await account.mark(test.seal.id, outcome);
      onMarked();
    } catch (e) {
      setStatus(failure(e, "The mark was not saved"));
    }
  }
  return (
    <li className="card receipt">
      <div className="receipt-top">
        <span className="mono small">
          Sealed {new Date(test.seal.sealed_at).toLocaleString()} · {test.seal.sha256.slice(0, 12)}
        </span>
        <span className={`stamp${test.outcome ? " good" : ""}`}>
          {test.outcome ? `Marked ${test.outcome}` : "Not marked"}
        </span>
      </div>
      <p>{test.text}</p>
      <p className="small">
        Landing chance {pct(test.landing_chance)}
        {test.gut && ` · your gut: it ${test.gut}`}
        {test.brier !== null && ` · engine Brier ${test.brier.toFixed(3)}`}
        {test.gut_brier !== null && ` · gut Brier ${test.gut_brier.toFixed(3)}`}
      </p>
      {!test.outcome && (
        <p>
          <button type="button" onClick={() => mark("landed")}>
            Landed
          </button>{" "}
          <button type="button" onClick={() => mark("flopped")}>
            Flopped
          </button>
        </p>
      )}
      <p className="small">
        <button
          type="button"
          className="link"
          onClick={async () =>
            setCheck(
              (await sealOf(test.body)) === test.seal.sha256
                ? "Seal matches"
                : "Seal does not match",
            )
          }
        >
          Check seal
        </button>{" "}
        {check && <span role="status">{check}</span>}
      </p>
      {status && (
        <p className="small load-error" role="alert">
          {status}
        </p>
      )}
    </li>
  );
}

function Account({ person }: { person: Person }) {
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState("");
  const leave = async (run: () => Promise<unknown>, to: string) => {
    try {
      await run();
      location.assign(to);
    } catch (e) {
      setStatus(failure(e, "The server did not respond"));
    }
  };
  return (
    <section className="card account">
      <p className="small">Signed in as {person.email}</p>
      <p>
        <button type="button" onClick={() => leave(() => account.signOut(), "/")}>
          Sign out
        </button>{" "}
        <button type="button" onClick={() => leave(() => account.signOut(true), "/")}>
          Sign out everywhere
        </button>{" "}
        <button type="button" onClick={() => setConfirm(true)}>
          Delete account
        </button>
      </p>
      {confirm && (
        <div role="alertdialog" aria-label="Delete account" className="confirm">
          <p>
            Delete your account? Your email and sessions are removed, and your sealed tests stay
            without your name. This cannot be undone.
          </p>
          {/* biome-ignore lint/a11y/noAutofocus: a destructive confirm focuses the safe action */}
          <button type="button" autoFocus onClick={() => setConfirm(false)}>
            Cancel
          </button>{" "}
          <button type="button" onClick={() => leave(() => account.remove(), "/?deleted=1")}>
            Delete account
          </button>
        </div>
      )}
      {status && (
        <p className="small load-error" role="alert">
          {status}
        </p>
      )}
    </section>
  );
}
