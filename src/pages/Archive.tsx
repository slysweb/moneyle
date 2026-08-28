import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ArchiveLocked from "../components/ArchiveLocked";
import SiteFooter from "../components/SiteFooter";
import {
  ARCHIVE_GAMES,
  SITE_EPOCH,
  addCalendarMonths,
  daysInMonth,
  denverDate,
  formatPuzzleDate,
  gamesForDate,
  isIsoDate,
  monthLabel,
  monthStart,
  playPath,
  weekdaySundayFirst,
} from "../lib/dates";
import { useAuth } from "../lib/auth";
import { dailyPuzzleNumber } from "../lib/share";
import { usePageMeta } from "../lib/usePageMeta";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Archive() {
  usePageMeta(
    "Archive — MoneyGames",
    "Registered members can play any past MoneyGames daily puzzle. More/Less, Money Guessr, Moneyle, and MoneyConnections from launch day through today."
  );

  const { user, loading } = useAuth();
  const today = denverDate();
  const [params, setParams] = useSearchParams();
  const raw = params.get("date");
  const selected =
    isIsoDate(raw) && raw >= SITE_EPOCH && raw <= today ? raw : today;

  const [monthCursor, setMonthCursor] = useState(monthStart(selected));

  useEffect(() => {
    setMonthCursor(monthStart(selected));
  }, [selected]);

  const minMonth = monthStart(SITE_EPOCH);
  const maxMonth = monthStart(today);

  const cells = useMemo(() => {
    const year = Number(monthCursor.slice(0, 4));
    const month = Number(monthCursor.slice(5, 7));
    const pad = weekdaySundayFirst(monthCursor);
    const count = daysInMonth(year, month);
    const out: (string | null)[] = Array.from({ length: pad }, () => null);
    for (let day = 1; day <= count; day += 1) {
      out.push(`${monthCursor.slice(0, 7)}-${String(day).padStart(2, "0")}`);
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [monthCursor]);

  const available = gamesForDate(selected);
  const puzzleNumber = dailyPuzzleNumber(selected);

  const selectDate = (iso: string) => {
    setParams({ date: iso }, { replace: true });
  };

  const shiftMonth = (delta: number) => {
    const next = addCalendarMonths(monthCursor, delta);
    if (next < minMonth || next > maxMonth) return;
    setMonthCursor(next);
  };

  if (loading) {
    return (
      <main className="page">
        <p className="status-msg">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return <ArchiveLocked next={`/archive${raw ? `?date=${raw}` : ""}`} />;
  }

  return (
    <main className="page archive-page">
      <p className="info-kicker">
        <Link to="/">← Home</Link>
      </p>
      <h1>Archive</h1>
      <p className="archive-lead">
        Every past puzzle is here for members. Pick a date, then a game — one run per date.
        New puzzles drop at midnight Denver time — same ones for everyone.
      </p>

      <div className="archive-cal">
        <div className="archive-cal-nav">
          <button
            type="button"
            className="btn ghost"
            onClick={() => shiftMonth(-1)}
            disabled={monthCursor <= minMonth}
            aria-label="Previous month"
          >
            ←
          </button>
          <h2>{monthLabel(monthCursor)}</h2>
          <button
            type="button"
            className="btn ghost"
            onClick={() => shiftMonth(1)}
            disabled={monthCursor >= maxMonth}
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <div className="archive-cal-grid" role="grid" aria-label="Puzzle calendar">
          {WEEKDAYS.map((day) => (
            <div key={day} className="archive-cal-dow" role="columnheader">
              {day}
            </div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`pad-${i}`} className="archive-cal-cell empty" />;
            const inRange = iso >= SITE_EPOCH && iso <= today;
            const nGames = inRange ? gamesForDate(iso).length : 0;
            const isToday = iso === today;
            const isSelected = iso === selected;
            return (
              <button
                key={iso}
                type="button"
                className={[
                  "archive-cal-cell",
                  inRange ? "playable" : "",
                  isToday ? "today" : "",
                  isSelected ? "selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={!inRange}
                onClick={() => selectDate(iso)}
                aria-pressed={isSelected}
                aria-label={
                  inRange
                    ? `${formatPuzzleDate(iso)}, ${nGames} game${nGames === 1 ? "" : "s"}`
                    : formatPuzzleDate(iso)
                }
              >
                <span className="archive-cal-num">{Number(iso.slice(8))}</span>
                {inRange ? <span className="archive-cal-dots" aria-hidden>{nGames}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <section className="archive-day" aria-live="polite">
        <h2>
          #{puzzleNumber}
          <span> · {formatPuzzleDate(selected)}</span>
          {selected === today ? <span className="archive-today-tag">Today</span> : null}
        </h2>
        {selected !== today ? (
          <p className="archive-jump">
            <button type="button" className="text-link" onClick={() => selectDate(today)}>
              Jump to today
            </button>
          </p>
        ) : null}
        <ul className="archive-games">
          {ARCHIVE_GAMES.map((game) => {
            const ready = selected >= game.epoch && selected <= today;
            if (!ready) {
              return (
                <li key={game.id} className="archive-game muted">
                  <div>
                    <strong>{game.name}</strong>
                    <p>Launched {formatPuzzleDate(game.epoch)}</p>
                  </div>
                  <span className="archive-game-soon">Not yet</span>
                </li>
              );
            }
            return (
              <li key={game.id} className="archive-game">
                <div>
                  <strong>{game.name}</strong>
                  <p>Puzzle #{puzzleNumber}</p>
                </div>
                <Link className="btn primary" to={playPath(game.path, selected, today)}>
                  Play
                </Link>
              </li>
            );
          })}
        </ul>
        {available.some((g) => g.id === "moneyle") ? (
          <p className="archive-note">
            Moneyle clues use today’s mid-market rates, not a historical snapshot.
          </p>
        ) : null}
      </section>

      <SiteFooter />
    </main>
  );
}
