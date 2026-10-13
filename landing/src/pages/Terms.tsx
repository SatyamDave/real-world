import { BRAND } from "../brand";
import { DraftBanner } from "./DraftBanner";

export function Terms() {
  return (
    <article className="legal">
      <DraftBanner />
      <h1>Terms</h1>
      <p className="legal-meta">This page is for people in the United States.</p>
      <p>
        By using this page you agree to these terms. {BRAND.name} is an early project and the page
        will be replaced when the daily record goes live.
      </p>

      <h2>What this is</h2>
      <p>
        {BRAND.name} publishes forecasts from an AI simulation of a population. They are
        AI-simulated. They are not polls, and they are not predictions about any real person.
      </p>

      <h2>What this is not</h2>
      <ul>
        <li>It is not financial, investment, legal or medical advice.</li>
        <li>
          It is not a way to bet or trade. We compare forecasts with market prices only to score
          them.
        </li>
        <li>Joining the waitlist does not promise access, a date or a result.</li>
      </ul>

      <h2>Using the page</h2>
      <ul>
        <li>Give your own email address and answer honestly.</li>
        <li>Do not probe, overload or scrape the page, or try to get around the bot check.</li>
        <li>Do not use anything shown here as the basis for a decision about a real person.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The page and everything on it are provided as they are, without warranties. To the extent
        the law allows, we are not liable for loss arising from using it.
      </p>

      <h2>Privacy and changes</h2>
      <p>
        What we collect is described on the <a href="/privacy">privacy page</a>. We may change these
        terms; the page you see is the current version.
      </p>
    </article>
  );
}
