import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import { fetchRanking, type RankingResponse } from "../lib/api";
import {
  articleBySlug,
  ARTICLES,
  articlePath,
  formatArticleDate,
  type Article,
} from "../lib/articles";
import { usePageMeta } from "../lib/usePageMeta";

export default function ArticlePage() {
  const { slug } = useParams();
  const article = articleBySlug(slug);
  if (!article) return <Navigate to="/articles" replace />;
  return <ArticleBody article={article} />;
}

function ArticleBody({ article }: { article: Article }) {
  usePageMeta(`${article.title} — MoneyGames`, article.description);

  return (
    <main className={`page article-page${article.kind === "ranking" ? " ranking" : ""}`}>
      <p className="info-kicker">
        <Link to="/articles">← Articles</Link>
      </p>
      <p className="article-meta">
        <time dateTime={article.published}>{formatArticleDate(article.published)}</time>
        {article.live ? <span className="article-live">Live</span> : null}
        <span>
          Played in <Link to={article.gameTo}>{article.gameLabel}</Link>
        </span>
      </p>
      <h1>{article.title}</h1>
      {article.intros.map((para) => (
        <p key={para}>{para}</p>
      ))}
      {article.kind === "ranking" && article.rankingSlug ? (
        <RankingBlock article={article} slug={article.rankingSlug} />
      ) : null}
      {article.slug === "world-currencies" ? <WorldCurrenciesBody /> : null}
      {article.slug === "four-tiles-one-country" ? <ConnectionsBody /> : null}
      {article.note ? <p className="article-note">{article.note}</p> : null}
      <p className="article-play">
        <Link to={article.gameTo}>Play {article.gameLabel} →</Link>
      </p>
      <MoreArticles current={article.slug} />
      <SiteFooter />
    </main>
  );
}

function RankingBlock({ article, slug }: { article: Article; slug: string }) {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRanking(slug)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return <p className="status-msg">Couldn’t load this list. Try again in a minute.</p>;
  }
  if (!data) {
    return <p className="status-msg">Loading the current list…</p>;
  }

  const fetched = new Date(data.fetchedAt);
  const fetchedLabel = fetched.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <>
      <p className="article-fetched">
        {data.live ? "Forbes real-time list" : "From the MoneyGames database"} · {data.items.length}{" "}
        {data.items.length === 1 ? "entry" : "entries"} · {fetchedLabel}
        {data.sourceUrl && data.sourceName ? (
          <>
            {" "}
            ·{" "}
            <a href={data.sourceUrl} rel="noreferrer">
              {data.sourceName}
            </a>
          </>
        ) : null}
      </p>
      <div className="rank-table-wrap">
        <table className="rank-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">{article.metricLabel ?? data.metricLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={`${item.rank}-${item.name}`}>
                <td className="rank-num">{item.rank}</td>
                <td>
                  <span className="rank-person">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" width={40} height={40} />
                    ) : (
                      <span className="rank-person-fallback" aria-hidden="true">
                        {item.name.slice(0, 1)}
                      </span>
                    )}
                    <span>
                      <strong>{item.name}</strong>
                      {item.subtitle ? <small>{item.subtitle}</small> : null}
                    </span>
                  </span>
                </td>
                <td className="rank-value">{item.displayValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WorldCurrenciesBody() {
  return (
    <>
      <h2>Money Guessr</h2>
      <p>
        A pile is built from one currency’s photographed bills and coins — dollars, yen, pounds,
        pesos, and others we have on file. You get five seconds. Then you type a total. Scoring
        cares how close you are, not whether you named every denomination.
      </p>
      <p>
        The hard part is usually mixed coins and similar-looking notes. A $1 and a $10 can share a
        palette until you remember the portrait; yen and won drop the cents and jump in size.
      </p>
      <h2>Moneyle</h2>
      <p>
        One banknote, frosted. Six guesses. Each miss tells you whether that currency is stronger
        or weaker than the hidden one, using a mid-market rate snapshot from around 00:00 UTC. A
        bonus round after the reveal asks about the country: flag, GDP, population, GDP per person.
      </p>
      <p>
        Euro days pick one eurozone country for the bonus, the same for everyone. The note itself
        is still a euro.
      </p>
      <p>
        Play <Link to="/guessr">Money Guessr</Link> or <Link to="/moneyle">Moneyle</Link> — both
        reset at midnight Denver time.
      </p>
    </>
  );
}

function ConnectionsBody() {
  return (
    <>
      <h2>What you’re grouping</h2>
      <p>
        The board is 16 tiles: four countries × four clues. A flag is obvious once you know it. A
        GDP figure is a number in the same compact style as More/Less. A currency name is a word.
        Cash is a crop of a real bill or coin from that country.
      </p>
      <p>
        Four mistakes end the run. There is no custom puzzle and no infinite mode — one grid per
        Denver day, the same for everyone.
      </p>
      <p>
        If you want the raw GDP table those tiles draw from, see{" "}
        <Link to="/articles/largest-economies">the world’s largest economies</Link>. Then play{" "}
        <Link to="/connections">MoneyConnections</Link>.
      </p>
    </>
  );
}

function MoreArticles({ current }: { current: string }) {
  const rest = ARTICLES.filter((a) => a.slug !== current).slice(0, 4);
  return (
    <section className="more-articles">
      <h2>More articles</h2>
      <ul>
        {rest.map((article) => (
          <li key={article.slug}>
            <Link to={articlePath(article.slug)}>{article.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
