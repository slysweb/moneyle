import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRound, type GameItem, type RoundResponse } from "../lib/api";

type Phase = "guessing" | "revealing" | "correct" | "wrong" | "sliding";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function useCountUp(target: number, running: boolean, duration = 800): number {
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
  // Match the magnitude of the final formatted value (e.g. "$27.4T").
  const suffix = finalDisplay.replace(/[^TBM]/g, "").slice(-1);
  const divisor = suffix === "T" ? 1e12 : suffix === "B" ? 1e9 : suffix === "M" ? 1e6 : 1;
  const n = value / divisor;
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return `$${n.toFixed(digits)}${suffix === "$" ? "" : suffix}`;
}

function bestScoreKey(slug: string): string {
  return `moneygames.moreless.best.${slug}`;
}

function CardMedia({ item }: { item: GameItem }) {
  return (
    <div className="card-media">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} loading="eager" />
      ) : (
        <div className="card-media-fallback">{item.name.charAt(0)}</div>
      )}
    </div>
  );
}

export default function Game() {
  const { slug = "" } = useParams();
  const [round, setRound] = useState<RoundResponse | null>(null);
  const [error, setError] = useState(false);
  const [deck, setDeck] = useState<GameItem[]>([]);
  const [index, setIndex] = useState(0); // left card = deck[index]
  const [phase, setPhase] = useState<Phase>("guessing");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const timers = useRef<number[]>([]);

  const left = deck[index];
  const right = deck[index + 1];
  const revealing = phase !== "guessing";
  const counted = useCountUp(right?.value ?? 0, revealing);

  useEffect(() => {
    setBest(Number(localStorage.getItem(bestScoreKey(slug)) || 0));
    fetchRound(slug)
      .then((data) => {
        setRound(data);
        setDeck(shuffle(data.items));
      })
      .catch(() => setError(true));
    return () => timers.current.forEach(clearTimeout);
  }, [slug]);

  const guess = useCallback(
    (choice: "more" | "less") => {
      if (phase !== "guessing" || !left || !right) return;
      const isMore = right.value >= left.value;
      const correct = choice === "more" ? isMore : !isMore;
      setPhase("revealing");

      timers.current.push(
        window.setTimeout(() => {
          setPhase(correct ? "correct" : "wrong");
          if (correct) {
            const newScore = score + 1;
            setScore(newScore);
            if (newScore > best) {
              setBest(newScore);
              localStorage.setItem(bestScoreKey(slug), String(newScore));
            }
            timers.current.push(
              window.setTimeout(() => {
                setPhase("sliding");
                timers.current.push(
                  window.setTimeout(() => {
                    // Advance; reshuffle when the deck runs out.
                    if (index + 2 >= deck.length - 1) {
                      const current = deck[index + 1];
                      const rest = shuffle(deck.filter((i) => i.id !== current.id));
                      setDeck([current, ...rest]);
                      setIndex(0);
                    } else {
                      setIndex((i) => i + 1);
                    }
                    setPhase("guessing");
                  }, 450)
                );
              }, 900)
            );
          } else {
            timers.current.push(
              window.setTimeout(() => setGameOver(true), 1100)
            );
          }
        }, 850)
      );
    },
    [phase, left, right, score, best, slug, index, deck]
  );

  const restart = useCallback(() => {
    setDeck((d) => shuffle(d));
    setIndex(0);
    setScore(0);
    setGameOver(false);
    setPhase("guessing");
  }, []);

  if (error) {
    return (
      <main className="page">
        <p className="status-msg">
          Could not load this category. <Link to="/moreless">Back to categories</Link>
        </p>
      </main>
    );
  }

  if (!round || !left || !right) {
    return (
      <main className="page">
        <p className="status-msg">Loading…</p>
      </main>
    );
  }

  const metric = round.category.metricLabel;
  const verdictClass =
    phase === "correct" || (phase === "sliding" && !gameOver)
      ? "correct"
      : phase === "wrong"
        ? "wrong"
        : "";

  return (
    <main className="game-page">
      <div className="game-topbar">
        <Link to="/moreless" className="back-link">
          &larr; Categories
        </Link>
        <span className="game-title">{round.category.title}</span>
        <div className="scores">
          <span>
            Score <strong>{score}</strong>
          </span>
          <span>
            Best <strong>{best}</strong>
          </span>
        </div>
      </div>

      <div className={`board ${phase === "sliding" ? "sliding" : ""}`}>
        <section className="card known">
          <CardMedia item={left} />
          <div className="card-body">
            <h2>{left.name}</h2>
            {left.subtitle && <p className="card-sub">{left.subtitle}</p>}
            <p className="card-metric">{metric}</p>
            <p className="card-value">{left.displayValue}</p>
          </div>
        </section>

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
            "VS"
          )}
        </div>

        <section className={`card mystery ${verdictClass}`}>
          <CardMedia item={right} />
          <div className="card-body">
            <h2>{right.name}</h2>
            {right.subtitle && <p className="card-sub">{right.subtitle}</p>}
            <p className="card-metric">{metric}</p>
            {revealing ? (
              <p className="card-value">
                {phase === "revealing"
                  ? formatCounting(counted, right.displayValue)
                  : right.displayValue}
              </p>
            ) : (
              <div className="guess-buttons">
                <button className="btn more" onClick={() => guess("more")}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 5 4 15h16z" />
                  </svg>
                  More
                </button>
                <button className="btn less" onClick={() => guess("less")}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 19 4 9h16z" />
                  </svg>
                  Less
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <p className="game-hint">
        Does <strong>{right.name}</strong> have a higher {metric} than{" "}
        <strong>{left.name}</strong>?
      </p>

      {gameOver && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>Game over</h2>
            <p className="final-score">{score}</p>
            <p className="overlay-sub">
              {score >= best && score > 0 ? "New best score!" : `Best: ${best}`}
            </p>
            <div className="overlay-actions">
              <button className="btn primary" onClick={restart}>
                Play again
              </button>
              <Link className="btn ghost" to="/moreless">
                Change category
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
