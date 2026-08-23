import { useEffect } from "react";

interface HowToPlayMoneyleProps {
  onClose: () => void;
}

const EXAMPLE = [
  { name: "Euro", code: "EUR", rate: "1.0850", stronger: true, closeness: 99, correct: false },
  { name: "Japanese Yen", code: "JPY", rate: "0.006700", stronger: false, closeness: 25, correct: false },
  { name: "Chinese Yuan", code: "CNY", rate: "0.14000", stronger: false, closeness: 71, correct: false },
  { name: "US Dollar", code: "USD", rate: "—", stronger: false, closeness: 100, correct: true },
] as const;

export default function HowToPlayMoneyle({ onClose }: HowToPlayMoneyleProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="howto-overlay" onClick={onClose} role="presentation">
      <div
        className="howto-modal moneyle-howto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="moneyle-howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="howto-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="moneyle-howto-title">How to play</h2>
        <p className="howto-sub">Guess the currency on the banknote.</p>

        <div className="howto-demo">
          <div className="howto-moneyle-note">
            <img src="/money/usd/bill-100.webp" alt="US $100 bill" />
          </div>
          <p className="howto-moneyle-caption">Example: a US $100 bill</p>

          <ul className="moneyle-history howto-moneyle-history">
            {EXAMPLE.map((row) => (
              <li key={row.code} className={row.correct ? "correct" : ""}>
                <span className="moneyle-hist-name">
                  {row.name}
                  <small>{row.code}</small>
                </span>
                <span className="moneyle-hist-rate">{row.rate}</span>
                <span
                  className={`moneyle-hist-dir ${row.correct ? "hit" : row.stronger ? "up" : "down"}`}
                >
                  {row.correct ? "✓" : row.stronger ? "↑" : "↓"}
                </span>
                <span className="moneyle-hist-pct">{row.closeness}%</span>
              </li>
            ))}
          </ul>

          <p className="howto-moneyle-explain">
            The number is a mid-market US dollar rate from around 00:00 UTC — how many
            dollars one unit of that currency is worth. The percentage is how close that
            value is to the hidden currency: higher means closer. ↑ means your guess is
            stronger than the hidden note; ↓ means weaker.
          </p>

          <ol className="guessr-howto-steps">
            <li>A banknote sits behind frosted glass. You get 6 guesses.</li>
            <li>The frost thins after each miss.</li>
            <li>
              After the note is revealed, an optional bonus round asks about that country’s
              flag, GDP, population, and GDP per person.
            </li>
          </ol>
          <p className="howto-rounds">
            A new note each day, the same for everyone. Rates are a daily snapshot, so they
            can differ from live quotes.
          </p>
        </div>
      </div>
    </div>
  );
}
