import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import { ARTICLES, ARTICLES_INDEX, articlePath, formatArticleDate } from "../lib/articles";
import { usePageMeta } from "../lib/usePageMeta";

export default function Articles() {
  usePageMeta(`${ARTICLES_INDEX.title} — Moneyle`, ARTICLES_INDEX.description);

  return (
    <main className="page article-index">
      <p className="info-kicker">
        <Link to="/">← Home</Link>
      </p>
      <h1>Articles</h1>
      <p className="article-lead">
        Rankings and notes behind the daily games. The Forbes list on this site refreshes from
        the real-time billionaire feed; the other tables use the same data More/Less plays with.
      </p>
      <ul className="article-list">
        {ARTICLES.map((article) => (
          <li key={article.slug}>
            <Link to={articlePath(article.slug)} className="article-card">
              <div className="article-card-meta">
                <time dateTime={article.published}>{formatArticleDate(article.published)}</time>
                {article.live ? <span className="article-live">Live</span> : null}
                <span>{article.gameLabel}</span>
              </div>
              <h2>{article.title}</h2>
              <p>{article.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
      <SiteFooter />
    </main>
  );
}
