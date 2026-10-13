import { useState } from "react";
import { failure } from "../App";
import { account } from "../session";

export const title = "Sign in";

const next = () => {
  const to = new URLSearchParams(location.search).get("next") ?? "/record";
  return to.startsWith("/") && !to.startsWith("//") ? to : "/record";
};

export default function SignIn({ param }: { param?: string }) {
  return param === "confirm" ? <Confirm /> : <Request />;
}

function Request() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<{ email: string; ttl_minutes: number } | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setStatus("");
    try {
      setSent(await account.email(email));
    } catch (e) {
      setStatus(failure(e, "The sign-in email could not be sent. Try again in a few minutes"));
    }
    setBusy(false);
  }

  async function verify() {
    setBusy(true);
    setStatus("");
    try {
      await account.verify({ email: sent?.email ?? email, code });
      location.assign(next());
    } catch (e) {
      setStatus(failure(e, "That code is not valid. Request a new email"));
      setBusy(false);
    }
  }

  return (
    <section className="card sign-in">
      <h1>Sign in</h1>
      <p className="muted small">No password. The first sign-in makes your free account.</p>
      {!sent ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Sending the sign-in email" : "Email me a sign-in link"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <p role="status">
            Check {sent.email}. The link and the code in it work for {sent.ttl_minutes} minutes.
          </p>
          <label htmlFor="code">Six-digit code</label>
          <input
            id="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" className="primary" disabled={busy || code.length !== 6}>
            Sign in
          </button>
        </form>
      )}
      {status && (
        <p className="small load-error" role="alert">
          {status}
        </p>
      )}
    </section>
  );
}

function Confirm() {
  const token = new URLSearchParams(location.hash.slice(1)).get("token") ?? "";
  const [status, setStatus] = useState("");
  return (
    <section className="card sign-in">
      <h1>Sign in</h1>
      {token ? (
        <button
          type="button"
          className="primary"
          onClick={async () => {
            try {
              await account.verify({ token });
              location.assign("/record");
            } catch (e) {
              setStatus(
                failure(e, "This sign-in link has expired or was already used. Request a new one"),
              );
            }
          }}
        >
          Sign in
        </button>
      ) : (
        <p>
          This sign-in link has expired or was already used.{" "}
          <a href="/sign-in">Request a new one.</a>
        </p>
      )}
      {status && (
        <p className="small load-error" role="alert">
          {status} <a href="/sign-in">Request a new one.</a>
        </p>
      )}
    </section>
  );
}
