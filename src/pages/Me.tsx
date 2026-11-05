import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import SiteFooter from "../components/SiteFooter";
import { googleStartPath, useAuth } from "../lib/auth";
import { formatJoinedOn } from "../lib/dates";
import { emptyPlayerStats, loadPlayerStats } from "../lib/progress";
import { formatAverage, formatWinRate, type GameStatCard } from "../lib/stats";
import { formatScore } from "../lib/score";
import { usePageMeta } from "../lib/usePageMeta";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="me-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function GameStatsCard({ card }: { card: GameStatCard }) {
  const winGame = card.wins != null;
  return (
    <section className="me-game">
      <div className="me-game-head">
        <span className={`game-card-icon ${card.id}`} aria-hidden="true">
          <Icon name={card.id} size={22} />
        </span>
        <h2>{card.name}</h2>
        <Link to={card.path}>Play</Link>
      </div>
      <div className="me-stat-grid">
        <Stat value={String(card.played)} label="Played" />
        <Stat value={card.played ? formatScore(card.highScore, card.maxScore) : "—"} label="High score" />
        <Stat value={formatAverage(card.average)} label="Average" />
        {winGame ? (
          <Stat value={formatWinRate(card.winRate)} label="Win rate" />
        ) : (
          <Stat value={String(card.perfects)} label="Perfect" />
        )}
        <Stat value={String(card.currentStreak)} label="Streak" />
        <Stat value={String(card.maxStreak)} label="Best streak" />
      </div>
      {winGame ? (
        <p className="me-game-extra">
          {card.id === "banknotele"
            ? `Wins ${card.wins ?? 0} · Avg guesses ${formatAverage(card.avgGuesses)} · Perfect ${card.perfects} · Note score`
            : `Wins ${card.wins ?? 0} · Perfect ${card.perfects}`}
        </p>
      ) : null}
    </section>
  );
}

export default function Me() {
  usePageMeta(
    "Me — MoneyGames",
    "Your MoneyGames profile and daily-run statistics — played days, high scores, streaks, and win rates."
  );

  const { user, loading, logout, deleteAccount } = useAuth();
  const [stats, setStats] = useState<GameStatCard[] | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setStats(null);
      return;
    }
    let cancelled = false;
    const load = () => {
      void loadPlayerStats()
        .then((next) => {
          if (!cancelled) setStats(next);
        })
        .catch(() => {
          if (!cancelled) setStats(emptyPlayerStats());
        });
    };
    load();
    const bump = () => load();
    window.addEventListener("focus", bump);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", bump);
    };
  }, [loading, user]);

  const first = user ? user.name.split(/\s+/)[0] || user.email : null;
  const joined = user ? formatJoinedOn(user.joinedAt) : null;

  return (
    <main className="page me-page">
      <p className="info-kicker">
        <Link to="/">← Home</Link>
      </p>
      <h1>Me</h1>
      {user ? (
        <p className="me-lead">
          Finished daily runs only. Missing a day resets the current streak at midnight Denver
          time.
        </p>
      ) : null}

      <section className="me-profile">
        {loading ? (
          <p className="me-copy">Checking your session…</p>
        ) : user ? (
          <>
            <div className="me-identity">
              {user.pictureUrl ? (
                <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="me-avatar-fallback">{first?.charAt(0).toUpperCase()}</span>
              )}
              <div>
                <p className="me-name">{user.name}</p>
                {joined ? <p className="me-email">{joined}</p> : null}
              </div>
            </div>
            <div className="me-profile-actions">
              <button type="button" className="btn ghost" onClick={() => void logout()}>
                Sign out
              </button>
              <button
                type="button"
                className="me-delete"
                disabled={deleting}
                onClick={() => {
                  if (
                    !window.confirm(
                      "This permanently deletes your MoneyGames account and synced progress. Guest games on this browser stay. Continue?"
                    )
                  ) {
                    return;
                  }
                  setDeleting(true);
                  setAccountError(null);
                  void deleteAccount()
                    .catch((err: unknown) => {
                      setAccountError(err instanceof Error ? err.message : "Could not delete the account.");
                    })
                    .finally(() => setDeleting(false));
                }}
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="me-copy">
              Playing as a guest. Sign in to see your stats, sync progress, and unlock the
              archive.
            </p>
            <a className="btn primary" href={googleStartPath("/me")}>
              Continue with Google
            </a>
          </>
        )}
      </section>
      {accountError ? <p className="me-copy">{accountError}</p> : null}

      {user ? (
        <>
          <h2 className="me-section">Statistics</h2>
          {stats == null ? (
            <p className="me-copy">Loading stats…</p>
          ) : (
            <div className="me-games">
              {stats.map((card) => (
                <GameStatsCard key={card.id} card={card} />
              ))}
            </div>
          )}
        </>
      ) : null}
      <SiteFooter />
    </main>
  );
}
