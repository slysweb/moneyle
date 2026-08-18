import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMoneyleGuess,
  fetchMoneylePuzzle,
  type MoneyleCurrency,
  type MoneyleGuessResult,
} from "../lib/api";
import HowToPlayMoneyle from "../components/HowToPlayMoneyle";
import { usePageMeta } from "../lib/usePageMeta";
import { closenessSquare, copyText, dailyPuzzleNumber } from "../lib/share";

const MAX_GUESSES = 6;

interface HistoryRow {
  currency: MoneyleCurrency;
  rateDisplay: string;
  stronger: boolean;
  closeness: number;
  correct: boolean;
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
  usePageMeta(
    "Moneyle — MoneyGames",
    "A frosted banknote and six guesses. Use live exchange rates to find the hidden currency."
  );

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
  const [runKey, setRunKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const revealed = won || lost;
  const remaining = MAX_GUESSES - history.length;
  const frost = frostFor(history.length, revealed);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchMoneylePuzzle()
      .then((res) => {
        if (cancelled) return;
        setCurrencies(res.currencies);
        setImageUrl(res.imageUrl);
        setPuzzleDate(res.date);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [runKey]);

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
        const res: MoneyleGuessResult = await fetchMoneyleGuess(code, history.length + 1);
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
    [busy, revealed, currencies, guessedCodes, history.length]
  );

  const restart = useCallback(() => {
    setQuery("");
    setHistory([]);
    setWon(false);
    setLost(false);
    setAnswer(null);
    setGuessError(null);
    setCopied(false);
    setImageUrl(null);
    setRunKey((k) => k + 1);
  }, []);

  const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
  const score = won ? `${history.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const shareText = [
    number != null ? `Moneyle #${number} — ${score}` : `Moneyle — ${score}`,
    "",
    ...history.map((row) => {
      const sq = closenessSquare(row.closeness, row.correct);
      return row.correct ? sq : `${sq}${row.stronger ? "↑" : "↓"}`;
    }),
    "",
    "Play Today's Game: https://moneygames.cc/moneyle",
  ].join("\n");

  const share = async () => {
    const ok = await copyText(shareText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error) {
    return (
      <main className="page">
        <p className="status-msg">
          Could not load Moneyle. <Link to="/">Back home</Link>
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

      {revealed && (
        <div className="overlay-actions moneyle-end">
          <button className="btn primary" onClick={restart}>
            Play again
          </button>
          <button className="btn ghost" type="button" onClick={() => void share()}>
            {copied ? "Copied!" : "Share"}
          </button>
          <Link className="btn ghost" to="/">
            Home
          </Link>
        </div>
      )}

      {showHelp && <HowToPlayMoneyle onClose={() => setShowHelp(false)} />}
    </main>
  );
}
