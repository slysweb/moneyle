import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGuessrToday, type GuessrCurrency, type GuessrPiece } from "../lib/api";
import HowToPlayGuessr from "../components/HowToPlayGuessr";
import { usePageMeta } from "../lib/usePageMeta";

const ROUNDS = 5;
const MEMORIZE_MS = 5000;

type Phase = "memorize" | "guess" | "reveal";

interface RoundResult {
  guessCents: number;
  actualCents: number;
  pct: number;
}

function totalCents(pieces: GuessrPiece[]): number {
  return pieces.reduce((sum, p) => sum + p.valueCents, 0);
}

function formatMoney(minor: number, currency: GuessrCurrency): string {
  const value = minor / 10 ** currency.minorDigits;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: currency.minorDigits,
      maximumFractionDigits: currency.minorDigits,
    }).format(value);
  } catch {
    return `${currency.symbol}${value.toFixed(currency.minorDigits)}`;
  }
}

function formatPct(pct: number): string {
  if (Math.abs(pct) < 0.05) return "0.0%";
  const sign = pct > 0 ? "+" : "−";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

function parseGuess(raw: string, minorDigits: number): number | null {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10 ** minorDigits);
}

function pctClass(pct: number): string {
  const abs = Math.abs(pct);
  if (abs <= 5) return "close";
  if (abs <= 15) return "near";
  return "far";
}

function groupStacks(pieces: GuessrPiece[]): GuessrPiece[][] {
  const map = new Map<string, GuessrPiece[]>();
  for (const p of pieces) {
    const list = map.get(p.slug) ?? [];
    list.push(p);
    map.set(p.slug, list);
  }
  return [...map.values()].sort((a, b) => {
    if (a[0].kind !== b[0].kind) return a[0].kind === "bill" ? -1 : 1;
    return a[0].valueCents - b[0].valueCents;
  });
}

const STACK_TILT = [-5, -2, 3, 6, -4, 2, 5, -3];

function coinPx(value: number, min: number, max: number): number {
  if (max <= min) return 68;
  const t = (value - min) / (max - min);
  return Math.round(52 + t * 38);
}

