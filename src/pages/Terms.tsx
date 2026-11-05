import { Link } from "react-router-dom";
import InfoPage from "../components/InfoPage";
import { SUPPORT_EMAIL } from "../lib/contact";

export default function Terms() {
  return (
    <InfoPage
      title="Terms of Service"
      description="Terms of Service for moneyle.app — free browser games about money."
      updated="November 4, 2026"
    >
      <p>
        These terms govern your use of MoneyGames at moneyle.app and the MoneyGames
        Android app (together, the “service”). By using the service, you agree to them. If
        you do not agree, do not use it.
      </p>

      <h2>The service</h2>
      <p>
        MoneyGames offers free, recreational browser games about money, wealth, and
        currencies. Today’s puzzles are free without an account. Register with Google to
        unlock the archive of past daily puzzles and sync your progress across devices. We
        may add, change, or remove games or features at any time.
      </p>

      <h2>Not financial advice</h2>
      <p>
        The site is for entertainment. Net worths, market caps, salaries, box-office figures,
        GDP numbers, and exchange rates are approximate, may be delayed, and can be wrong.
        They are not offers, valuations, or advice. Banknotele rates are a daily mid-market
        snapshot (around 00:00 UTC) and can differ from live quotes. Do not rely on anything
        here to make financial decisions.
      </p>

      <h2>Accounts</h2>
      <p>
        Registration is optional and currently only via Google. You are responsible for the
        Google account you use. We may suspend an account that is used to abuse the service.
        You can delete your MoneyGames account at any time from{" "}
        <Link to="/delete-account">Delete your account</Link>. That removes the record we
        stored and synced progress; it does not delete your Google account.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the site in a way that breaks the law or harms other people;</li>
        <li>attack, overload, or disrupt the site, its APIs, or related infrastructure;</li>
        <li>scrape or copy the service at a scale that interferes with other players;</li>
        <li>misrepresent the site as a source of live market or banking data.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The MoneyGames name, layout, and original game design are provided by the site
        operator. You may play the games and share your results. You may not copy the site
        as a competing product, or reuse our original assets, without permission.
      </p>
      <p>
        Names, portraits, logos, posters, flags, and banknote images identify the subjects of
        a trivia comparison. Those marks and images belong to their owners. Their appearance
        here does not imply endorsement.
      </p>

      <h2>Third-party data</h2>
      <p>
        Game content draws on public sources (including Forbes, the World Bank, Box Office
        Mojo, CompaniesMarketCap, and ExchangeRate-API). Those providers have their own
        terms. We do not control their data and are not responsible for it.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The site is provided “as is” and “as available,” without warranties of any kind,
        including fitness for a particular purpose, accuracy, or uninterrupted access. To
        the fullest extent allowed by law, the operator is not liable for any indirect,
        incidental, or consequential damages, or for losses arising from your use of the
        site or reliance on its numbers. If liability cannot be excluded, it is limited to
        the amount you paid us to use the site in the past twelve months (currently zero).
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The “Last updated” date at the top will change. Continued
        use after a change means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        . See also the <Link to="/privacy">Privacy Policy</Link> and{" "}
        <Link to="/about">About us</Link>.
      </p>
    </InfoPage>
  );
}
