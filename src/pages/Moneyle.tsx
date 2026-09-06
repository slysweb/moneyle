import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMoneyleBonus,
  fetchMoneyleGuess,
  fetchMoneylePuzzle,
  type BonusRound,
  type MoneyleCurrency,
  type MoneyleGuessResult,
} from "../lib/api";
import ArchiveBanner from "../components/ArchiveBanner";
import ArchiveLocked from "../components/ArchiveLocked";
import HowToPlayMoneyle from "../components/HowToPlayMoneyle";
import MoneyleBonus, { MoneyleBonusRecap } from "../components/MoneyleBonus";
import MoreGames from "../components/MoreGames";
import NextPuzzleCountdown from "../components/NextPuzzleCountdown";
import { GAME_PAGES } from "../lib/pageMeta";
import { usePageMeta } from "../lib/usePageMeta";
import { denverDate, sharePlayLine } from "../lib/dates";
import { useArchiveGate } from "../lib/useArchiveGate";
import { closenessSquare, copyText, dailyPuzzleNumber } from "../lib/share";
import { loadSyncedProgress, saveProgress } from "../lib/progress";
import { formatScore, moneyleScore } from "../lib/score";
import GameScore from "../components/GameScore";

const MAX_GUESSES = 6;

interface HistoryRow {
  currency: MoneyleCurrency;
  rateDisplay: string;
  stronger: boolean;
  closeness: number;
  correct: boolean;
}

interface SavedRun {
  history: HistoryRow[];
  // Only the server knows the answer, so unlike win/loss it can't be re-derived.
  answer: MoneyleCurrency | null;
  bonusPicks?: string[];
  bonusOpen?: boolean;
}

function frostFor(guessCount: number, revealed: boolean): { blur: number; tint: number } {
  if (revealed) return { blur: 0, tint: 0 };
  const steps = [
    { blur: 28, tint: 0.42 },
    { blur: 20, tint: 0.32 },
    { blur: 14, tint: 0.24 },
    { blur: 9, tint: 0.16 },
    { blur: 5, tint: 0.1 },
    { blur: 2, tint: 0.05 },
  ];
  return steps[Math.min(guessCount, steps.length - 1)];
}

