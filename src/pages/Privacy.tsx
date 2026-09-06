import { Link } from "react-router-dom";
import InfoPage from "../components/InfoPage";
import { SUPPORT_EMAIL } from "../lib/contact";

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy Policy"
      description="How MoneyGames handles information — optional Google accounts, no ads, no sale of personal data."
      updated="September 6, 2026"
    >
      <p>
        MoneyGames (“we”) runs free games at moneygames.cc. This policy explains what
        information is involved when you play. We do not sell personal data and we do not
        run advertising.
      </p>

      <h2>Accounts</h2>
      <p>
        You can play today’s games without signing in. Scores and guesses then live in your
        browser; we do not store a personal play history for guests. The archive of past
        daily puzzles is for registered members.
      </p>
      <p>
        If you register, we use Google account sign-in only. Google sends us your Google
        user id, name, email address, and profile photo. We store those in Cloudflare D1 so
        we can keep you signed in. We also store that account’s daily puzzle progress
        (which game, which date, and the run state) so the same account matches on phone
        and desktop. We do not get your Google password. Signing in creates an account on
        first use; later visits reuse it.
      </p>
      <p>
        After you sign in we set a first-party session cookie (<code>mg_session</code>) so
        the site knows it is you. It is HttpOnly, not used for advertising, and lasts up to
        30 days or until you sign out. A short-lived cookie is also used during the Google
        sign-in handshake.
      </p>

      <h2>What the servers see</h2>
      <p>
        The site is hosted on Cloudflare Workers. Like most websites, each request can
        include technical data such as IP address, browser and device details, the page or
        API path, and approximate time. Cloudflare may keep operational logs and performance
        traces so we can run, debug, and protect the service. Daily puzzles and public game
        content are stored in Cloudflare D1. Those records are shared game data, not your
        identity.
      </p>
      <p>
        Cloudflare’s own processing is described in the{" "}
        <a href="https://www.cloudflare.com/privacypolicy/" rel="noreferrer">
          Cloudflare Privacy Policy
        </a>
        .
      </p>

      <h2>Cookies and similar tech</h2>
      <p>
        We set first-party cookies for optional sign-in (session and a brief OAuth state
        cookie). We also load Google Analytics (gtag.js) on the public site so we can see
        which pages and games people use. Google may set its own cookies (such as{" "}
        <code>_ga</code>). We do not use this for advertising, and we do not sell the data.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>
          <strong>Cloudflare</strong> — hosting, DNS, and the Worker/D1 backend.
        </li>
        <li>
          <strong>Google</strong> — optional account sign-in, and Google Analytics for page
          views and basic usage. See{" "}
          <a href="https://policies.google.com/privacy" rel="noreferrer">
            Google’s Privacy Policy
          </a>
          .
        </li>
        <li>
          <strong>ExchangeRate-API</strong> — daily mid-market FX used by Moneyle. When you
          guess a currency, our server fetches a rate from that provider. See{" "}
          <a href="https://www.exchangerate-api.com" rel="noreferrer">
            exchangerate-api.com
          </a>
          .
        </li>
      </ul>
      <p>
        Images and figures on the games come from public datasets (Forbes, World Bank, Box
        Office Mojo, CompaniesMarketCap, and similar). Loading this site does not send your
        identity to those publishers.
      </p>

      <h2>Feedback you send us</h2>
      <p>
        If you use the in-site feedback form, we store the category, your message, the page
        you were on, your browser’s user agent, your IP address, and the time — so we can
        read the note, spot spam, and follow up on bugs. Email to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> is handled by whatever
        mailbox we use for that address.
      </p>
      <h2>How we use technical data</h2>
      <p>
        Only to operate the games: serve pages and APIs, generate daily puzzles, keep the
        service reliable, keep optional accounts signed in, respond to abuse or outages, and
        understand which pages and games people use. We do not use it to build a marketing
        profile.
      </p>

      <h2>Retention</h2>
      <p>
        Puzzle content stays as long as the games need it. Account records and signed-in
        puzzle progress stay until you delete the account, or until we shut the feature
        down. Feedback notes stay until we have handled them. Infrastructure logs follow
        Cloudflare’s defaults unless we have a security or legal reason to keep a record
        longer. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you want a
        feedback submission removed.
      </p>

      <h2>Delete your account</h2>
      <p>
        You can delete your MoneyGames account at any time from{" "}
        <Link to="/me">Me</Link> or the{" "}
        <Link to="/delete-account">Delete your account</Link> page, or in the Android app
        under Me. That removes the Google sign-in record we stored and any synced daily
        progress. It does not delete your Google account, and it does not wipe guest games
        saved only on this device. If you cannot sign in, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Children</h2>
      <p>
        The games are a general audience and are not directed at children under 13. We do
        not knowingly collect personal information from children. If you believe a child has
        sent us personal information, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we will delete it if we
        have it.
      </p>

      <h2>International processing</h2>
      <p>
        Cloudflare’s network is global, so requests may be handled in more than one country.
        If that is not acceptable, do not use the site.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. The “Last updated” date at the top will change. Continued
        use after a change means you accept the new policy.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        . See also the <Link to="/terms">Terms of Service</Link>,{" "}
        <Link to="/delete-account">Delete your account</Link>, and{" "}
        <Link to="/about">About us</Link>.
      </p>
    </InfoPage>
  );
}
