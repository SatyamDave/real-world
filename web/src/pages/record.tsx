import type { Person, SealedTest } from "@real-world/sdk";
import { useState } from "react";
import { failure, LoadError, Loading, pct, plural, SealGrid, shortDate, useLoad } from "../App";
import { account, sealOf, signInHref, useSession } from "../session";

export const title = "Your tests";

export default function Record() {
  const session = useSession();
  if (session.error)
    return <LoadError what="your tests" error={session.error} retry={session.retry} />;
  if (session.data === undefined) return <Loading what="your tests" />;
  if (session.data === null) return <SignedOut />;
  return <Signed person={session.data} />;
}

const BRIER_LINE = "Brier: 0 is perfect, 0.25 is a coin flip.";

/** The record's anatomy with nothing in it yet, and the one way to start it. */
function SignedOut() {
  return (
    <div className="record">
      <h1>Your tests</h1>
      <p className="lead muted">
        Every message test you seal waits here until you mark how it did. Then the engine and your
        gut are scored on the same messages.
      </p>
      <section className="card receipt" aria-label="The engine vs your gut">
        <div className="receipt-top">
          <span className="slip-kind">The engine vs your gut</span>
          <span className="stamp plain">Not signed in</span>
        </div>
        <div className="record-cols">
          {["The engine", "Your gut"].map((who) => (
            <div key={who}>
              <h2>{who}</h2>
              <p className="mono record-brier">– Brier</p>
              <p className="mono small muted">0 marked tests</p>
            </div>
          ))}
        </div>
        <div className="record-empty">
          <SealGrid />
          <a href={signInHref("/record")} className="button primary">
            Sign in to keep your tests
          </a>
        </div>
      </section>
      <p className="muted small">{BRIER_LINE}</p>
    </div>
  );
}

function Signed({ person }: { person: Person }) {
  const r = useLoad(() => account.tests());
  return (
    <div className="record">
      <h1>Your tests</h1>
      {r.error ? (
        <LoadError what="your tests" error={r.error} retry={r.retry} />
      ) : !r.data ? (
        <Loading what="your tests" />
      ) : r.data.tests.length === 0 ? (
        <p>
          No sealed tests yet. <a href="/">Test a message to start.</a>
        </p>
      ) : (
        <>
          <section className="card record-strip" aria-labelledby="vs">
            <h2 id="vs">The engine vs your gut</h2>
            {r.data.marked === 0 ? (
              <p>Mark a test Landed or Flopped once you know how it did.</p>
            ) : (
              <>
                <div className="record-cols">
                  {(
                    [
                      ["The engine", r.data.scores.engine],
                      ["A plain baseline", r.data.scores.baseline],
                      ["Your gut", r.data.scores.gut],
                    ] as const
                  ).map(([who, s]) => (
                    <p key={who}>
                      {who}{" "}
                      <span className="mono record-brier">
                        {s.brier === null ? "–" : s.brier.toFixed(3)}
                      </span>{" "}
                      <span className="mono small muted">n = {s.n}</span>
                    </p>
                  ))}
                </div>
                {r.data.scores.engine_beats_baseline === false && (
                  <p>The engine does not beat the plain baseline on your marked tests.</p>
                )}
                <p className="mono small">
                  {plural(r.data.marked, "marked test")} · hits {r.data.hits} of {r.data.marked}
                </p>
              </>
            )}
            <p className="muted small">{BRIER_LINE}</p>
          </section>
          <Rows
            title="Waiting to be marked"
            tests={r.data.tests.filter((t) => !t.outcome)}
            onMarked={r.retry}
          />
          <Rows title="Marked" tests={r.data.tests.filter((t) => t.outcome)} onMarked={r.retry} />
        </>
      )}
      <Account person={person} />
    </div>
  );
}

function Rows({
  title,
  tests,
  onMarked,
}: {
  title: string;
  tests: SealedTest[];
  onMarked: () => void;
}) {
  if (!tests.length) return null;
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
      <ol className="record-rows">
        {tests.map((t) => (
          <TestRow key={t.seal.id} test={t} onMarked={onMarked} />
        ))}
      </ol>
    </section>
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
    <li>
      <SealGrid hash={test.seal.sha256} />
      <div className="record-row-body">
        <p className="record-post">"{test.text}"</p>
        <p className="mono small muted">
          Sealed {shortDate(test.seal.sealed_at)} · {test.seal.sha256.slice(0, 12)} · intent{" "}
          {pct(test.intent)}
          {test.gut && ` · your gut: it ${test.gut}`}
          {test.brier !== null && ` · engine Brier ${test.brier.toFixed(3)}`}
          {test.gut_brier !== null && ` · gut Brier ${test.gut_brier.toFixed(3)}`} ·{" "}
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
      </div>
      <div className="record-row-act">
        {test.outcome ? (
          <span className={`stamp${test.outcome === "landed" ? " good" : ""}`}>
            {test.outcome === "landed" ? "Landed" : "Flopped"}
          </span>
        ) : (
          <>
            <button type="button" onClick={() => mark("landed")}>
              Landed
            </button>
            <button type="button" onClick={() => mark("flopped")}>
              Flopped
            </button>
          </>
        )}
      </div>
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
