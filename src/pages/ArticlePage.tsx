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
  type ArticleBlock,
} from "../lib/articles";
import { usePageMeta } from "../lib/usePageMeta";

function blockKey(block: ArticleBlock | undefined): string | undefined {
  return typeof block === "string" ? block : block?.src;
}

export default function ArticlePage() {
  const { slug } = useParams();
  const article = articleBySlug(slug);
  if (!article) return <Navigate to="/articles" replace />;
  return <ArticleBody article={article} />;
}

function ArticleBody({ article }: { article: Article }) {
  usePageMeta(`${article.title} — Moneyle`, article.description);

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
        <RankingBlock key={article.rankingSlug} article={article} slug={article.rankingSlug} />
      ) : null}
      {article.sections?.map((section) => (
        <section key={section.heading ?? blockKey(section.paragraphs[0])}>
          {section.heading ? <h2>{section.heading}</h2> : null}
          {section.paragraphs.map((block) =>
            typeof block === "string" ? (
              <p key={block}>{block}</p>
            ) : (
              <figure key={block.src} className="article-figure">
                <img
                  src={block.src}
                  alt={block.alt}
                  width={block.width}
                  height={block.height}
                  loading="lazy"
                  decoding="async"
                />
                {block.caption ? <figcaption>{block.caption}</figcaption> : null}
              </figure>
            ),
          )}
        </section>
      ))}
      {article.related?.length ? (
        <p>
          {article.related.map((link, i) => (
            <span key={link.href}>
              {i > 0 ? " · " : null}
              <Link to={link.href}>{link.label}</Link>
            </span>
          ))}
        </p>
      ) : null}
      {article.note ? <p className="article-note">{article.note}</p> : null}
      <p className="article-play">
        <Link to={article.gameTo}>Play {article.gameLabel} →</Link>
      </p>
      <MoreArticles current={article.slug} />
      <SiteFooter />
    </main>
  );
}

function bootRanking(slug: string): RankingResponse | null {
  const boot = typeof window !== "undefined" ? window.__RANKING__ : undefined;
  return boot?.slug === slug ? boot : null;
}

function RankingBlock({ article, slug }: { article: Article; slug: string }) {
  const [data, setData] = useState<RankingResponse | null>(() => bootRanking(slug));
  const [error, setError] = useState(false);

  useEffect(() => {
    const boot = bootRanking(slug);
    if (boot && !boot.live) return;
    let cancelled = false;
    fetchRanking(slug)
      .then((res) => {
        if (!cancelled) {
          setError(false);
          setData(res);
        }
      })
      .catch(() => {
        if (!cancelled && !boot) setError(true);
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
        {data.live ? "Forbes real-time list" : "From the Moneyle database"} · {data.items.length}{" "}
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