export default function Moneyle() {
  usePageMeta(GAME_PAGES.moneyle.title, GAME_PAGES.moneyle.description);

  const archiveGate = useArchiveGate();
  const requestedDate = archiveGate.requestedDate;
  const [currencies, setCurrencies] = useState<MoneyleCurrency[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [answer, setAnswer] = useState<MoneyleCurrency | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bonusRounds, setBonusRounds] = useState<BonusRound[] | null>(null);
  const [bonusCountry, setBonusCountry] = useState<string | null>(null);
  const [bonusPicks, setBonusPicks] = useState<string[]>([]);
  const [bonusOpen, setBonusOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const revealed = won || lost;
  const remaining = MAX_GUESSES - history.length;
  const frost = frostFor(history.length, revealed);

  const restore = useCallback((date: string) => {
    void loadSyncedProgress<SavedRun>("moneyle", date).then((saved) => {
      if (!saved?.history?.length) return;
      const history = saved.history.slice(0, MAX_GUESSES);
      const solved = history.some((row) => row.correct);
      setHistory(history);
      setAnswer(saved.answer ?? null);
      setWon(solved);
      setLost(!solved && history.length >= MAX_GUESSES);
      setBonusPicks(saved.bonusPicks ?? []);
      setBonusOpen(Boolean(saved.bonusOpen));
    });
  }, []);

  useEffect(() => {
    if (archiveGate.pending || archiveGate.locked) return;
    let cancelled = false;
    setError(false);
    setCurrencies([]);
    setImageUrl(null);
    setPuzzleDate(null);
    setHistory([]);
    setWon(false);
    setLost(false);
    setAnswer(null);
    setQuery("");
    setBonusRounds(null);
    setBonusCountry(null);
    setBonusPicks([]);
    setBonusOpen(false);
    fetchMoneylePuzzle(requestedDate)
      .then((res) => {
        if (cancelled) return;
        setCurrencies(res.currencies);
        setImageUrl(res.imageUrl);
        setPuzzleDate(res.date);
        restore(res.date);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [archiveGate.locked, archiveGate.pending, requestedDate, restore]);

  useEffect(() => {
    if (history.length === 0) return;
    saveProgress<SavedRun>("moneyle", puzzleDate, {
      history,
      answer,
      bonusPicks,
      bonusOpen,
    });
  }, [puzzleDate, history, answer, bonusPicks, bonusOpen]);

  useEffect(() => {
    if (!revealed || !puzzleDate || archiveGate.locked) return;
    let cancelled = false;
    fetchMoneyleBonus(requestedDate)
      .then((res) => {
        if (cancelled || !res.available || !res.rounds?.length || !res.country) return;
        setBonusRounds(res.rounds);
        setBonusCountry(res.country);
      })
      .catch(() => {
        if (!cancelled) {
          setBonusRounds(null);
          setBonusCountry(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [archiveGate.locked, revealed, puzzleDate, requestedDate]);

  const guessedCodes = useMemo(() => new Set(history.map((h) => h.currency.code)), [history]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return currencies
      .filter((c) => !guessedCodes.has(c.code))
      .filter((c) => {
        if (!q) return true;
        return (
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
        );
      })
      .slice(0, 24);
  }, [currencies, guessedCodes, query]);

  const submitCode = useCallback(
    async (code: string) => {
      if (busy || revealed) return;
      const currency = currencies.find((c) => c.code === code);
      if (!currency || guessedCodes.has(code)) return;
      setBusy(true);
      setGuessError(null);
      try {
        const res: MoneyleGuessResult = await fetchMoneyleGuess(
          code,
          history.length + 1,
          puzzleDate
        );
        const row: HistoryRow = {
          currency,
          rateDisplay: res.rateDisplay,
          stronger: res.stronger,
          closeness: res.closeness,
          correct: res.correct,
        };
        setHistory((prev) => [...prev, row]);
        setQuery("");
        setOpen(false);
        if (res.correct) {
          setWon(true);
          setAnswer(res.target);
        } else if (res.remaining <= 0) {
          setLost(true);
          setAnswer(res.target);
        }
      } catch {
        setGuessError("Could not fetch the exchange rate. Try again.");
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, revealed, currencies, guessedCodes, history.length, puzzleDate]
  );

  const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
  const bonusCorrect = bonusRounds
    ? bonusRounds.filter((round, i) =>
        bonusPicks[i] ? round.options.some((opt) => opt.id === bonusPicks[i] && opt.correct) : false
      ).length
    : 0;
  const run = moneyleScore(won, history.length, bonusCorrect, bonusRounds?.length ?? 0);
  const score = formatScore(run.score, run.max);
  const bonusScore =
    bonusRounds && bonusPicks.length >= bonusRounds.length ? bonusCorrect : null;
  const shareText = [
    number != null ? `Moneyle #${number} — ${score}` : `Moneyle — ${score}`,
    "",
    ...history.map((row) => {
      const sq = closenessSquare(row.closeness, row.correct);
      return row.correct ? sq : `${sq}${row.stronger ? "↑" : "↓"}`;
    }),
    ...(bonusScore != null && bonusRounds
      ? [
          "",
          `Bonus ${bonusScore}/${bonusRounds.length}`,
          bonusRounds
            .map((round, i) => (round.options.some((opt) => opt.id === bonusPicks[i] && opt.correct) ? "🟩" : "🟥"))
            .join(""),
        ]
      : []),
    "",
    sharePlayLine("/moneyle", puzzleDate, denverDate()),
  ].join("\n");

  const share = async () => {
    const ok = await copyText(shareText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  if (archiveGate.locked) {
    return <ArchiveLocked next={archiveGate.next} />;
  }

  if (error) {
    return (
      <main className="page">
        <p className="status-msg">
          Could not load Moneyle. <Link to="/archive">Archive</Link>
          {" · "}
          <Link to="/">Home</Link>
        </p>
      </main>
    );
  }

  if (!imageUrl) {
    return (
      <main className="page">
        <p className="status-msg">Loading…</p>
      </main>
    );
  }

  return (
    <main className="game-page moneyle-page">
      <ArchiveBanner title="Moneyle" path="/moneyle" puzzleDate={puzzleDate} />
      <div className="game-topbar">
        <h1 className="game-heading">Moneyle</h1>
        <div className="topbar-right">
          <span className="round-chip">
            {history.length}/{MAX_GUESSES}
          </span>
          <button
            type="button"
            className="help-btn"
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
            title="How to play"
          >
            ?
          </button>
        </div>
      </div>

      <div className="moneyle-note-wrap">
        <div
          className="moneyle-note"
          style={{
            ["--frost-blur" as string]: `${frost.blur}px`,
            ["--frost-tint" as string]: String(frost.tint),
            ["--frost-scale" as string]: revealed ? "1" : "1.12",
          }}
        >
          <img src={imageUrl} alt={revealed && answer ? answer.name : "Hidden banknote"} />
          <div className="moneyle-frost" />
        </div>
        {revealed && answer && (
          <div className={`moneyle-badge ${won ? "win" : "lose"}`}>
            {won ? "Correct" : "Answer"}: {answer.name} ({answer.code})
          </div>
        )}
      </div>

      {!bonusOpen && (
        <ul className="moneyle-history">
          {history.map((row) => (
            <li key={row.currency.code} className={row.correct ? "correct" : ""}>
              <span className="moneyle-hist-name">
                {row.currency.name}
                <small>{row.currency.code}</small>
              </span>
              <span className="moneyle-hist-rate">{row.correct ? "—" : row.rateDisplay}</span>
              <span className={`moneyle-hist-dir ${row.correct ? "hit" : row.stronger ? "up" : "down"}`}>
                {row.correct ? "✓" : row.stronger ? "↑" : "↓"}
              </span>
              <span className="moneyle-hist-pct">{row.correct ? "100%" : `${Math.round(row.closeness)}%`}</span>
            </li>
          ))}
        </ul>
      )}
      {!bonusOpen && bonusRounds && bonusPicks.length >= bonusRounds.length ? (
        <MoneyleBonusRecap rounds={bonusRounds} picks={bonusPicks} />
      ) : null}

      {!revealed && (
        <form
          className="moneyle-search"
          onSubmit={(e) => {
            e.preventDefault();
            const pick = matches[highlight] ?? matches[0];
            if (pick) void submitCode(pick.code);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search name, country, or code…"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((i) => Math.min(i + 1, Math.max(matches.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((i) => Math.max(i - 1, 0));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          {open && matches.length > 0 && (
            <ul className="moneyle-suggest">
              {matches.map((c, i) => (
                <li key={c.code}>
                  <button
                    type="button"
                    className={i === highlight ? "active" : ""}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void submitCode(c.code);
                    }}
                  >
                    <strong>{c.code}</strong>
                    <span>
                      {c.name} · {c.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {guessError && <p className="moneyle-error">{guessError}</p>}
          <p className="moneyle-remain">{remaining} guess{remaining === 1 ? "" : "es"} left</p>
        </form>
      )}

      {revealed && bonusOpen && bonusRounds && bonusCountry ? (
        <MoneyleBonus
          country={bonusCountry}
          rounds={bonusRounds}
          picks={bonusPicks}
          onPick={(id) => {
            const next = [...bonusPicks, id];
            setBonusPicks(next);
            if (next.length >= bonusRounds.length) setBonusOpen(false);
          }}
          onExit={() => setBonusOpen(false)}
        />
      ) : null}

      {revealed && !bonusOpen && (
        <div className="overlay-actions moneyle-end">
          <GameScore
            score={run.score}
            max={run.max}
            lead={bonusRounds ? `Note ${run.note} + bonus ${run.bonus}.` : undefined}
            detail={
              bonusRounds
                ? "First try is 10, then 8, 6, 4, 2, 1; each bonus question is 1."
                : won
                  ? `First try is 10, then 8, 6, 4, 2, 1. You got it in ${history.length}.`
                  : "First try is 10, then 8, 6, 4, 2, 1. Missed this one."
            }
          />
          <NextPuzzleCountdown
            game="Moneyle"
            puzzleDate={puzzleDate}
            autoAdvance={!requestedDate || requestedDate === denverDate()}
          />
          {bonusRounds && bonusCountry && bonusPicks.length < bonusRounds.length ? (
            <button className="btn primary" type="button" onClick={() => setBonusOpen(true)}>
              Play bonus round
            </button>
          ) : null}
          <button
            className={
              bonusRounds && bonusPicks.length < bonusRounds.length ? "btn ghost" : "btn primary"
            }
            type="button"
            onClick={() => void share()}
          >
            {copied ? "Copied!" : "Share"}
          </button>
          <Link className="btn ghost" to="/">
            Home
          </Link>
          <MoreGames current="/moneyle" date={puzzleDate} />
        </div>
      )}

      {showHelp && <HowToPlayMoneyle onClose={() => setShowHelp(false)} />}
    </main>
  );
}
