import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import SiteFooter from "../components/SiteFooter";
import { ARTICLES, articlePath } from "../lib/articles";
import { HOME_META } from "../lib/pageMeta";
import { usePageMeta } from "../lib/usePageMeta";

const games = [
  {
    to: "/moreless",
    icon: "moreless",
    title: "More/Less",
    blurb:
      "More/Less - A daily more or less money guessing game. Five levels of money comparisons — billionaires, market caps, salaries, box office and GDP. Tap the higher one each round.",
    cta: "Play More/Less →",
  },
  {
    to: "/guessr",
    icon: "guessr",
    title: "Money Guessr",
    blurb:
      "Money Guessr - A daily money amount guessing game. A pile of bills and coins flashes for five seconds. How much was it? Five rounds, scored by how close your guess is.",
    cta: "Play Money Guessr →",
  },
  {
    to: "/moneyle",
    icon: "moneyle",
    title: "Moneyle",
    blurb:
      "Moneyle - A daily currency guessing game. A frosted banknote and six guesses. Use exchange-rate clues and the note’s blurred outline to deduce the hidden currency.",
    cta: "Play Moneyle →",
  },
  {
    to: "/connections",
    icon: "connections",
    title: "MoneyConnections",
    blurb:
      "MoneyConnections - A daily money connections game. A 4×4 grid of flags, cash, GDP figures, and currency names. Find the four tiles that belong to the same country.",
    cta: "Play MoneyConnections →",
  },
] as const;

export default function Home() {
  usePageMeta(HOME_META.title, HOME_META.description);

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
        <p className="hero-archive">
          Missed a day? <Link to="/archive">Unlock the archive</Link> with a free
          Google account.
        </p>
      </section>

      <section className="game-grid">
        {games.map((game) => (
          <Link key={game.to} to={game.to} className="game-card playable">
            <div className="game-card-head">
              <span className={`game-card-icon ${game.icon}`} aria-hidden="true">
                <Icon name={game.icon} size={26} />
              </span>
              <div className="game-card-badge">Play now</div>
            </div>
            <h2>{game.title}</h2>
            <p>{game.blurb}</p>
            <span className="game-card-cta">{game.cta}</span>
          </Link>
        ))}
      </section>

      <section className="article-teaser">
        <div className="article-teaser-head">
          <h2>Articles</h2>
          <Link to="/articles">All articles →</Link>
        </div>
        <ul>
          {ARTICLES.slice(0, 3).map((article) => (
            <li key={article.slug}>
              <Link to={articlePath(article.slug)}>
                {article.live ? <span className="article-live">Live</span> : null}
                {article.title}
              </Link>
              <p>{article.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </main>
  );
}
