import { DISCLOSURE } from "../App";

// The copy of product/terms.md, word for word. Change both together.
export const title = "Terms";

export default function Terms() {
  return (
    <article className="card policy" aria-labelledby="terms">
      <h1 id="terms">Terms</h1>
      <p>These terms are a draft that needs legal review. By using Real World you agree to them.</p>

      <h2>What Real World is</h2>
      <p>
        Real World simulates groups of synthetic people and publishes scored forecasts. Every output
        is labelled "{DISCLOSURE}". Outputs are not advice of any kind: not financial, legal,
        medical or political. Do not remove the label when you quote, share or republish a result.
      </p>

      <h2>Accounts</h2>
      <p>
        An account is free and made with an email address. You are responsible for what happens
        under your account. You can delete it at any time from settings.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Every fork follows the acceptable use rules at <a href="/acceptable-use">/acceptable-use</a>
        . A fork that breaks them is refused.
      </p>

      <h2>API keys</h2>
      <p>
        Each API key has a daily dollar cap, and a call that would pass the cap is refused. Keep
        your key private. You are responsible for calls made with it. We may revoke a key that is
        used against these terms.
      </p>

      <h2>Public record</h2>
      <p>
        Published forecasts and receipts are public and permanent, and are never changed or removed.
        Every fork link can be opened by anyone who has it.
      </p>

      <h2>Ownership</h2>
      <p>
        The Real World code is open source under the Apache License 2.0. Third-party data keeps its
        own licence. You may quote results with their label.
      </p>

      <h2>No warranty</h2>
      <p>
        Real World is provided as it is, without warranty of any kind. A forecast can be wrong, and
        the receipts page shows how often it was. We may change, limit or stop the service.
      </p>

      <h2>Changes</h2>
      <p>A change to these terms is published on this page with its date.</p>

      <h2>Contact</h2>
      <p>
        Provisional: no contact address is published yet. One will be added here before accounts
        open.
      </p>
    </article>
  );
}