function MoneyPile({
  pieces,
  hidden,
}: {
  pieces: GuessrPiece[];
  hidden: boolean;
}) {
  const stacks = groupStacks(pieces);
  const bills = stacks.filter((s) => s[0].kind === "bill");
  const coins = stacks.filter((s) => s[0].kind === "coin");
  const coinValues = coins.map((s) => s[0].valueCents);
  const coinMin = coinValues.length ? Math.min(...coinValues) : 0;
  const coinMax = coinValues.length ? Math.max(...coinValues) : 0;

  return (
    <div className={`guessr-table${hidden ? " hidden" : ""}`} aria-hidden={hidden}>
      {bills.length > 0 && (
        <div className="guessr-row bills">
          {bills.map((stack, si) => (
            <DenomStack key={stack[0].slug} stack={stack} tilt={STACK_TILT[si % STACK_TILT.length]} />
          ))}
        </div>
      )}
      {coins.length > 0 && (
        <div className="guessr-row coins">
          {coins.map((stack, si) => (
            <DenomStack
              key={stack[0].slug}
              stack={stack}
              tilt={STACK_TILT[(si + 3) % STACK_TILT.length]}
              sizePx={coinPx(stack[0].valueCents, coinMin, coinMax)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DenomStack({
  stack,
  tilt,
  sizePx,
}: {
  stack: GuessrPiece[];
  tilt: number;
  sizePx?: number;
}) {
  const kind = stack[0].kind;
  const n = stack.length;
  const dx = kind === "bill" ? 13 : 10;
  const dy = kind === "bill" ? 9 : 9;
  const sizeStyle =
    kind === "coin" && sizePx
      ? { ["--piece-w" as string]: `${sizePx}px`, ["--piece-h" as string]: `${sizePx}px` }
      : undefined;

  return (
    <div
      className={`guessr-stack ${kind} ${stack[0].slug}`}
      style={{
        width: `calc(var(--piece-w) + ${(n - 1) * dx}px)`,
        height: `calc(var(--piece-h) + ${(n - 1) * dy}px)`,
        transform: `rotate(${tilt}deg)`,
        ...sizeStyle,
      }}
    >
      {stack.map((p, i) => (
        <div
          key={`${p.slug}-${i}`}
          className={`guessr-piece ${p.kind} ${p.slug}`}
          style={{
            left: i * dx,
            top: i * dy,
            zIndex: i + 1,
          }}
        >
          <img src={p.imageUrl} alt={i === n - 1 ? `${n} × ${p.name}` : ""} draggable={false} />
        </div>
      ))}
    </div>
  );
}

export default function Guessr() {
  usePageMeta(
    "Money Guessr — MoneyGames",
    "A pile of bills and coins flashes for five seconds. Guess the total. Five rounds, scored by how close you are."
  );

  const [puzzles, setPuzzles] = useState<GuessrPiece[][] | null>(null);
  const [currency, setCurrency] = useState<GuessrCurrency | null>(null);
  const [error, setError] = useState(false);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("memorize");
  const [guess, setGuess] = useState("");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [remainingMs, setRemainingMs] = useState(MEMORIZE_MS);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setPuzzles(null);
    fetchGuessrToday()
      .then((res) => {
        if (cancelled) return;
        setCurrency(res.currency);
        setPuzzles(res.puzzles.map((p) => p.pieces));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [runKey]);

  const pieces = puzzles?.[round] ?? [];
  const actual = totalCents(pieces);
  const minorDigits = currency?.minorDigits ?? 2;

  useEffect(() => {
    if (!puzzles || finished || phase !== "memorize") return;
    clearTimers();
    setRemainingMs(MEMORIZE_MS);
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const left = Math.max(0, MEMORIZE_MS - (now - started));
      setRemainingMs(left);
      if (left <= 0) {
        setPhase("guess");
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const fallback = window.setTimeout(() => setPhase("guess"), MEMORIZE_MS + 50);
    timers.current.push(fallback);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
    };
  }, [puzzles, round, phase, finished]);

  useEffect(() => {
    if (phase === "guess") {
      inputRef.current?.focus();
    }
  }, [phase]);

  const submit = useCallback(() => {
    if (phase !== "guess" || !currency) return;
    const cents = parseGuess(guess, currency.minorDigits);
    if (cents === null) return;
    const pct = actual === 0 ? 0 : ((cents - actual) / actual) * 100;
    setResults((prev) => [...prev, { guessCents: cents, actualCents: actual, pct }]);
    setPhase("reveal");
  }, [phase, guess, actual, currency]);

  const next = useCallback(() => {
    if (round + 1 >= ROUNDS) {
      setFinished(true);
      return;
    }
    setRound((r) => r + 1);
    setGuess("");
    setPhase("memorize");
  }, [round]);

  const restart = useCallback(() => {
    clearTimers();
    setRound(0);
    setPhase("memorize");
    setGuess("");
    setResults([]);
    setFinished(false);
    setRunKey((k) => k + 1);
  }, []);

  if (error) {
    return (
      <main className="page">
        <p className="status-msg">
          Could not load Money Guessr. <Link to="/">Back home</Link>
        </p>
      </main>
    );
  }

  if (!puzzles || !currency) {
    return (
      <main className="page">
        <p className="status-msg">Loading…</p>
      </main>
    );
  }

  if (finished) {
    const avgAbs =
      results.reduce((sum, r) => sum + Math.abs(r.pct), 0) / Math.max(results.length, 1);
    return (
      <main className="game-page">
        <div className="review-screen guessr-review">
          <h1>Run complete</h1>
          <p className="review-score">
            <strong>{avgAbs.toFixed(1)}%</strong>
          </p>
          <p className="review-sub">Average absolute error across {ROUNDS} {currency.name} piles.</p>
          <ul className="review-levels">
            {results.map((row, i) => (
              <li key={i}>
                <span>
                  Round {i + 1}
                  <small className="guessr-review-meta">
                    {formatMoney(row.guessCents, currency)} vs {formatMoney(row.actualCents, currency)}
                  </small>
                </span>
                <strong className={pctClass(row.pct)}>{formatPct(row.pct)}</strong>
              </li>
            ))}
          </ul>
          <div className="overlay-actions">
            <button className="btn primary" onClick={restart}>
              Play again
            </button>
            <Link className="btn ghost" to="/">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const last = results[results.length - 1];
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const timerPct = (remainingMs / MEMORIZE_MS) * 100;

  return (
    <main className="game-page guessr-page">
      <div className="game-topbar">
        <h1 className="game-heading">Money Guessr</h1>
        <div className="topbar-right">
          <span className="round-chip">{currency.code}</span>
          <span className="round-chip">
            {round + 1}/{ROUNDS}
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

      <div className="guessr-stage">
        {phase === "memorize" && (
          <div className="guessr-timer" aria-live="polite">
            <div className="guessr-timer-bar" style={{ width: `${timerPct}%` }} />
            <span>{secondsLeft}s</span>
          </div>
        )}

        <MoneyPile pieces={pieces} hidden={phase === "guess"} />

        <div className="guessr-dock">
          {phase === "memorize" && (
            <p className="guessr-dock-hint">Count the cash — it disappears in {secondsLeft}s</p>
          )}

          {phase === "guess" && (
            <form
              className="guessr-prompt"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <label htmlFor="guessr-amount">How much was on the table?</label>
              <div className="guessr-input-row">
                <span className="guessr-dollar">{currency.symbol}</span>
                <input
                  id="guessr-amount"
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={minorDigits === 0 ? "0" : "0.00"}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                />
                <button className="btn primary" type="submit" disabled={parseGuess(guess, minorDigits) === null}>
                  Submit
                </button>
              </div>
            </form>
          )}

          {phase === "reveal" && last && (
            <div className="guessr-result">
              <div className="guessr-result-grid">
                <div>
                  <span>Your guess</span>
                  <strong>{formatMoney(last.guessCents, currency)}</strong>
                </div>
                <div>
                  <span>Actual</span>
                  <strong>{formatMoney(last.actualCents, currency)}</strong>
                </div>
                <div>
                  <span>Difference</span>
                  <strong className={pctClass(last.pct)}>{formatPct(last.pct)}</strong>
                </div>
              </div>
              <button className="btn primary" onClick={next}>
                {round + 1 >= ROUNDS ? "See results" : "Next pile"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showHelp && <HowToPlayGuessr onClose={() => setShowHelp(false)} />}
    </main>
  );
}
