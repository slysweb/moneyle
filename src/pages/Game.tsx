import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMorelessToday, type GameItem, type MorelessLevel } from "../lib/api";
import HowToPlay from "../components/HowToPlay";
import { usePageMeta } from "../lib/usePageMeta";
import { copyText, dailyPuzzleNumber, resultSquares } from "../lib/share";
import { clearProgress, loadProgress, saveProgress } from "../lib/progress";

type Phase = "guessing" | "selected" | "revealing" | "correct" | "wrong" | "sliding";
type Side = "left" | "right";

const ROUNDS_PER_LEVEL = 5;

interface AnswerRecord {
  levelIndex: number;
  levelShort: string;
  metricLabel: string;
  left: GameItem;
  right: GameItem;
  picked: Side;
  correct: boolean;
}

interface SavedRun {
  answers: AnswerRecord[];
}

function useCountUp(target: number, running: boolean, duration = 1200): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!running) {
      setValue(0);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, running, duration]);
  return value;
}

function formatCounting(value: number, finalDisplay: string): string {
  const suffix = finalDisplay.replace(/[^TBM]/g, "").slice(-1);
  const divisor = suffix === "T" ? 1e12 : suffix === "B" ? 1e9 : suffix === "M" ? 1e6 : 1;
  const n = value / divisor;
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return `$${n.toFixed(digits)}${suffix === "$" ? "" : suffix}`;
}

function CardMedia({ item, mode = "cover" }: { item: GameItem; mode?: "cover" | "logo" }) {
  return (
    <div className={`card-media${mode === "logo" ? " logo" : ""}`}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} loading="eager" />
      ) : (
        <div className="card-media-fallback">{item.name.charAt(0)}</div>
      )}
    </div>
  );
}

function cardClass(
  side: Side,
  phase: Phase,
  selected: Side | null,
  correctSide: Side | null
): string {
  const classes = ["card", "pickable", side];
  if (phase === "guessing") classes.push("clickable");
  if (selected === side && (phase === "selected" || phase === "revealing")) {
    classes.push("selected");
  }
  const showResult = phase === "correct" || phase === "wrong" || phase === "sliding";
  if (showResult && selected === side) {
    classes.push(selected === correctSide ? "correct" : "wrong");
  }
  if (phase === "wrong" && correctSide === side && selected !== side) {
    classes.push("reveal-winner");
  }
  return classes.join(" ");
}

