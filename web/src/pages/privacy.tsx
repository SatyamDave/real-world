// The copy of product/privacy.md, word for word. Change both together.
export const title = "Privacy";

export default function Privacy() {
  return (
    <article className="card policy" aria-labelledby="privacy">
      <h1 id="privacy">Privacy</h1>
      <p>
        This notice covers the Real World web app and API. Browsing, answering today's question and
        opening a fork need no account. The web app has no analytics and no tracking pixels, and
        Real World sends no newsletter. This notice is a draft that needs legal review.
      </p>

      <h2>What we collect</h2>
      <ol className="rules">
        <li>
          <strong>Email address.</strong> Collected when you ask for a sign-in link. It is used only
          to sign you in.
        </li>
        <li>
          <strong>Sign-in links and codes.</strong> Stored only as hashes. A link or code works once
          and for 15 minutes.
        </li>
        <li>
          <strong>Session cookie.</strong> After you sign in, the cookie <code>rw_session</code>{" "}
          keeps you signed in on that browser for 30 days. It is strictly necessary, set{" "}
          <code>HttpOnly</code>, and removed when you sign out. Only a hash of it is stored.
        </li>
        <li>
          <strong>Profile.</strong> The answers you give in onboarding: what you use Real World for,
          your countries and your topics. You can change them in settings.
        </li>
        <li>
          <strong>Saved forks.</strong> The forks you started or saved.
        </li>
        <li>
          <strong>Daily-question answers.</strong> Without an account, an answer is tied to a random
          player id kept in your browser's local storage. When you sign in, that id is linked to
          your account.
        </li>
        <li>
          <strong>API keys.</strong> Stored only as hashes, with what each key has spent.
        </li>
        <li>
          <strong>IP address.</strong> Used for rate limits and stored only as a hash.
        </li>
        <li>
          <strong>What you type into a fork.</strong> The event text you type is public, because
          every fork link can be opened by anyone who has it.
        </li>
      </ol>

      <h2>Who processes it</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Processor</th>
              <th>For</th>
              <th>What it receives</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Processor">Resend</td>
              <td data-label="For">The sign-in email</td>
              <td data-label="What it receives">
                Your email address and the sign-in link and code
              </td>
            </tr>
            <tr>
              <td data-label="Processor">Fly.io</td>
              <td data-label="For">Hosting (provisional)</td>
              <td data-label="What it receives">Everything above</td>
            </tr>
            <tr>
              <td data-label="Processor">Cloudflare R2</td>
              <td data-label="For">Backups</td>
              <td data-label="What it receives">Everything above</td>
            </tr>
            <tr>
              <td data-label="Processor">TypeSafe, OpenRouter and a host of Mistral Small 3.2</td>
              <td data-label="For">Model calls for forks and the daily cycle</td>
              <td data-label="What it receives">
                The text of a fork event and public news text. No email address, account id, player
                id or IP address
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Do not put personal data in a fork event: the event text goes to the model providers and is
        public.
      </p>

      <h2>What deleting your account does</h2>
      <p>
        "Delete account" in settings removes your email, profile, sessions, sign-in links and codes,
        and saved-fork list, and revokes every API key. It keeps what holds no personal data: fork
        jobs, so shared links keep working; daily answers, unlinked from you; and key spend rows,
        which the day's budget needs.
      </p>
      <p>
        Published forecasts and receipts are public and are never removed, because they hold no
        personal data.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Sign out on this browser or everywhere from settings.</li>
        <li>Change your profile in settings.</li>
        <li>Delete your account from settings.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Provisional: no contact address is published yet. One will be added here before accounts
        open.
      </p>

      <h2>Changes</h2>
      <p>A change to this notice is published on this page with its date.</p>
    </article>
  );
}
