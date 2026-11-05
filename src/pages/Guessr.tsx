import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGuessrToday, type GuessrCurrency, type GuessrPiece } from "../lib/api";
import ArchiveBanner from "../components/ArchiveBanner";
import ArchiveLocked from "../components/ArchiveLocked";
import HowToPlayGuessr from "../components/HowToPlayGuessr";
import MoreGames from "../components/MoreGames";
import NextPuzzleCountdown from "../components/NextPuzzleCountdown";
import { GAME_PAGES } from "../lib/pageMeta";
import { usePageMeta } from "../lib/usePageMeta";
import { denverDate, sharePlayLine } from "../lib/dates";
import { useArchiveGate } from "../lib/useArchiveGate";
import { copyText, dailyPuzzleNumber, errorSquare } from "../lib/share";
import { loadSyncedProgress, saveProgress } from "../lib/progress";
import { formatScore, guessrRoundPoints, guessrScore } from "../lib/score";
import GameScore from "../components/GameScore";

const ROUNDS = 5;
const MEMORIZE_MS = 5000;

type Phase = "memorize" | "guess" | "reveal";

interface RoundResult {
  guessCents: number;
  actualCents: number;
  pct: number;
}

interface SavedRun {
  results: RoundResult[];
}

function totalCents(pieces: GuessrPiece[]): number {
  return pieces.reduce((sum, p) => sum + p.valueCents, 0);
}

function uniqueImageUrls(puzzles: GuessrPiece[][]): string[] {
  const urls = new Set<string>();
  for (const pieces of puzzles) {
    for (const piece of pieces) {
      if (piece.imageUrl) urls.add(piece.imageUrl);
    }
  }
  return [...urls];
}

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(() => resolve(), () => resolve());
        return;
      }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

function preloadGuessrImages(puzzles: GuessrPiece[][]): void {
  void Promise.all(uniqueImageUrls(puzzles).map(loadImage));
}