export default function Game() {
  usePageMeta(
    "More/Less — MoneyGames",
    "Compare billionaires, companies, salaries, movies, and GDP. Tap the higher value each round — five levels of money intuition."
  );

  const [levels, setLevels] = useState<MorelessLevel[] | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("guessing");
  const [selected, setSelected] = useState<Side | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const timers = useRef<number[]>([]);

  // Position in the run is derived from the answer log rather than saved next
  // to it: a level is always exactly ROUNDS_PER_LEVEL answers, so the two can
  // never drift apart if the app dies mid-animation.
  const restore = useCallback((date: string, loaded: MorelessLevel[]) => {
    const saved = loadProgress<SavedRun>("moreless", date);
    if (!saved?.answers?.length) return;
    const total = loaded.length * ROUNDS_PER_LEVEL;
    const done = Math.min(saved.answers.length, total);
    setAnswers(saved.answers.slice(0, done));
    setLevelIndex(Math.min(Math.floor(done / ROUNDS_PER_LEVEL), loaded.length - 1));
    setRoundIndex(done % ROUNDS_PER_LEVEL);
    setFinished(done >= total);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setLevels(null);
    fetchMorelessToday()
      .then((res) => {
        if (cancelled) return;
        setLevels(res.levels);
        setPuzzleDate(res.date);
        restore(res.date, res.levels);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
    };
  }, [runKey, restore]);

  useEffect(() => {
    if (answers.length === 0) return;
    saveProgress<SavedRun>("moreless", puzzleDate, { answers });
  }, [puzzleDate, answers]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const level = levels?.[levelIndex] ?? null;
  const left = level?.chain?.[roundIndex];
  const right = level?.chain?.[roundIndex + 1];

  const revealing =
    phase === "revealing" || phase === "correct" || phase === "wrong" || phase === "sliding";
  const rightCounted = useCountUp(right?.value ?? 0, revealing);
  const correctSide: Side | null =
    left && right ? (left.value >= right.value ? "left" : "right") : null;

  const advance = useCallback(
    (wasCorrect: boolean, picked: Side, currentLeft: GameItem, currentRight: GameItem) => {
      if (!level) return;
      const record: AnswerRecord = {
        levelIndex,
        levelShort: level.short,
        metricLabel: level.metricLabel,
        left: currentLeft,
        right: currentRight,
        picked,
        correct: wasCorrect,
      };
      setAnswers((prev) => [...prev, record]);

      const nextRound = roundIndex + 1;
      const isLastRound = nextRound >= ROUNDS_PER_LEVEL;
      const isLastLevel = levelIndex >= (levels?.length ?? 1) - 1;

      // Within a level: slide the revealed right card into the left slot.
      if (!isLastRound) {
        setPhase("sliding");
        timers.current.push(
          window.setTimeout(() => {
            setRoundIndex(nextRound);
            setSelected(null);
            setPhase("guessing");
          }, 450)
        );
        return;
      }

      // Next level / finish: hard cut (no shared card to carry over).
      setSelected(null);
      if (!isLastLevel) {
        setLevelIndex((i) => i + 1);
        setRoundIndex(0);
        setPhase("guessing");
        return;
      }
      setFinished(true);
    },
    [level, levelIndex, roundIndex, levels]
  );

  const pick = useCallback(
    (side: Side) => {
      if (phase !== "guessing" || !left || !right) return;
      clearTimers();
      setSelected(side);
      setPhase("selected");

      const isCorrect =
        side === "left" ? left.value >= right.value : right.value >= left.value;

      timers.current.push(
        window.setTimeout(() => {
          setPhase("revealing");
          timers.current.push(
            window.setTimeout(() => {
              setPhase(isCorrect ? "correct" : "wrong");
              timers.current.push(
                window.setTimeout(() => {
                  advance(isCorrect, side, left, right);
                }, 900)
              );
            }, 1300)
          );
        }, 700)
      );
    },
    [phase, left, right, advance]
  );

  const restart = useCallback(() => {
    clearTimers();
    clearProgress("moreless");
    setLevelIndex(0);
    setRoundIndex(0);
    setPhase("guessing");
    setSelected(null);
    setAnswers([]);
    setFinished(false);
    setCopied(false);
    setRunKey((k) => k + 1);
  }, []);

  if (error) {
    return (
      <main className="page">
        <p className="status-msg">
          Could not load the game. <Link to="/">Back home</Link>
        </p>
      </main>
    );
  }

  if (!levels || !level || !left || !right) {
    return (
      <main className="page">
        <p className="status-msg">Loading…</p>
      </main>
    );
  }

  if (finished) {
    const total = answers.length;
    const correctCount = answers.filter((a) => a.correct).length;
    const byLevel = (levels ?? []).map((lvl, i) => {
      const rows = answers.filter((a) => a.levelIndex === i);
      return {
        short: lvl.short,
        marks: resultSquares(rows.map((r) => r.correct)),
      };
    });
    const number = puzzleDate ? dailyPuzzleNumber(puzzleDate) : null;
    const shareText = [
      number != null ? `More/Less #${number} — ${correctCount}/${total}` : `More/Less — ${correctCount}/${total}`,
      "",
      ...byLevel.map((row) => `${row.short} ${row.marks}`),
      "",
      "Play Today's Game: https://moneygames.cc/moreless",
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
        <div className="review-screen">
          <h1>Run complete</h1>
          <p className="review-score">
            <strong>{correctCount}</strong>
            <span> / {total}</span>
          </p>
          <p className="review-sub">Here&apos;s how you did across all five levels.</p>
          <ul className="review-levels">
            {byLevel.map((row) => (
              <li key={row.short}>
                <span>{row.short}</span>
                <span className="review-marks" aria-label={row.marks}>
                  {row.marks}
                </span>
              </li>
            ))}
          </ul>
          <div className="overlay-actions">
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
        </div>
      </main>
    );
  }

  const metric = level.metricLabel;
  const mediaMode = level.slug === "market-cap" ? "logo" : "cover";
  const verdictClass =
    phase === "correct" || (phase === "sliding" && selected === correctSide)
      ? "correct"
      : phase === "wrong" || (phase === "sliding" && selected && selected !== correctSide)
        ? "wrong"
        : "";

  const rightValue = () => {
    if (!revealing) return <span className="card-value hidden">?</span>;
    if (phase === "revealing") {
      return (
        <span className="card-value counting">
          {formatCounting(rightCounted, right.displayValue)}
        </span>
      );
    }
    return <span className="card-value">{right.displayValue}</span>;
  };

  return (
    <main className="game-page">
      <div className="game-topbar">
        <h1 className="game-heading">More/Less</h1>
        <div className="topbar-right">
          <span className="round-chip">
            {roundIndex + 1}/{ROUNDS_PER_LEVEL}
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

      <div className="level-progress" aria-label="Levels">
        {levels.map((lvl, i) => {
          const state =
            i < levelIndex ? "done" : i === levelIndex ? "current" : "todo";
          return (
            <div key={lvl.slug} className={`level-pill ${state}`}>
              {state === "current" ? lvl.short : i + 1}
            </div>
          );
        })}
      </div>

      <div className={`board ${phase === "sliding" ? "sliding" : ""}`}>
        <button
          type="button"
          className={cardClass("left", phase, selected, correctSide)}
          onClick={() => pick("left")}
          disabled={phase !== "guessing"}
        >
          <CardMedia item={left} mode={mediaMode} />
          <div className="card-body">
            <h2>{left.name}</h2>
            {left.subtitle && <p className="card-sub">{left.subtitle}</p>}
            <p className="card-metric">{metric}</p>
            <span className="card-value">{left.displayValue}</span>
          </div>
        </button>

        <div className={`vs-badge ${verdictClass}`}>
          {verdictClass === "correct" ? (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
            </svg>
          ) : verdictClass === "wrong" ? (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4L13.4 12z" />
            </svg>
          ) : (
            "vs"
          )}
        </div>

        <button
          type="button"
          className={cardClass("right", phase, selected, correctSide)}
          onClick={() => pick("right")}
          disabled={phase !== "guessing"}
        >
          <CardMedia item={right} mode={mediaMode} />
          <div className="card-body">
            <h2>{right.name}</h2>
            {right.subtitle && <p className="card-sub">{right.subtitle}</p>}
            <p className="card-metric">{metric}</p>
            {rightValue()}
          </div>
        </button>
      </div>

      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </main>
  );
}
