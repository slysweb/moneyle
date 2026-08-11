import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <h1>
          Games about <span className="accent">money</span>.
        </h1>
        <p className="hero-sub">
          Quick, free browser games that test your intuition for the numbers
          behind wealth, economies and markets.
        </p>
      </section>

      <section className="game-grid">
        <Link to="/moreless" className="game-card playable">
          <div className="game-card-badge">Play now</div>
          <h2>More/Less</h2>
          <p>
            Two cards, one question: is it worth more or less? Guess right to
            keep your streak alive. Billionaires, GDP and more.
          </p>
          <span className="game-card-cta">Play More/Less</span>
        </Link>

        <div className="game-card soon">
          <div className="game-card-badge">Coming soon</div>
          <h2>More games</h2>
          <p>
            New money games are in the works. Follow along as MoneyGames grows.
          </p>
        </div>
      </section>

      <footer className="site-footer">
        <p>moneygames.cc — data from public sources, refreshed regularly.</p>
      </footer>
    </main>
  );
}
