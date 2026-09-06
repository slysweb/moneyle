import { Link } from "react-router-dom";
import InfoPage from "../components/InfoPage";
import SocialLinks from "../components/SocialLinks";
import { SOCIAL_LINKS, SUPPORT_EMAIL } from "../lib/contact";
import { useFeedback } from "../lib/feedback";

export default function About() {
  const { open } = useFeedback();

  return (
    <InfoPage
      title="About us"
      description="MoneyGames is a small collection of free browser games about money, wealth, and currencies."
      updated="September 6, 2026"
    >
      <p>
        MoneyGames is a free site of short browser games about money. No paywalls — just a
        daily puzzle for everyone, one run a day, resetting at midnight Denver time. You can play as a
        guest, or <Link to="/register">register with Google</Link> to unlock the{" "}
        <Link to="/archive">archive</Link> of past daily puzzles and sync progress across
        devices.
      </p>

      <h2>The games</h2>
      <ul>
        <li>
          <Link to="/moreless">More/Less</Link> — five levels of comparisons: billionaires,
          market caps, salaries, box office, and GDP. Pick the higher number each round.
        </li>
        <li>
          <Link to="/guessr">Money Guessr</Link> — a pile of bills and coins flashes for five
          seconds. Guess the total. Five rounds, scored by how close you are.
        </li>
        <li>
          <Link to="/moneyle">Moneyle</Link> — a frosted banknote and six guesses. Use
          mid-market exchange rates to home in on the hidden currency.
        </li>
        <li>
          <Link to="/connections">MoneyConnections</Link> — a 4×4 grid of flags, bills
          or coins, GDP, and currency names. Group the four tiles that belong to the
          same country.
        </li>
      </ul>

      <h2>Articles</h2>
      <p>
        Longer rankings and notes live under <Link to="/articles">Articles</Link>, including a
        live Forbes top 100 that uses the same billionaire list as More/Less.
      </p>

      <h2>Data</h2>
      <p>
        Figures come from public sources and are meant for play, not as live market data or
        financial advice. They can lag the real world.
      </p>
      <ul>
        <li>Billionaires — Forbes Real-Time Billionaires</li>
        <li>Country GDP — World Bank</li>
        <li>Athlete salaries — Forbes, Spotrac, and Capology estimates</li>
        <li>Box office — Box Office Mojo all-time worldwide grosses</li>
        <li>Company market cap — CompaniesMarketCap</li>
        <li>
          Exchange rates —{" "}
          <a href="https://www.exchangerate-api.com" rel="noreferrer">
            ExchangeRate-API
          </a>{" "}
          (daily mid-market snapshot, around 00:00 UTC)
        </li>
      </ul>

      <h2>How it&apos;s built</h2>
      <p>
        The site is a React app on Cloudflare Workers and D1, at{" "}
        <a href="https://moneygames.cc">moneygames.cc</a>. Source is on{" "}
        <a href="https://github.com/slysweb/moneygames" rel="noreferrer">
          GitHub
        </a>
        .
      </p>

      <h2>Contact</h2>
      <p>
        Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or{" "}
        <button type="button" className="text-link" onClick={open}>
          send us feedback
        </button>
        . Daily boards and clips also go out on{" "}
        {SOCIAL_LINKS.map((link, i) => (
          <span key={link.href}>
            {i > 0 ? (i === SOCIAL_LINKS.length - 1 ? ", and " : ", ") : null}
            <a href={link.href} rel="noreferrer">
              {link.name}
            </a>
          </span>
        ))}
        . See also the <Link to="/scoring">scoring rules</Link>,{" "}
        <Link to="/terms">Terms of Service</Link>, and{" "}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
      <SocialLinks />
    </InfoPage>
  );
}
