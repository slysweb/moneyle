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
      "Five levels of money comparisons — billionaires, market caps, salaries, box office and GDP. Tap the higher one each round.",
    cta: "Play More/Less →",
  },
  {
    to: "/guessr",
    icon: "guessr",
    title: "Worth Guessr",
    blurb:
      "A pile of bills and coins flashes for five seconds. How much was it? Five rounds, scored by how close your guess is.",
    cta: "Play Worth Guessr →",
  },
  {
    to: "/banknotele",
    icon: "moneyle",
    title: "Banknotele",
    blurb:
      "A frosted banknote and six guesses. Use exchange-rate clues and the note’s blurred outline to deduce the hidden currency.",
    cta: "Play Banknotele →",
  },
  {
    to: "/connections",
    icon: "connections",
    title: "Connections",
    blurb:
      "A 4×4 grid of flags, cash, GDP figures, and currency names. Find the four tiles that belong to the same country.",
    cta: "Play Connections →",
  },
] as const;

export default function Home() {
  usePageMeta(HOME_META.title, HOME_META.description, HOME_META.image);

  return (
    <main className="page">
      <section className="hero">
        <h1 className="brand-hero">Moneyle</h1>
        <p className="hero-tagline">Daily puzzles for your financial & economic intuition.</p>
        <p className="hero-sub">
          New puzzles every day at midnight Denver time — the same for everyone.
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