function waitForImages(urls: string[], timeoutMs: number): Promise<void> {
  if (urls.length === 0) return Promise.resolve();
  return Promise.race([
    Promise.all(urls.map(loadImage)).then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
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
  if (Math.abs(pct) < 0.1) return "0.0%";
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

function guessrQuip(pct: number, roundIndex: number): string {
  const abs = Math.abs(pct);
  const pick = (lines: string[]) => lines[roundIndex % lines.length];

  if (abs < 1) {
    return pick([
      "Spot on. Did you used to work a supermarket till?",
      "That’s a cashier’s eye. The vault would hire you.",
      "Perfect count. Save some talent for the next pile.",
    ]);
  }
  if (abs <= 5) {
    return pick([
      "Very close — you’ve got a keen nose for money.",
      "A hair off. Your money sense is sharp.",
      "Almost nailed it. Banknotes fear you.",
    ]);
  }
  if (roundIndex === 0) {
    return "Easy now — this is only the opening pile.";
  }
  if (abs <= 15) {
    return pick([
      "How long has it been since you last counted cash?",
      "In the ballpark… if the ballpark were a little bigger.",
      "Not terrible. Not a promotion either.",
    ]);
  }
  return pick([
    "Way off. This currency might not be your everyday.",
    "How long has it been since you last counted cash?",
    "That’s a different zip code of money.",
    "The pile and your guess are barely on speaking terms.",
  ]);
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
  quip,
}: {
  pieces: GuessrPiece[];
  hidden: boolean;
  quip?: string;
}) {
  const stacks = groupStacks(pieces);
  const bills = stacks.filter((s) => s[0].kind === "bill");
  const coins = stacks.filter((s) => s[0].kind === "coin");
  const coinValues = coins.map((s) => s[0].valueCents);
  const coinMin = coinValues.length ? Math.min(...coinValues) : 0;
  const coinMax = coinValues.length ? Math.max(...coinValues) : 0;

  return (
    <div className={`guessr-table${hidden ? " hidden" : ""}${quip ? " with-quip" : ""}`} aria-hidden={hidden}>
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
      {quip ? <p className="guessr-quip">{quip}</p> : null}
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
  const portrait = kind === "bill" && /\/money\/chf\//.test(stack[0].imageUrl);
  const n = stack.length;
  const dx = kind === "bill" ? (portrait ? 8 : 13) : 10;
  const dy = kind === "bill" ? 9 : 9;
  const sizeStyle =
    kind === "coin" && sizePx
      ? { ["--piece-w" as string]: `${sizePx}px`, ["--piece-h" as string]: `${sizePx}px` }
      : undefined;

  return (
    <div
      className={`guessr-stack ${kind} ${stack[0].slug}${portrait ? " portrait" : ""}`}
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
  usePageMeta(GAME_PAGES.guessr.title, GAME_PAGES.guessr.description, GAME_PAGES.guessr.image);

  const archiveGate = useArchiveGate();
  const requestedDate = archiveGate.requestedDate;
  const [puzzles, setPuzzles] = useState<GuessrPiece[][] | null>(null);
  const [currency, setCurrency] = useState<GuessrCurrency | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("memorize");
  const [guess, setGuess] = useState("");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const [remainingMs, setRemainingMs] = useState(MEMORIZE_MS);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const closeHelp = useCallback(() => {
    setShowHelp(false);
    setIntroOpen(false);
  }, []);

  // A submitted guess is a finished round, so the round to resume at is simply
  // however many results are already banked.
  const restore = useCallback(async (date: string) => {
    const saved = await loadSyncedProgress<SavedRun>("guessr", date);
    if (!saved?.results?.length) {
      setIntroOpen(true);
      setRemainingMs(MEMORIZE_MS);
      return;
    }
    const results = saved.results.slice(0, ROUNDS);
    setResults(results);
    setRound(Math.min(results.length, ROUNDS - 1));
    setFinished(results.length >= ROUNDS);
    setRemainingMs(MEMORIZE_MS);
    setPhase("memorize");
    setIntroOpen(false);
  }, []);

  useEffect(() => {
    if (archiveGate.pending || archiveGate.locked) return;
    let cancelled = false;
    setError(false);
    setPuzzles(null);
    setCurrency(null);
    setPuzzleDate(null);
    setRound(0);
    setPhase("memorize");
    setGuess("");
    setResults([]);
    setFinished(false);
    setIntroOpen(false);
    setShowHelp(false);
    setRemainingMs(MEMORIZE_MS);
    fetchGuessrToday(requestedDate)
      .then(async (res) => {
        if (cancelled) return;
        await restore(res.date);
        if (cancelled) return;
        setCurrency(res.currency);
        setPuzzles(res.puzzles.map((p) => p.pieces));
        setPuzzleDate(res.date);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [archiveGate.locked, archiveGate.pending, requestedDate, restore]);

  useEffect(() => {
    if (!puzzles) return;
    preloadGuessrImages(puzzles);
  }, [puzzles]);

  useEffect(() => {
    if (results.length === 0) return;
    saveProgress<SavedRun>("guessr", puzzleDate, { results });
  }, [puzzleDate, results]);

  const pieces = puzzles?.[round] ?? [];
  const actual = totalCents(pieces);
  const minorDigits = currency?.minorDigits ?? 2;

  useEffect(() => {
    if (!puzzles || finished || phase !== "memorize" || introOpen) return;
    let cancelled = false;
    let frame = 0;
    let fallback = 0;
    clearTimers();
    setRemainingMs(MEMORIZE_MS);

    const startClock = () => {
      if (cancelled) return;
      const started = performance.now();
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
      fallback = window.setTimeout(() => setPhase("guess"), MEMORIZE_MS + 50);
      timers.current.push(fallback);
    };

    void waitForImages(uniqueImageUrls([puzzles[round] ?? []]), 2500).then(startClock);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
    };
  }, [puzzles, round, phase, finished, introOpen]);

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
    setRemainingMs(MEMORIZE_MS);
    setPhase("memorize");
  }, [round]);

  if (archiveGate.locked) {
    return <ArchiveLocked next={archiveGate.next} />;
  }

  if (error) {
    return (
      <main className="page">
        <p className="status-msg">
          Could not load Worth Guessr. <Link to="/archive">Archive</Link>
          {" · "}
          <Link to="/">Home</Link>
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
    const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
    const run = guessrScore(results);
    const shareText = [
      number != null
        ? `Worth Guessr #${number} — ${formatScore(run.score, run.max)}`
        : `Worth Guessr — ${formatScore(run.score, run.max)}`,
      "",
      ...results.map((row, i) => `Round ${i + 1} ${errorSquare(row.pct)} ${formatPct(row.pct)}`),
      "",
      sharePlayLine("/guessr", puzzleDate, denverDate()),
    ].join("\n");

    const share = async () => {
      const ok = await copyText(shareText);
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <main className="game-page">
        <ArchiveBanner title="Worth Guessr" path="/guessr" puzzleDate={puzzleDate} />
        <div className="review-screen guessr-review">
          <h1>Run complete</h1>
          <GameScore
            score={run.score}
            max={run.max}
            detail={`Exact is 2 pts, within 10% is 1.5, within 20% is 1. Average error ${avgAbs.toFixed(1)}%.`}
          />
          <ul className="review-levels">
            {results.map((row, i) => {
              const pts = guessrRoundPoints(row.pct, row.guessCents, row.actualCents);
              return (
                <li key={i}>
                  <span>
                    Round {i + 1}
                    <small className="guessr-review-meta">
                      {formatMoney(row.guessCents, currency)} vs {formatMoney(row.actualCents, currency)}
                    </small>
                  </span>
                  <strong className={pctClass(row.pct)}>
                    {formatPct(row.pct)}
                    <small className="guessr-review-pts">{pts} pt{pts === 1 ? "" : "s"}</small>
                  </strong>
                </li>
              );
            })}
          </ul>
          <div className="overlay-actions">
            <NextPuzzleCountdown
              game="Worth Guessr"
              puzzleDate={puzzleDate}
              autoAdvance={!requestedDate || requestedDate === denverDate()}
            />
            <button className="btn primary" type="button" onClick={() => void share()}>
              {copied ? "Copied!" : "Share"}
            </button>
            <Link className="btn ghost" to="/">
              Home
            </Link>
            <MoreGames current="/guessr" date={puzzleDate} />
          </div>
        </div>
      </main>
    );
  }

  const last = results[results.length - 1];
  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <main className="game-page guessr-page">
      <ArchiveBanner title="Worth Guessr" path="/guessr" puzzleDate={puzzleDate} />
      <div className="game-topbar">
        <h1 className="game-heading">Worth Guessr</h1>
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
        {phase === "memorize" && !introOpen && (
          <div className="guessr-timer" aria-live="polite">
            <div
              key={round}
              className="guessr-timer-bar"
              style={{ transform: `scaleX(${Math.max(0, remainingMs / MEMORIZE_MS)})` }}
            />
            <span>{secondsLeft}s</span>
          </div>
        )}

        {!introOpen && (
          <MoneyPile
            pieces={pieces}
            hidden={phase === "guess"}
            quip={phase === "reveal" && last ? guessrQuip(last.pct, round) : undefined}
          />
        )}

        <div className="guessr-dock">
          {phase === "memorize" && !introOpen && (
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

      {(showHelp || introOpen) && <HowToPlayGuessr onClose={closeHelp} />}
    </main>
  );
}
