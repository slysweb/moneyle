import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <h1 className="brand-hero">MoneyGames</h1>
        <p className="hero-tagline">Games about money.</p>
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
            Five levels of money comparisons — billionaires, market caps,
            salaries, box office and GDP. Tap the higher one each round.
          </p>
          <span className="game-card-cta">Play More/Less →</span>
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
