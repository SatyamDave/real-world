import { BRAND } from "../brand";
import { CONSENT_VERSION } from "../copy/consent";
import { DraftBanner } from "./DraftBanner";

// Written from what the code does (landing/functions, landing/analytics/TRACKING_PLAN.md).
// Update this page in the same change as any new collection or processor.
export function Privacy() {
  return (
    <article className="legal">
      <DraftBanner />
      <h1>Privacy</h1>
      <p className="legal-meta">
        Version {CONSENT_VERSION}. This page is for people in the United States.
      </p>
      <p>
        {BRAND.name} is a daily, public, scored forecast of the world. This page is the waitlist for
        it. Here is what we collect when you visit and when you join, who handles it, and what you
        can ask us to do.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your email address</strong>, when you join the waitlist, and the version of the
          consent line you saw ({CONSENT_VERSION}).
        </li>
        <li>
          <strong>Where you came from:</strong> the ad or link you clicked (the utm values in the
          address), the page that referred you, and the headline you were shown.
        </li>
        <li>
          <strong>Your country</strong>, taken from the request. We do not store your IP address,
          and we set Amplitude not to collect it. To limit abuse we keep a salted hash of it for a
          few minutes at a time and delete those rows after a day. Cloudflare, which serves the
          page, and Typeform, which runs the form, see your IP address in the course of their
          service.
        </li>
        <li>
          <strong>Your answers</strong> to the forecast question and the role question in the form
          that follows signup.
        </li>
        <li>
          <strong>How you use this page,</strong> through Amplitude: page views, clicks, scroll
          sections and form steps, tied to a random device id. For a sample of visits Amplitude also
          records a replay of the session. Text you type, including your email, is masked in the
          replay.
        </li>
        <li>
          <strong>Ad measurement,</strong> only when we are running ads: the Reddit and X pixels
          tell those networks that a visit or a signup happened. We send the random id of the signup
          and never your email address.
        </li>
      </ul>

      <h2>Who handles it</h2>
      <ul>
        <li>Cloudflare serves the page, checks for bots and runs the signup code.</li>
        <li>Neon stores the waitlist.</li>
        <li>Amplitude records usage and session replays.</li>
        <li>Typeform runs the form with the forecast and role questions.</li>
        <li>Reddit and X receive pixel events when their pixels are on.</li>
      </ul>
      <p>We do not sell your data.</p>

      <h2>Why</h2>
      <p>
        To email you about the launch and your forecast, to learn which message makes people sign
        up, and to keep the page secure.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          If your browser sends Global Privacy Control or Do Not Track, we load no analytics and no
          ad pixels.
        </li>
        <li>Every email we send has an unsubscribe link.</li>
        <li>
          You can ask us to show you or delete your data. Use the contact link in the footer; it
          appears once our address is live.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We have not set a fixed period yet. Until we do, we keep waitlist data until you ask us to
        delete it, and we will update this page when we set one.
      </p>

      <h2>Changes</h2>
      <p>We will change the version above when this page changes.</p>
    </article>
  );
}
