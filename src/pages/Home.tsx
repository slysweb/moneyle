import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import { usePageMeta } from "../lib/usePageMeta";

export default function Home() {
  usePageMeta(
    "MoneyGames — Games about money",
    "Free browser games about money. Play More/Less, Money Guessr, Moneyle, and MoneyConnections — test your intuition for wealth, cash, and currencies."
  );

  return (
    <main className="page">
      <section className="hero">
        <h1 className="brand-hero">MoneyGames</h1>
        <p className="hero-tagline">Games about money.</p>
        <p className="hero-sub">
          Quick, free browser games that test your intuition for the numbers
          behind wealth, economies and markets. New puzzles every day at
          midnight Denver time — the same ones for everyone.
        </p>
      </section>

      <section className="game-grid">
        <Link to="/moreless" className="game-card playable">
          <div className="game-card-badge">Play now</div>
          <h2>More/Less</h2>
          <p>
            Five levels of money comparisons — billionaires, market caps,
            salaries, box office and GDP. Tap the higher one each round.
          </p>
          <span className="game-card-cta">Play More/Less →</span>
        </Link>

        <Link to="/guessr" className="game-card playable">
          <div className="game-card-badge">Play now</div>
          <h2>Money Guessr</h2>
          <p>
            A pile of bills and coins flashes for five seconds. How much was
            it? Five rounds, scored by how close your guess is.
          </p>
          <span className="game-card-cta">Play Money Guessr →</span>
        </Link>

        <Link to="/moneyle" className="game-card playable">
          <div className="game-card-badge">Play now</div>
          <h2>Moneyle</h2>
          <p>
            A frosted banknote and six guesses. Use exchange-rate clues and
            the note’s blurred outline to deduce the hidden currency.
          </p>
          <span className="game-card-cta">Play Moneyle →</span>
        </Link>

        <Link to="/connections" className="game-card playable">
          <div className="game-card-badge">Play now</div>
          <h2>MoneyConnections</h2>
          <p>
            A 4×4 grid of flags, cash, GDP figures, and currency names. Find
            the four tiles that belong to the same country.
          </p>
          <span className="game-card-cta">Play MoneyConnections →</span>
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
